alter table public.players
  add column if not exists initial_rating integer;

with match_ratings as (
  select
    winner_id as player_id,
    winner_rating_before as rating_before,
    played_at,
    id as match_id
  from public.matches

  union all

  select
    loser_id as player_id,
    loser_rating_before as rating_before,
    played_at,
    id as match_id
  from public.matches
), earliest_rating as (
  select distinct on (player_id)
    player_id,
    rating_before
  from match_ratings
  order by player_id, played_at, match_id
)
update public.players as player
set initial_rating = earliest.rating_before
from earliest_rating as earliest
where player.id = earliest.player_id
  and player.initial_rating is null;

update public.players
set initial_rating = rating
where initial_rating is null;

-- Hyrum has no surviving matches or rating ledger. Restore the confirmed
-- initial rating only while the row is still in the audited orphaned state.
update public.players as player
set
  rating = 1500,
  initial_rating = 1500,
  highest_rating = 1500,
  provisional_matches_remaining = 10
where player.id = 'f192c72b-3ba8-463b-a80a-e973e406f397'
  and player.rating = 1446
  and player.highest_rating = 1652
  and player.matches_played = 0
  and player.wins = 0
  and player.losses = 0
  and not exists (
    select 1
    from public.matches
    where matches.player1_id = player.id
       or matches.player2_id = player.id
  )
  and not exists (
    select 1
    from public.rating_history
    where rating_history.player_id = player.id
  );

-- Provisional status always spans the first ten rated matches. Reconcile any
-- rows created while the application incorrectly used twenty.
update public.players
set provisional_matches_remaining = greatest(
  0,
  10 - matches_played
)
where provisional_matches_remaining is distinct from greatest(
  0,
  10 - matches_played
);

alter table public.players
  alter column initial_rating set not null;

create or replace function public.set_player_initial_rating()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.initial_rating is null then
    new.initial_rating = new.rating;
  end if;

  return new;
end;
$$;

drop trigger if exists set_player_initial_rating
  on public.players;

create trigger set_player_initial_rating
before insert on public.players
for each row
execute function public.set_player_initial_rating();
