# Schema Diff Notes

Baseline: latest GitHub commit on `origin/main`, checked against the pasted
current Supabase structure.

## 1. Database Schema

Generated SQL is limited to the new tournament subsystem. It does not modify
existing tables outside that subsystem.

New subsystem tables:

- `tournaments`
- `tournament_players`
- `tournament_pools`
- `tournament_pool_players`
- `knockout_rounds`
- `tournament_matches`
- `tournament_match_sets`
- `knockout_matches`

`tournaments` stores metadata only:

- club
- name
- date
- format
- tournament settings
- status
- timestamps

Application state is normalized into child tables instead of JSONB columns.

No SQL is generated for:

- `players.email`
- `players.mobile`
- `clubs.notice`
- `clubs.header_image_url`

`players.email` and `players.mobile` already exist in the pasted Supabase
schema. `clubs.notice` and `clubs.header_image_url` are outside the tournament
subsystem and are therefore intentionally excluded from this migration.

## 2. Foreign Keys

Every relationship in the tournament subsystem is modeled with foreign keys.

Important links:

- `tournaments.club_id -> clubs.id`
- `tournament_players.tournament_id -> tournaments.id`
- `tournament_players.player_id -> players.id`
- `tournament_players.profile_id -> profiles.id`
- `tournament_players.club_id -> clubs.id`
- `tournament_players.pair_player_one_id -> players.id`
- `tournament_players.pair_player_two_id -> players.id`
- `tournament_pools.tournament_id -> tournaments.id`
- `tournament_pool_players.pool_id -> tournament_pools.id`
- `tournament_pool_players.tournament_player_id -> tournament_players.id`
- `knockout_rounds.tournament_id -> tournaments.id`
- `tournament_matches.tournament_id -> tournaments.id`
- `tournament_matches.pool_id -> tournament_pools.id`
- `tournament_matches.knockout_round_id -> knockout_rounds.id`
- `tournament_matches.player_one_id -> tournament_players.id`
- `tournament_matches.player_two_id -> tournament_players.id`
- `tournament_matches.winner_id -> tournament_players.id`
- `tournament_matches.recorded_match_id -> matches.id`
- `tournament_match_sets.tournament_match_id -> tournament_matches.id`
- `knockout_matches.tournament_match_id -> tournament_matches.id`
- `knockout_matches.knockout_round_id -> knockout_rounds.id`
- `knockout_matches.next_tournament_match_id -> tournament_matches.id`

Completed tournament matches can be promoted into the existing rating pipeline
by creating the normal `matches`, `match_sets`, and `rating_history` records,
then storing the generated `matches.id` in
`tournament_matches.recorded_match_id`.

## 3. RLS Policies

Generated SQL adds RLS only for the new tournament subsystem tables.

Policies:

- Anyone can read tournament subsystem data.
- Authenticated `admin` users can modify tournament subsystem data.
- Authenticated `club_admin` users can modify tournament subsystem data only
  when the tournament belongs to their `profiles.club_id`.

No existing policies are modified.

## Recommendations Not Applied

These are documented only because applying them would modify existing database
objects or existing data:

- If existing RLS policies enforce role checks on `profiles.role` beyond the
  policies added in `20260709000100_roles_club_admin_and_tournament_finish.sql`,
  review them separately for the new role naming.

## Follow-Up Migration

`20260709000100_roles_club_admin_and_tournament_finish.sql` adds the explicitly
requested production changes after the tournament subsystem migration:

- Migrates existing `profiles.role` values from `club_leader` to `club_admin`.
- Migrates existing `profiles.role` values from `member` to `player`.
- Lets `club_admin` users update their own club, but does not let them create
  clubs.
- Lets `club_admin` users update players in their own club so tournament
  completion can apply TTR changes.
- Lets `club_admin` users insert/update their own club events for tournament
  completion records.
- Lets `club_admin` users insert match and match-set rows for their own club
  events.

Tournament rating updates are still gated in application code: results are
written to normal `matches`, `match_sets`, and `rating_history` only when the
tournament is explicitly finished.
