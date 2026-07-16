create table if not exists public.player_private_details (
  player_id uuid primary key
    references public.players(id) on delete cascade,
  birth_date date,
  gender text check (
    gender is null
    or gender in (
      'female',
      'male',
      'prefer-not-to-say'
    )
  ),
  updated_at timestamptz not null default now()
);

alter table public.player_private_details enable row level security;

revoke all on public.player_private_details from anon, authenticated;
grant select on public.player_private_details to authenticated;

drop policy if exists "Admins can view private player details"
  on public.player_private_details;
create policy "Admins can view private player details"
  on public.player_private_details
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.status = 'active'
        and (
          profiles.role = 'admin'
          or (
            profiles.role = 'club_admin'
            and exists (
              select 1
              from public.players
              where players.id = player_private_details.player_id
                and players.club_id = profiles.club_id
            )
          )
        )
    )
  );

create or replace function public.get_own_player_private_details()
returns table (
  birth_date date,
  gender text
)
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select
    details.birth_date,
    details.gender
  from public.profiles
  left join public.player_private_details as details
    on details.player_id = profiles.player_id
  where profiles.id = auth.uid()
    and profiles.status = 'active'
    and profiles.player_id is not null;
$$;

create or replace function public.update_own_player_private_details(
  new_birth_date date,
  new_gender text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  linked_player_id uuid;
begin
  if new_birth_date is not null
    and new_birth_date > timezone('Pacific/Auckland', now())::date then
    raise exception 'Birthdate cannot be in the future.';
  end if;

  if new_gender is not null
    and new_gender not in (
      'female',
      'male',
      'prefer-not-to-say'
    ) then
    raise exception 'Invalid gender value.';
  end if;

  select profiles.player_id
  into linked_player_id
  from public.profiles
  where profiles.id = auth.uid()
    and profiles.status = 'active';

  if linked_player_id is null then
    raise exception 'No linked player profile is available for this account.';
  end if;

  insert into public.player_private_details (
    player_id,
    birth_date,
    gender,
    updated_at
  ) values (
    linked_player_id,
    new_birth_date,
    new_gender,
    now()
  )
  on conflict (player_id) do update
  set
    birth_date = excluded.birth_date,
    gender = excluded.gender,
    updated_at = now();
end;
$$;

revoke all on function public.get_own_player_private_details()
  from public;
grant execute on function public.get_own_player_private_details()
  to authenticated;

revoke all on function public.update_own_player_private_details(date, text)
  from public;
grant execute on function public.update_own_player_private_details(date, text)
  to authenticated;
