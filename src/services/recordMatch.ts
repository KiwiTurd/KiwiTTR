import { buildMatch } from "./matchEngine";

import {
  getPlayer,
  updatePlayer,
} from "./supabase/playerService";

import {
  addMatch,
} from "./supabase/matchService";

import type { MatchSet } from "../types/match";

export async function recordMatch(
  eventId: string,
  playerAId: string,
  playerBId: string,
  sets: MatchSet[]
) {
  const playerA = await getPlayer(playerAId);
  const playerB = await getPlayer(playerBId);

  if (!playerA || !playerB) {
    throw new Error("Players not found.");
  }

  let playerAWins = 0;
  let playerBWins = 0;

  for (const set of sets) {
    if (set.player1Score > set.player2Score) {
      playerAWins++;
    } else {
      playerBWins++;
    }
  }

  const winner =
    playerAWins > playerBWins
      ? playerA
      : playerB;

  const loser =
    playerAWins > playerBWins
      ? playerB
      : playerA;

  const result = buildMatch(
    eventId,
    winner,
    loser,
    sets
  );

  await updatePlayer(result.winner);
  await updatePlayer(result.loser);

  await addMatch(result.match);

  return result;
}