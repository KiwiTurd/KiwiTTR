-- Matches remain correctable for seven days after their most recent edit.
-- After that window PostgreSQL prevents both updates and deletion, including
-- direct API requests that bypass the application UI.
alter table public.matches
  add column if not exists updated_at timestamptz;

update public.matches
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

alter table public.matches
  alter column updated_at set default now();

alter table public.matches
  alter column updated_at set not null;

create or replace function public.enforce_match_editing_window()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.updated_at <= now() - interval '7 days' then
    raise exception 'This match is fixed because its seven-day editing window has closed.'
      using errcode = 'P0001';
  end if;

  if tg_op = 'UPDATE' then
    new.updated_at = now();
    return new;
  end if;

  return old;
end;
$$;

drop trigger if exists enforce_match_editing_window
  on public.matches;

create trigger enforce_match_editing_window
before update or delete on public.matches
for each row
execute function public.enforce_match_editing_window();
