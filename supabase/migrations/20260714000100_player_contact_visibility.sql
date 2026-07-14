alter table public.players
  add column if not exists mobile_public_to_club boolean not null default false,
  add column if not exists email_public_to_club boolean not null default false;

create or replace function public.update_own_player_contact(
  new_mobile text,
  new_email text,
  new_mobile_public_to_club boolean,
  new_email_public_to_club boolean
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.players
  set
    mobile = trim(coalesce(new_mobile, '')),
    email = trim(coalesce(new_email, '')),
    mobile_public_to_club = coalesce(new_mobile_public_to_club, false),
    email_public_to_club = coalesce(new_email_public_to_club, false)
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

revoke all on function public.update_own_player_contact(
  text,
  text,
  boolean,
  boolean
) from public;

grant execute on function public.update_own_player_contact(
  text,
  text,
  boolean,
  boolean
) to authenticated;
