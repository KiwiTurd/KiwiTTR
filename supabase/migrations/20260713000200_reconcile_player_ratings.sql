-- Reconcile cached player ratings with the valid rating ledger. This repairs
-- stale current/highest values left by historical match deletion or replay
-- issues. Run after the rating-history integrity migration.
with latest_rating as (
  select distinct on (player_id)
    player_id,
    rating_after
  from public.rating_history
  order by player_id, recorded_at desc, id desc
),
career_high as (
  select
    player_id,
    max(rating_value) as highest_rating
  from (
    select player_id, rating_before as rating_value
    from public.rating_history
    union all
    select player_id, rating_after as rating_value
    from public.rating_history
  ) ratings
  group by player_id
)
update public.players as player
set
  rating = latest.rating_after,
  highest_rating = greatest(
    latest.rating_after,
    career.highest_rating
  )
from latest_rating as latest
join career_high as career
  on career.player_id = latest.player_id
where player.id = latest.player_id
  and (
    player.rating is distinct from latest.rating_after
    or player.highest_rating is distinct from greatest(
      latest.rating_after,
      career.highest_rating
    )
  );
