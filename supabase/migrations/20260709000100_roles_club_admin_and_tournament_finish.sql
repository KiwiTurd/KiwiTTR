update public.profiles
set role = case role
  when 'club_leader' then 'club_admin'
  when 'member' then 'player'
  else role
end
where role in ('club_leader', 'member');

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'clubs'
      and policyname = 'Club admins can update their own club'
  ) then
    execute $sql$
      create policy "Club admins can update their own club"
        on public.clubs
        for update
        to authenticated
        using (
          exists (
            select 1
            from public.profiles
            where profiles.id = auth.uid()
              and profiles.role = 'club_admin'
              and profiles.club_id = clubs.id
          )
        )
        with check (
          exists (
            select 1
            from public.profiles
            where profiles.id = auth.uid()
              and profiles.role = 'club_admin'
              and profiles.club_id = clubs.id
          )
        )
    $sql$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'players'
      and policyname = 'Club admins can update own club players'
  ) then
    execute $sql$
      create policy "Club admins can update own club players"
        on public.players
        for update
        to authenticated
        using (
          exists (
            select 1
            from public.profiles
            where profiles.id = auth.uid()
              and profiles.role = 'club_admin'
              and profiles.club_id = players.club_id
          )
        )
        with check (
          exists (
            select 1
            from public.profiles
            where profiles.id = auth.uid()
              and profiles.role = 'club_admin'
              and profiles.club_id = players.club_id
          )
        )
    $sql$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'events'
      and policyname = 'Club admins can insert own club events'
  ) then
    execute $sql$
      create policy "Club admins can insert own club events"
        on public.events
        for insert
        to authenticated
        with check (
          exists (
            select 1
            from public.profiles
            where profiles.id = auth.uid()
              and profiles.role = 'club_admin'
              and profiles.club_id = events.club_id
          )
        )
    $sql$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'events'
      and policyname = 'Club admins can update own club events'
  ) then
    execute $sql$
      create policy "Club admins can update own club events"
        on public.events
        for update
        to authenticated
        using (
          exists (
            select 1
            from public.profiles
            where profiles.id = auth.uid()
              and profiles.role = 'club_admin'
              and profiles.club_id = events.club_id
          )
        )
        with check (
          exists (
            select 1
            from public.profiles
            where profiles.id = auth.uid()
              and profiles.role = 'club_admin'
              and profiles.club_id = events.club_id
          )
        )
    $sql$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'matches'
      and policyname = 'Club admins can insert own club event matches'
  ) then
    execute $sql$
      create policy "Club admins can insert own club event matches"
        on public.matches
        for insert
        to authenticated
        with check (
          exists (
            select 1
            from public.events
            join public.profiles
              on profiles.id = auth.uid()
            where events.id = matches.event_id
              and profiles.role = 'club_admin'
              and profiles.club_id = events.club_id
          )
        )
    $sql$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'match_sets'
      and policyname = 'Anyone can view match sets'
  ) then
    execute $sql$
      create policy "Anyone can view match sets"
        on public.match_sets
        for select
        using (true)
    $sql$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'match_sets'
      and policyname = 'Admins can insert match sets'
  ) then
    execute $sql$
      create policy "Admins can insert match sets"
        on public.match_sets
        for insert
        to authenticated
        with check (
          exists (
            select 1
            from public.profiles
            where profiles.id = auth.uid()
              and profiles.role = 'admin'
          )
        )
    $sql$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'match_sets'
      and policyname = 'Club admins can insert own club event match sets'
  ) then
    execute $sql$
      create policy "Club admins can insert own club event match sets"
        on public.match_sets
        for insert
        to authenticated
        with check (
          exists (
            select 1
            from public.matches
            join public.events
              on events.id = matches.event_id
            join public.profiles
              on profiles.id = auth.uid()
            where matches.id = match_sets.match_id
              and profiles.role = 'club_admin'
              and profiles.club_id = events.club_id
          )
        )
    $sql$;
  end if;
end $$;
