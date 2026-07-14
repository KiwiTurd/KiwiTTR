export interface Player {
  id: string;

  // Linked user profile
  profileId: string | null;

  firstName: string;
  lastName: string;

  mobile: string;
  email: string;

  mobilePublicToClub: boolean;
  emailPublicToClub: boolean;

  avatarUrl: string;

  clubId: string;

  rating: number;
  initialRating?: number;
  highestRating: number;

  wins: number;
  losses: number;

  matchesPlayed: number;

  provisionalMatchesRemaining: number;

  ratingReliability: number;

  isActive: boolean;

  createdAt: string;
}
