delete from public.events
where id in (
  '2242b2fc-8086-4b11-a4ee-8d22b56f5692',
  '6b504046-5344-45f6-bc04-f17788b7e156',
  '17183706-7262-4c59-8722-0002837dc15c'
)
and not exists (
  select 1
  from public.matches
  where matches.event_id = events.id
);

drop policy if exists "Event managers can delete events"
  on public.events;

create policy "Event managers can delete events"
  on public.events
  for delete
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
            and profiles.club_id = events.club_id
          )
        )
    )
  );
