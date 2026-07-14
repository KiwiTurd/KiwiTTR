alter table public.players
  add column if not exists avatar_url text;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'player-avatars',
  'player-avatars',
  true,
  1048576,
  array['image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Players can read their own avatar objects"
  on storage.objects;
create policy "Players can read their own avatar objects"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'player-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Players can upload their own avatar"
  on storage.objects;
create policy "Players can upload their own avatar"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'player-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Players can update their own avatar"
  on storage.objects;
create policy "Players can update their own avatar"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'player-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'player-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create or replace function public.update_own_player_avatar(
  new_avatar_url text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.players
  set avatar_url = nullif(trim(coalesce(new_avatar_url, '')), '')
  where id = (
    select profiles.player_id
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.status = 'active'
  )
    and profile_id = auth.uid();

  if not found then
    raise exception 'No linked player profile is available for this account.';
  end if;
end;
$$;

revoke all on function public.update_own_player_avatar(text) from public;
grant execute on function public.update_own_player_avatar(text) to authenticated;
