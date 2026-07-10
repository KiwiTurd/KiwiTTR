create table if not exists public.team_games (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete set null,
  home_club_id uuid not null references public.clubs(id) on delete restrict,
  away_club_id uuid not null references public.clubs(id) on delete restrict,
  location_club_id uuid references public.clubs(id) on delete set null,
  name text not null,
  event_description text not null default '',
  game_date date not null,
  start_time time,
  format text not null check (
    format in ('classic-6', 'classic-3', 'abc-123', 'custom')
  ),
  status text not null default 'draft' check (
    status in ('draft', 'live', 'submitted', 'completed', 'cancelled')
  ),
  target_score integer not null default 9 check (target_score >= 1),
  players_per_team integer not null default 6 check (
    players_per_team between 1 and 12
  ),
  ordering text not null default 'ttr-auto' check (
    ordering in ('ttr-auto', 'manual')
  ),
  event_level text not null default 'ttr' check (
    event_level in ('ttr', 'social')
  ),
  match_mode text not null default 'first-to' check (
    match_mode in ('first-to', 'play-through', 'best-of')
  ),
  total_games integer not null default 16 check (
    total_games between 1 and 64
  ),
  doubles_included boolean not null default true,
  settings jsonb not null default '{}'::jsonb,
  home_confirmed boolean not null default false,
  away_confirmed boolean not null default false,
  submitted boolean not null default false,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint team_games_distinct_clubs check (home_club_id <> away_club_id)
);

create table if not exists public.team_game_players (
  id uuid primary key default gen_random_uuid(),
  team_game_id uuid not null references public.team_games(id) on delete cascade,
  app_player_id text not null,
  player_id uuid references public.players(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  club_id uuid not null references public.clubs(id) on delete restrict,
  side text not null check (side in ('home', 'away')),
  position integer not null check (position >= 1),
  slot_label text not null,
  first_name text not null,
  last_name text not null,
  rating integer not null default 0,
  highest_rating integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  matches_played integer not null default 0,
  provisional_matches_remaining integer not null default 0,
  rating_reliability numeric not null default 0,
  is_active boolean not null default true,
  is_club_sub boolean not null default false,
  source_created_at timestamptz,
  created_at timestamptz not null default now(),
  unique (team_game_id, app_player_id),
  unique (team_game_id, side, position)
);

create table if not exists public.team_game_doubles_pairs (
  id uuid primary key default gen_random_uuid(),
  team_game_id uuid not null references public.team_games(id) on delete cascade,
  side text not null check (side in ('home', 'away')),
  pair_number integer not null check (pair_number >= 1),
  player_one_id uuid references public.team_game_players(id) on delete set null,
  player_two_id uuid references public.team_game_players(id) on delete set null,
  label text not null,
  created_at timestamptz not null default now(),
  unique (team_game_id, side, pair_number),
  constraint team_game_doubles_distinct_players check (
    player_one_id is null
    or player_two_id is null
    or player_one_id <> player_two_id
  )
);

create table if not exists public.team_game_matches (
  id uuid primary key default gen_random_uuid(),
  team_game_id uuid not null references public.team_games(id) on delete cascade,
  app_match_id text not null,
  order_number integer not null check (order_number >= 1),
  phase text not null check (
    phase in ('doubles', 'singles-one', 'singles-two', 'custom')
  ),
  label text not null,
  status text not null default 'pending' check (
    status in ('pending', 'live', 'completed')
  ),
  winner_side text check (winner_side in ('home', 'away')),
  counts_for_ttr boolean not null default true,
  counts_for_team_score boolean not null default true,
  recorded_match_id uuid references public.matches(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_game_id, app_match_id),
  unique (team_game_id, order_number)
);

create table if not exists public.team_game_match_players (
  id uuid primary key default gen_random_uuid(),
  team_game_id uuid not null references public.team_games(id) on delete cascade,
  team_game_match_id uuid not null references public.team_game_matches(id) on delete cascade,
  team_game_player_id uuid not null references public.team_game_players(id) on delete cascade,
  side text not null check (side in ('home', 'away')),
  position integer not null check (position >= 1),
  created_at timestamptz not null default now(),
  unique (team_game_match_id, side, position),
  unique (team_game_match_id, team_game_player_id)
);

create table if not exists public.team_game_match_sets (
  id uuid primary key default gen_random_uuid(),
  team_game_id uuid not null references public.team_games(id) on delete cascade,
  team_game_match_id uuid not null references public.team_game_matches(id) on delete cascade,
  set_number integer not null check (set_number between 1 and 5),
  raw_score text not null,
  home_score integer not null check (home_score >= 0),
  away_score integer not null check (away_score >= 0),
  submitted_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_game_match_id, set_number),
  constraint team_game_match_sets_not_drawn check (home_score <> away_score)
);

create table if not exists public.team_game_confirmations (
  id uuid primary key default gen_random_uuid(),
  team_game_id uuid not null references public.team_games(id) on delete cascade,
  side text not null check (side in ('home', 'away')),
  confirmed_by_profile_id uuid references public.profiles(id) on delete set null,
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (team_game_id, side)
);

create index if not exists team_games_event_id_idx
  on public.team_games(event_id);

create index if not exists team_games_home_club_id_idx
  on public.team_games(home_club_id);

create index if not exists team_games_away_club_id_idx
  on public.team_games(away_club_id);

create index if not exists team_games_location_club_id_idx
  on public.team_games(location_club_id);

create index if not exists team_games_updated_at_idx
  on public.team_games(updated_at desc);

create index if not exists team_game_players_team_game_id_idx
  on public.team_game_players(team_game_id);

create index if not exists team_game_players_player_id_idx
  on public.team_game_players(player_id);

create index if not exists team_game_players_club_id_idx
  on public.team_game_players(club_id);

create index if not exists team_game_doubles_pairs_team_game_id_idx
  on public.team_game_doubles_pairs(team_game_id);

create index if not exists team_game_matches_team_game_id_idx
  on public.team_game_matches(team_game_id);

create index if not exists team_game_matches_recorded_match_id_idx
  on public.team_game_matches(recorded_match_id);

create index if not exists team_game_match_players_team_game_id_idx
  on public.team_game_match_players(team_game_id);

create index if not exists team_game_match_players_match_id_idx
  on public.team_game_match_players(team_game_match_id);

create index if not exists team_game_match_sets_team_game_id_idx
  on public.team_game_match_sets(team_game_id);

create index if not exists team_game_match_sets_match_id_idx
  on public.team_game_match_sets(team_game_match_id);

create index if not exists team_game_confirmations_team_game_id_idx
  on public.team_game_confirmations(team_game_id);

do $$
begin
  if not exists (
    select 1
    from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'set_team_games_updated_at'
  ) then
    execute $sql$
      create function public.set_team_games_updated_at()
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
    where tgname = 'set_team_games_updated_at'
      and tgrelid = 'public.team_games'::regclass
  ) then
    execute $sql$
      create trigger set_team_games_updated_at
      before update on public.team_games
      for each row
      execute function public.set_team_games_updated_at()
    $sql$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_team_game_matches_updated_at'
      and tgrelid = 'public.team_game_matches'::regclass
  ) then
    execute $sql$
      create trigger set_team_game_matches_updated_at
      before update on public.team_game_matches
      for each row
      execute function public.set_team_games_updated_at()
    $sql$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_team_game_match_sets_updated_at'
      and tgrelid = 'public.team_game_match_sets'::regclass
  ) then
    execute $sql$
      create trigger set_team_game_match_sets_updated_at
      before update on public.team_game_match_sets
      for each row
      execute function public.set_team_games_updated_at()
    $sql$;
  end if;
end $$;

alter table public.team_games enable row level security;
alter table public.team_game_players enable row level security;
alter table public.team_game_doubles_pairs enable row level security;
alter table public.team_game_matches enable row level security;
alter table public.team_game_match_players enable row level security;
alter table public.team_game_match_sets enable row level security;
alter table public.team_game_confirmations enable row level security;

do $$
declare
  policy_table_name text;
begin
  foreach policy_table_name in array array[
    'team_games',
    'team_game_players',
    'team_game_doubles_pairs',
    'team_game_matches',
    'team_game_match_players',
    'team_game_match_sets',
    'team_game_confirmations'
  ]
  loop
    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = policy_table_name
        and policyname = 'Anyone can view team game data'
    ) then
      execute format(
        'create policy "Anyone can view team game data" on public.%I for select using (true)',
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
      and tablename = 'team_games'
      and policyname = 'Team game managers can modify team games'
  ) then
    execute $sql$
      create policy "Team game managers can modify team games"
        on public.team_games
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
                  and profiles.club_id in (
                    team_games.home_club_id,
                    team_games.away_club_id,
                    team_games.location_club_id
                  )
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
                  and profiles.club_id in (
                    team_games.home_club_id,
                    team_games.away_club_id,
                    team_games.location_club_id
                  )
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
    'team_game_players',
    'team_game_doubles_pairs',
    'team_game_matches',
    'team_game_match_players',
    'team_game_match_sets',
    'team_game_confirmations'
  ]
  loop
    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = policy_table_name
        and policyname = 'Team game managers can modify team game data'
    ) then
      execute format(
        $policy$
          create policy "Team game managers can modify team game data"
            on public.%I
            for all
            to authenticated
            using (
              exists (
                select 1
                from public.team_games
                join public.profiles
                  on profiles.id = auth.uid()
                where team_games.id = team_game_id
                  and (
                    profiles.role = 'admin'
                    or (
                      profiles.role = 'club_admin'
                      and profiles.club_id in (
                        team_games.home_club_id,
                        team_games.away_club_id,
                        team_games.location_club_id
                      )
                    )
                  )
              )
            )
            with check (
              exists (
                select 1
                from public.team_games
                join public.profiles
                  on profiles.id = auth.uid()
                where team_games.id = team_game_id
                  and (
                    profiles.role = 'admin'
                    or (
                      profiles.role = 'club_admin'
                      and profiles.club_id in (
                        team_games.home_club_id,
                        team_games.away_club_id,
                        team_games.location_club_id
                      )
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
