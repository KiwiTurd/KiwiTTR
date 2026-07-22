-- Keep the application profile table in sync with Supabase Auth. The profile
-- is deliberately created by a security-definer trigger because a newly
-- registered, unconfirmed user cannot insert through the profiles RLS policy.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (
    id,
    first_name,
    last_name,
    email,
    role,
    status
  )
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'last_name'), ''),
    new.email,
    'player',
    'active'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Repair accounts created while the trigger was absent. Existing profiles are
-- never overwritten, preserving any role, status, club or player assignments.
insert into public.profiles (
  id,
  first_name,
  last_name,
  email,
  role,
  status
)
select
  users.id,
  nullif(trim(users.raw_user_meta_data ->> 'first_name'), ''),
  nullif(trim(users.raw_user_meta_data ->> 'last_name'), ''),
  users.email,
  'player',
  'active'
from auth.users as users
where not exists (
  select 1
  from public.profiles as profiles
  where profiles.id = users.id
);
