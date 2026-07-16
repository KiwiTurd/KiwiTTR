alter table public.tournaments
  add column if not exists age_limit integer check (
    age_limit is null or age_limit between 1 and 120
  ),
  add column if not exists age_minimum integer check (
    age_minimum is null or age_minimum between 1 and 120
  ),
  add column if not exists gender text not null default 'open' check (
    gender in ('open', 'female', 'male')
  );

alter table public.tournaments
  drop constraint if exists tournaments_age_range_valid;

alter table public.tournaments
  add constraint tournaments_age_range_valid
  check (
    age_limit is null
    or age_minimum is null
    or age_minimum <= age_limit
  );

create or replace function public.is_player_eligible_for_tournament(
  check_tournament_id uuid,
  check_player_id uuid
)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.tournaments
    left join public.player_private_details
      on player_private_details.player_id = check_player_id
    where tournaments.id = check_tournament_id
      and exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
          and profiles.player_id = check_player_id
          and profiles.status = 'active'
      )
      and (
        tournaments.age_limit is null
        or (
          player_private_details.birth_date is not null
          and extract(
            year from age(
              tournaments.tournament_date,
              player_private_details.birth_date
            )
          )::integer < tournaments.age_limit
        )
      )
      and (
        tournaments.age_minimum is null
        or (
          player_private_details.birth_date is not null
          and extract(
            year from age(
              tournaments.tournament_date,
              player_private_details.birth_date
            )
          )::integer >= tournaments.age_minimum
        )
      )
      and (
        tournaments.gender = 'open'
        or player_private_details.gender = tournaments.gender
      )
  );
$$;

revoke all on function public.is_player_eligible_for_tournament(uuid, uuid)
  from public;
grant execute on function public.is_player_eligible_for_tournament(uuid, uuid)
  to authenticated;

alter policy "Linked players can sign up for open tournaments"
  on public.tournament_players
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
          tournaments.signup_closes_at is null
          or timezone('Pacific/Auckland', now())::date <=
            tournaments.signup_closes_at
        )
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
        and public.is_player_eligible_for_tournament(
          tournament_players.tournament_id,
          tournament_players.player_id
        )
    )
  );
