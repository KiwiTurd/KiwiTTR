import { getPlayers } from "./playerService";
import { getMatches } from "./matchService";
import { getClubs } from "./clubService";

export function getNationalRank(playerId: string): number {
  const players = getPlayers()
    .filter((p) => p.isActive)
    .sort((a, b) => b.rating - a.rating);

  return players.findIndex((p) => p.id === playerId) + 1;
}

export function getClubRank(playerId: string): number {
  const players = getPlayers();

  const player = players.find((p) => p.id === playerId);

  if (!player) return 0;

  const clubPlayers = players
    .filter(
      (p) =>
        p.clubId === player.clubId &&
        p.isActive
    )
    .sort((a, b) => b.rating - a.rating);

  return clubPlayers.findIndex((p) => p.id === playerId) + 1;
}

export function getWinPercentage(playerId: string): number {
  const player = getPlayers().find(
    (p) => p.id === playerId
  );

  if (!player) return 0;

  const total = player.wins + player.losses;

  if (total === 0) return 0;

  return Number(
    ((player.wins / total) * 100).toFixed(1)
  );
}

export function getTopRatedPlayers(limit = 5) {
  return getPlayers()
    .filter((p) => p.isActive)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}

export function getActivePlayerCount() {
  return getPlayers().filter(
    (p) => p.isActive
  ).length;
}

export function getClubCount() {
  return getClubs().length;
}

export function getLatestMatch() {
  return getMatches()
    .sort(
      (a, b) =>
        new Date(b.playedAt).getTime() -
        new Date(a.playedAt).getTime()
    )[0];
}

/* -----------------------------
   CLUB STATISTICS
----------------------------- */

export function getClubPlayers(clubId: string) {
  return getPlayers()
    .filter(
      (player) =>
        player.clubId === clubId &&
        player.isActive
    )
    .sort((a, b) => b.rating - a.rating);
}

export function getClubPlayerCount(clubId: string) {
  return getClubPlayers(clubId).length;
}

export function getClubAverageRating(clubId: string) {
  const players = getClubPlayers(clubId);

  if (players.length === 0) return 0;

  return Math.round(
    players.reduce(
      (total, player) => total + player.rating,
      0
    ) / players.length
  );
}

export function getClubTopPlayer(clubId: string) {
  return getClubPlayers(clubId)[0];
}

export function getClubMatches(clubId: string) {
  const playerIds = new Set(
    getClubPlayers(clubId).map(
      (player) => player.id
    )
  );

  return getMatches().filter(
    (match) =>
      playerIds.has(match.player1Id) ||
      playerIds.has(match.player2Id)
  );
}

export function getClubMatchCount(clubId: string) {
  return getClubMatches(clubId).length;
}

export function getClubRankings(clubId: string) {
  return getClubPlayers(clubId);
}