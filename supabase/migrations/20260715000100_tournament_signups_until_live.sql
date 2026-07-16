alter policy "Linked players can sign up for open tournaments"
  on public.tournament_players
  with check (
    player_id is not null
    and app_player_id = player_id::text
    and profile_id = auth.uid()
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.player_id = tournament_players.player_id
    )
    and exists (
      select 1
      from public.tournaments
      where tournaments.id = tournament_players.tournament_id
        and tournaments.allow_sign_up = true
        and tournaments.status = 'draft'
        and (
          tournaments.signup_closes_at is null
          or timezone('Pacific/Auckland', now())::date <=
            tournaments.signup_closes_at
        )
        and (
          tournaments.ttr_limit_enabled = false
          or tournaments.ttr_limit is null
          or exists (
            select 1
            from public.players
            where players.id = tournament_players.player_id
              and players.rating <= tournaments.ttr_limit
          )
        )
    )
  );
