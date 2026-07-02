import type { Player } from "../types/player";
import type { Match, MatchSet } from "../types/match";

import { calculateMatch } from "./ttrEngine";

export type MatchResult = {
  match: Match;
  winner: Player;
  loser: Player;
};

export function buildMatch(
  eventId: string,
  winner: Player,
  loser: Player,
  sets: MatchSet[]
): MatchResult {

  const result = calculateMatch(winner, loser);

  const playedAt = new Date().toISOString();

  return {
    winner: result.winner,
    loser: result.loser,

    match: {
      id: crypto.randomUUID(),

      eventId,

      winnerId: result.winner.id,
      loserId: result.loser.id,

      playedAt,

      winnerRatingBefore: winner.rating,
      winnerRatingAfter: result.winner.rating,

      loserRatingBefore: loser.rating,
      loserRatingAfter: result.loser.rating,

      winnerRatingChange: result.winnerChange,
      loserRatingChange: result.loserChange,

      sets,
    },
  };
}