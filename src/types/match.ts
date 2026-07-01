export interface MatchSet {
  player1Score: number;
  player2Score: number;
}

export interface Match {
  id: string;

  eventId: string;

  playedAt: string;

  player1Id: string;
  player2Id: string;

  sets: MatchSet[];

  winnerId: string;
  loserId: string;

  winnerRatingBefore: number;
  winnerRatingAfter: number;

  loserRatingBefore: number;
  loserRatingAfter: number;

  winnerRatingChange: number;
  loserRatingChange: number;
}