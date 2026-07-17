alter table public.tournament_matches
  add column if not exists match_type text not null default 'singles',
  add column if not exists counts_for_ttr boolean not null default true,
  add column if not exists is_additional boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tournament_matches_match_type_check'
      and conrelid = 'public.tournament_matches'::regclass
  ) then
    alter table public.tournament_matches
      add constraint tournament_matches_match_type_check
      check (match_type in ('singles', 'doubles'));
  end if;
end $$;

create index if not exists tournament_matches_additional_idx
  on public.tournament_matches(tournament_id, is_additional, position);
