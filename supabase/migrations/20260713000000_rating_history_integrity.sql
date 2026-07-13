-- Remove history entries whose source match has already been deleted, then
-- ensure future match deletions clean up their rating history automatically.
delete from public.rating_history as history
where not exists (
  select 1
  from public.matches
  where matches.id = history.match_id
);

alter table public.rating_history
  drop constraint if exists rating_history_match_id_fkey;

alter table public.rating_history
  add constraint rating_history_match_id_fkey
  foreign key (match_id)
  references public.matches(id)
  on delete cascade;
