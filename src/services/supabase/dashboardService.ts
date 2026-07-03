import { getPlayers } from "./playerService";
import { getClubs } from "./clubService";
import { getEvents } from "./eventService";
import { getMatches } from "./matchService";

export async function getDashboardData() {
  const [
    players,
    clubs,
    events,
    matches,
  ] = await Promise.all([
    getPlayers(),
    getClubs(),
    getEvents(),
    getMatches(),
  ]);

  return {
    players,
    clubs,
    events,
    matches,

    activePlayers: players.filter(
      (player) => player.isActive
    ).length,

    totalMatches: matches.length,

    totalEvents: events.length,
  };
}