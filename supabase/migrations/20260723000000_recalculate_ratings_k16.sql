-- Recalculate the complete KiwiTTR ledger with a base K-factor of 16.
--
-- Match outcomes, participants, timestamps, and set scores are preserved.
-- Only rating-derived match fields, rating history, and cached player rating
-- statistics are rebuilt.

begin;

lock table public.players in access exclusive mode;
lock table public.matches in access exclusive mode;
lock table public.rating_history in access exclusive mode;

-- Fixed results remain immutable to normal application users. This one-off,
-- transaction-scoped administrative replay must update their derived rating
-- snapshots, so disable only the editing-window trigger while replaying.
alter table public.matches
  disable trigger enforce_match_editing_window;

do $$
declare
  match_row public.matches%rowtype;
  winner_state record;
  loser_state record;
  expected_winner double precision;
  winner_change integer;
  loser_change integer;
  winner_after integer;
  loser_after integer;
begin
  if exists (
    select 1
    from public.matches
    where winner_id is null
       or loser_id is null
       or winner_id = loser_id
       or winner_id not in (player1_id, player2_id)
       or loser_id not in (player1_id, player2_id)
  ) then
    raise exception
      'Rating replay aborted: one or more matches have invalid participants.';
  end if;

  if exists (
    select 1
    from public.matches as match
    where not exists (
      select 1
      from public.players
      where players.id = match.winner_id
    )
       or not exists (
         select 1
         from public.players
         where players.id = match.loser_id
       )
  ) then
    raise exception
      'Rating replay aborted: one or more match participants are missing.';
  end if;

  if exists (
    select 1
    from public.players
    where initial_rating is null
  ) then
    raise exception
      'Rating replay aborted: one or more players have no initial rating.';
  end if;

  create temporary table rating_replay_state (
    player_id uuid primary key,
    rating integer not null,
    highest_rating integer not null,
    wins integer not null default 0,
    losses integer not null default 0,
    matches_played integer not null default 0,
    provisional_matches_remaining integer not null default 10
  ) on commit drop;

  insert into rating_replay_state (
    player_id,
    rating,
    highest_rating
  )
  select
    id,
    initial_rating,
    initial_rating
  from public.players;

  -- Existing history can contain duplicate rows left by an earlier replay.
  -- Rebuilding it from the canonical match ledger guarantees two rows per
  -- match and keeps graphs consistent with the recalculated snapshots.
  delete from public.rating_history;

  for match_row in
    select *
    from public.matches
    order by played_at, id
  loop
    select *
    into strict winner_state
    from rating_replay_state
    where player_id = match_row.winner_id;

    select *
    into strict loser_state
    from rating_replay_state
    where player_id = match_row.loser_id;

    expected_winner :=
      1.0 / (
        1.0 + power(
          10.0,
          (loser_state.rating - winner_state.rating) / 400.0
        )
      );

    winner_change := round(
      16.0
      * (1.0 - expected_winner)
      * (
        1.0
        + winner_state.provisional_matches_remaining / 10.0
      )
    );
    loser_change := -round(
      16.0
      * (1.0 - expected_winner)
      * (
        1.0
        + loser_state.provisional_matches_remaining / 10.0
      )
    );

    winner_after := winner_state.rating + winner_change;
    loser_after := loser_state.rating + loser_change;

    update public.matches
    set
      winner_rating_before = winner_state.rating,
      winner_rating_after = winner_after,
      loser_rating_before = loser_state.rating,
      loser_rating_after = loser_after,
      winner_rating_change = winner_change,
      loser_rating_change = loser_change
    where id = match_row.id;

    insert into public.rating_history (
      player_id,
      match_id,
      rating_before,
      rating_after,
      rating_change,
      recorded_at
    )
    values
      (
        match_row.winner_id,
        match_row.id,
        winner_state.rating,
        winner_after,
        winner_change,
        match_row.played_at
      ),
      (
        match_row.loser_id,
        match_row.id,
        loser_state.rating,
        loser_after,
        loser_change,
        match_row.played_at
      );

    update rating_replay_state
    set
      rating = winner_after,
      highest_rating = greatest(highest_rating, winner_after),
      wins = wins + 1,
      matches_played = matches_played + 1,
      provisional_matches_remaining = greatest(
        0,
        provisional_matches_remaining - 1
      )
    where player_id = match_row.winner_id;

    update rating_replay_state
    set
      rating = loser_after,
      losses = losses + 1,
      matches_played = matches_played + 1,
      provisional_matches_remaining = greatest(
        0,
        provisional_matches_remaining - 1
      )
    where player_id = match_row.loser_id;
  end loop;

  update public.players as player
  set
    rating = state.rating,
    highest_rating = state.highest_rating,
    wins = state.wins,
    losses = state.losses,
    matches_played = state.matches_played,
    provisional_matches_remaining =
      state.provisional_matches_remaining
  from rating_replay_state as state
  where player.id = state.player_id;

  if (
    select count(*)
    from public.rating_history
  ) <> 2 * (
    select count(*)
    from public.matches
  ) then
    raise exception
      'Rating replay aborted: rating-history row count is invalid.';
  end if;

  if exists (
    select 1
    from public.matches as match
    left join public.rating_history as winner_history
      on winner_history.match_id = match.id
     and winner_history.player_id = match.winner_id
    left join public.rating_history as loser_history
      on loser_history.match_id = match.id
     and loser_history.player_id = match.loser_id
    where winner_history.id is null
       or loser_history.id is null
       or winner_history.rating_before
          is distinct from match.winner_rating_before
       or winner_history.rating_after
          is distinct from match.winner_rating_after
       or winner_history.rating_change
          is distinct from match.winner_rating_change
       or loser_history.rating_before
          is distinct from match.loser_rating_before
       or loser_history.rating_after
          is distinct from match.loser_rating_after
       or loser_history.rating_change
          is distinct from match.loser_rating_change
  ) then
    raise exception
      'Rating replay aborted: match snapshots and history do not agree.';
  end if;

  if exists (
    select 1
    from public.players as player
    join rating_replay_state as state
      on state.player_id = player.id
    where player.rating is distinct from state.rating
       or player.highest_rating is distinct from state.highest_rating
       or player.wins is distinct from state.wins
       or player.losses is distinct from state.losses
       or player.matches_played is distinct from state.matches_played
       or player.provisional_matches_remaining
          is distinct from state.provisional_matches_remaining
  ) then
    raise exception
      'Rating replay aborted: cached player statistics do not agree.';
  end if;
end;
$$;

alter table public.matches
  enable trigger enforce_match_editing_window;

commit;
