alter table public.tournaments
  drop constraint if exists tournaments_format_check;

alter table public.tournaments
  add constraint tournaments_format_check check (
    format in ('knockout', 'double-knockout', 'pools', 'doubles')
  );

alter table public.tournament_matches
  add column if not exists bracket text check (
    bracket is null
    or bracket in ('winners', 'losers', 'grand-final')
  );
