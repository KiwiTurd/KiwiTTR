drop policy if exists "Club admins can insert own club players"
  on public.players;

create policy "Club admins can insert own club players"
  on public.players
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'club_admin'
        and profiles.status = 'active'
        and profiles.club_id = players.club_id
    )
  );
