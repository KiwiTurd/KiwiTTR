import { buildMatch } from "./matchEngine";

import {
  getPlayer,
  updatePlayer,
} from "./supabase/playerService";

import {
  addMatch,
} from "./supabase/matchService";

import {
  addRatingHistory,
} from "./supabase/ratingHistoryService";

import type { MatchSet } from "../types/match";
import type { RatingHistory } from "../types/ratingHistory";

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

  const winnerHistory: RatingHistory = {
    id: crypto.randomUUID(),

    playerId: result.winner.id,
    matchId: result.match.id,

    ratingBefore: result.match.winnerRatingBefore,
    ratingAfter: result.match.winnerRatingAfter,

    ratingChange: result.match.winnerRatingChange,

    recordedAt: result.match.playedAt,
  };

  const loserHistory: RatingHistory = {
    id: crypto.randomUUID(),

    playerId: result.loser.id,
    matchId: result.match.id,

    ratingBefore: result.match.loserRatingBefore,
    ratingAfter: result.match.loserRatingAfter,

    ratingChange: result.match.loserRatingChange,

    recordedAt: result.match.playedAt,
  };

  await addRatingHistory(winnerHistory);
  await addRatingHistory(loserHistory);

  return result;
}