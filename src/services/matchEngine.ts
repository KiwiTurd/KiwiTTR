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
  player1: Player,
  player2: Player,
  sets: MatchSet[]
): MatchResult {

  let player1Sets = 0;
  let player2Sets = 0;

  for (const set of sets) {
    if (set.player1Score > set.player2Score) {
      player1Sets++;
    } else {
      player2Sets++;
    }
  }

  const winner =
    player1Sets > player2Sets ? player1 : player2;

  const loser =
    player1Sets > player2Sets ? player2 : player1;

  const result = calculateMatch(winner, loser);

  const playedAt = new Date().toISOString();

  return {
    winner: result.winner,
    loser: result.loser,

    match: {
      id: crypto.randomUUID(),

      eventId,

      playedAt,

      player1Id: player1.id,
      player2Id: player2.id,

      winnerId: result.winner.id,
      loserId: result.loser.id,

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