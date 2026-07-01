import type { Player } from "../types/player";

export interface MatchResult {
  winner: Player;
  loser: Player;

  winnerChange: number;
  loserChange: number;
}

export function calculateMatch(
  winner: Player,
  loser: Player
): MatchResult {

  const ratingDifference = loser.rating - winner.rating;

  const expectedWinner =
    1 / (1 + Math.pow(10, ratingDifference / 400));

  const expectedLoser = 1 - expectedWinner;

  const kFactor = 32;

  const winnerChange = Math.round(
    kFactor * (1 - expectedWinner)
  );

  const loserChange = -winnerChange;

  const updatedWinner: Player = {
    ...winner,
    rating: winner.rating + winnerChange,
    highestRating: Math.max(
      winner.highestRating,
      winner.rating + winnerChange
    ),
    wins: winner.wins + 1,
    matchesPlayed: winner.matchesPlayed + 1,
    provisionalMatchesRemaining: Math.max(
      0,
      winner.provisionalMatchesRemaining - 1
    ),
  };

  const updatedLoser: Player = {
    ...loser,
    rating: loser.rating + loserChange,
    highestRating: loser.highestRating,
    losses: loser.losses + 1,
    matchesPlayed: loser.matchesPlayed + 1,
    provisionalMatchesRemaining: Math.max(
      0,
      loser.provisionalMatchesRemaining - 1
    ),
  };

  return {
    winner: updatedWinner,
    loser: updatedLoser,
    winnerChange,
    loserChange,
  };
}