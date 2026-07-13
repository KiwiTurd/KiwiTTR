-- `create table if not exists` does not replace constraints on databases that
-- already have the table. Explicitly upgrade the status constraint so the
-- draft-first team-game workflow can save a new setup before it goes live.
alter table public.team_games
  drop constraint if exists team_games_status_check;

alter table public.team_games
  add constraint team_games_status_check check (
    status in ('draft', 'live', 'submitted', 'completed', 'cancelled')
  );
