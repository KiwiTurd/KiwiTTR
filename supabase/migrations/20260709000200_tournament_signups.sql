alter table public.tournaments
  add column if not exists allow_sign_up boolean not null default false;

alter table public.tournaments
  add column if not exists player_limit_enabled boolean not null default true;

alter table public.tournaments
  add column if not exists ttr_limit_enabled boolean not null default false,
  add column if not exists ttr_limit integer check (
    ttr_limit is null or ttr_limit >= 0
  );

create unique index if not exists tournament_players_tournament_player_unique_idx
  on public.tournament_players(tournament_id, player_id)
  where player_id is not null;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tournament_players'
      and policyname = 'Linked players can sign up for open tournaments'
  ) then
    execute $sql$
      create policy "Linked players can sign up for open tournaments"
        on public.tournament_players
        for insert
        to authenticated
        with check (
          player_id is not null
          and app_player_id = player_id::text
          and profile_id = auth.uid()
          and exists (
            select 1
            from public.profiles
            where profiles.id = auth.uid()
              and profiles.player_id = tournament_players.player_id
          )
          and exists (
            select 1
            from public.tournaments
            where tournaments.id = tournament_players.tournament_id
              and tournaments.allow_sign_up = true
              and tournaments.status = 'draft'
              and (
                tournaments.ttr_limit_enabled = false
                or tournaments.ttr_limit is null
                or exists (
                  select 1
                  from public.players
                  where players.id = tournament_players.player_id
                    and players.rating <= tournaments.ttr_limit
                )
              )
              and not exists (
                select 1
                from public.tournament_pools
                where tournament_pools.tournament_id = tournaments.id
              )
              and not exists (
                select 1
                from public.tournament_matches
                where tournament_matches.tournament_id = tournaments.id
              )
              and not exists (
                select 1
                from public.knockout_rounds
                where knockout_rounds.tournament_id = tournaments.id
              )
          )
        )
    $sql$;
  end if;
end $$;
