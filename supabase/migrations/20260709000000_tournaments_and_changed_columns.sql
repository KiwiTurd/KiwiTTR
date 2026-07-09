create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete restrict,
  name text not null,
  tournament_date date not null,
  player_count integer not null check (
    player_count between 2 and 256
  ),
  format text not null check (
    format in ('knockout', 'pools', 'doubles')
  ),
  pool_size integer not null default 4 check (
    pool_size between 2 and 16
  ),
  progressing integer not null default 2 check (
    progressing >= 0
  ),
  seed_by_ttr boolean not null default true,
  social_play boolean not null default false,
  status text not null default 'draft' check (
    status in ('draft', 'active', 'completed', 'cancelled')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tournament_players (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  app_player_id text not null,
  player_id uuid references public.players(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  club_id uuid not null references public.clubs(id) on delete restrict,
  pair_player_one_id uuid references public.players(id) on delete set null,
  pair_player_two_id uuid references public.players(id) on delete set null,
  first_name text not null,
  last_name text not null,
  mobile text not null default '',
  email text not null default '',
  rating integer not null default 0,
  highest_rating integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  matches_played integer not null default 0,
  provisional_matches_remaining integer not null default 0,
  rating_reliability numeric not null default 0,
  is_active boolean not null default true,
  seed_position integer,
  is_pair boolean not null default false,
  source_created_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tournament_id, app_player_id)
);

create table if not exists public.tournament_pools (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  app_pool_id text not null,
  name text not null,
  position integer not null,
  created_at timestamptz not null default now(),
  unique (tournament_id, app_pool_id),
  unique (tournament_id, position)
);

create table if not exists public.tournament_pool_players (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  pool_id uuid not null references public.tournament_pools(id) on delete cascade,
  tournament_player_id uuid not null references public.tournament_players(id) on delete cascade,
  position integer not null,
  created_at timestamptz not null default now(),
  unique (pool_id, tournament_player_id),
  unique (pool_id, position)
);

create table if not exists public.knockout_rounds (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round_number integer not null,
  name text not null,
  position integer not null,
  created_at timestamptz not null default now(),
  unique (tournament_id, round_number),
  unique (tournament_id, position)
);

create table if not exists public.tournament_matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  app_match_id text not null,
  stage text not null check (stage in ('pool', 'knockout')),
  pool_id uuid references public.tournament_pools(id) on delete set null,
  knockout_round_id uuid references public.knockout_rounds(id) on delete set null,
  player_one_id uuid references public.tournament_players(id) on delete set null,
  player_two_id uuid references public.tournament_players(id) on delete set null,
  winner_id uuid references public.tournament_players(id) on delete set null,
  recorded_match_id uuid references public.matches(id) on delete set null,
  round_number integer,
  position integer,
  table_number integer,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tournament_id, app_match_id)
);

create table if not exists public.tournament_match_sets (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  tournament_match_id uuid not null references public.tournament_matches(id) on delete cascade,
  set_number integer not null,
  raw_score text not null,
  player_one_score integer,
  player_two_score integer,
  created_at timestamptz not null default now(),
  unique (tournament_match_id, set_number)
);

create table if not exists public.knockout_matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  tournament_match_id uuid not null references public.tournament_matches(id) on delete cascade,
  knockout_round_id uuid not null references public.knockout_rounds(id) on delete cascade,
  position integer not null,
  next_tournament_match_id uuid references public.tournament_matches(id) on delete set null,
  next_slot text check (next_slot in ('player_one', 'player_two')),
  created_at timestamptz not null default now(),
  unique (tournament_match_id),
  unique (knockout_round_id, position)
);

create index if not exists tournaments_club_id_idx
  on public.tournaments(club_id);

create index if not exists tournaments_updated_at_idx
  on public.tournaments(updated_at desc);

create index if not exists tournament_players_tournament_id_idx
  on public.tournament_players(tournament_id);

create index if not exists tournament_players_player_id_idx
  on public.tournament_players(player_id);

create index if not exists tournament_pools_tournament_id_idx
  on public.tournament_pools(tournament_id);

create index if not exists tournament_pool_players_tournament_id_idx
  on public.tournament_pool_players(tournament_id);

create index if not exists tournament_pool_players_pool_id_idx
  on public.tournament_pool_players(pool_id);

create index if not exists knockout_rounds_tournament_id_idx
  on public.knockout_rounds(tournament_id);

create index if not exists tournament_matches_tournament_id_idx
  on public.tournament_matches(tournament_id);

create index if not exists tournament_matches_pool_id_idx
  on public.tournament_matches(pool_id);

create index if not exists tournament_matches_recorded_match_id_idx
  on public.tournament_matches(recorded_match_id);

create index if not exists tournament_match_sets_tournament_match_id_idx
  on public.tournament_match_sets(tournament_match_id);

create index if not exists knockout_matches_tournament_id_idx
  on public.knockout_matches(tournament_id);

do $$
begin
  if not exists (
    select 1
    from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'set_tournaments_updated_at'
  ) then
    execute $sql$
      create function public.set_tournaments_updated_at()
      returns trigger
      language plpgsql
      as $function$
      begin
        new.updated_at = now();
        return new;
      end;
      $function$
    $sql$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_tournaments_updated_at'
      and tgrelid = 'public.tournaments'::regclass
  ) then
    execute $sql$
      create trigger set_tournaments_updated_at
      before update on public.tournaments
      for each row
      execute function public.set_tournaments_updated_at()
    $sql$;
  end if;
end $$;

alter table public.tournaments enable row level security;
alter table public.tournament_players enable row level security;
alter table public.tournament_pools enable row level security;
alter table public.tournament_pool_players enable row level security;
alter table public.knockout_rounds enable row level security;
alter table public.tournament_matches enable row level security;
alter table public.tournament_match_sets enable row level security;
alter table public.knockout_matches enable row level security;

do $$
declare
  policy_table_name text;
begin
  foreach policy_table_name in array array[
    'tournaments',
    'tournament_players',
    'tournament_pools',
    'tournament_pool_players',
    'knockout_rounds',
    'tournament_matches',
    'tournament_match_sets',
    'knockout_matches'
  ]
  loop
    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = policy_table_name
        and policyname = 'Anyone can view tournament data'
    ) then
      execute format(
        'create policy "Anyone can view tournament data" on public.%I for select using (true)',
        policy_table_name
      );
    end if;
  end loop;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tournaments'
      and policyname = 'Tournament managers can modify tournaments'
  ) then
    execute $sql$
      create policy "Tournament managers can modify tournaments"
        on public.tournaments
        for all
        to authenticated
        using (
          exists (
            select 1
            from public.profiles
            where profiles.id = auth.uid()
              and (
                profiles.role = 'admin'
                or (
                  profiles.role = 'club_admin'
                  and profiles.club_id = tournaments.club_id
                )
              )
          )
        )
        with check (
          exists (
            select 1
            from public.profiles
            where profiles.id = auth.uid()
              and (
                profiles.role = 'admin'
                or (
                  profiles.role = 'club_admin'
                  and profiles.club_id = tournaments.club_id
                )
              )
          )
        )
    $sql$;
  end if;
end $$;

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
    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = policy_table_name
        and policyname = 'Tournament managers can modify tournament data'
    ) then
      execute format(
        $policy$
          create policy "Tournament managers can modify tournament data"
            on public.%I
            for all
            to authenticated
            using (
              exists (
                select 1
                from public.tournaments
                join public.profiles
                  on profiles.id = auth.uid()
                where tournaments.id = tournament_id
                  and (
                    profiles.role = 'admin'
                    or (
                      profiles.role = 'club_admin'
                      and profiles.club_id = tournaments.club_id
                    )
                  )
              )
            )
            with check (
              exists (
                select 1
                from public.tournaments
                join public.profiles
                  on profiles.id = auth.uid()
                where tournaments.id = tournament_id
                  and (
                    profiles.role = 'admin'
                    or (
                      profiles.role = 'club_admin'
                      and profiles.club_id = tournaments.club_id
                    )
                  )
              )
            )
        $policy$,
        policy_table_name
      );
    end if;
  end loop;
end $$;
