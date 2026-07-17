alter table public.tournaments
  add column if not exists event_type text not null default 'tournament',
  add column if not exists round_robin_count integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tournaments_event_type_check'
      and conrelid = 'public.tournaments'::regclass
  ) then
    alter table public.tournaments
      add constraint tournaments_event_type_check
      check (event_type in ('tournament', 'club-round-robin'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'tournaments_round_robin_count_check'
      and conrelid = 'public.tournaments'::regclass
  ) then
    alter table public.tournaments
      add constraint tournaments_round_robin_count_check
      check (round_robin_count is null or round_robin_count between 1 and 32);
  end if;
end $$;

create index if not exists tournaments_event_type_club_date_idx
  on public.tournaments(event_type, club_id, tournament_date desc);

create or replace function public.can_view_tournament(
  check_tournament_id uuid
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
    where tournaments.id = check_tournament_id
      and (
        tournaments.event_type <> 'club-round-robin'
        or exists (
          select 1
          from public.profiles
          where profiles.id = auth.uid()
            and profiles.status = 'active'
            and (
              profiles.role = 'admin'
              or profiles.club_id = tournaments.club_id
            )
        )
      )
  );
$$;

revoke all on function public.can_view_tournament(uuid) from public;
grant execute on function public.can_view_tournament(uuid) to anon, authenticated;

drop policy if exists "Anyone can view tournament data"
  on public.tournaments;
create policy "Eligible users can view tournament data"
  on public.tournaments
  for select
  using (public.can_view_tournament(id));

do $$
declare
  policy_table_name text;
begin
  foreach policy_table_name in array array[
    'tournament_players',
    'tournament_pools',
    'tournament_pool_players',
    'knockout_rounds',
    'tournament_matches',
    'tournament_match_sets',
    'knockout_matches'
  ]
  loop
    execute format(
      'drop policy if exists "Anyone can view tournament data" on public.%I',
      policy_table_name
    );
    execute format(
      'create policy "Eligible users can view tournament data" on public.%I for select using (public.can_view_tournament(tournament_id))',
      policy_table_name
    );
  end loop;
end $$;
