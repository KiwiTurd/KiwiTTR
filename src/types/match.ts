export interface MatchSet {
  player1Score: number;
  player2Score: number;
}

export interface Match {
  id: string;

  eventId: string;

  playedAt: string;

  // Position on the scoresheet
  player1Id: string;
  player2Id: string;

  // Result
  winnerId: string;
  loserId: string;

  winnerRatingBefore: number;
  winnerRatingAfter: number;

  loserRatingBefore: number;
  loserRatingAfter: number;

  winnerRatingChange: number;
  loserRatingChange: number;

  sets: MatchSet[];
}