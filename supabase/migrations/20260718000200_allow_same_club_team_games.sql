alter table public.team_games
  drop constraint if exists team_games_distinct_club,
  drop constraint if exists team_games_distinct_clubs;
