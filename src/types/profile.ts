export type UserRole =
  | "admin"
  | "club_leader"
  | "member";

export interface Profile {
  id: string;

  firstName: string;
  lastName: string;

  role: UserRole;

  clubId: string | null;

  // Linked player
  playerId: string | null;

  createdAt: string;
}