export interface RatingHistory {
  id: string;

  playerId: string;

  matchId: string;

  ratingBefore: number;
  ratingAfter: number;

  ratingChange: number;

  recordedAt: string;
}