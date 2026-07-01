export interface Player {
  id: string;

  firstName: string;
  lastName: string;

  clubId: string;

  rating: number;
  highestRating: number;

  wins: number;
  losses: number;

  matchesPlayed: number;

  provisionalMatchesRemaining: number;

  ratingReliability: number;

  isActive: boolean;

  createdAt: string;
}