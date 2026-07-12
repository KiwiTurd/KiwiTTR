-- Profiles contain account-specific and authorisation data. Access must be
-- enforced in Postgres; adding an id filter in the browser is not a security
-- boundary because clients can construct their own API requests.

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
$$;

revoke all on function public.current_user_is_admin() from public;
grant execute on function public.current_user_is_admin() to authenticated;

-- Replace any older broad profile policies so role and account data cannot be
-- enumerated through the public API.
do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
  loop
    execute format(
      'drop policy if exists %I on public.profiles',
      existing_policy.policyname
    );
  end loop;
end $$;

create policy "Users can view their own profile"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy "Admins can view all profiles"
  on public.profiles
  for select
  to authenticated
  using (public.current_user_is_admin());

create policy "Admins can update profiles"
  on public.profiles
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "Admins can delete profiles"
  on public.profiles
  for delete
  to authenticated
  using (public.current_user_is_admin());
