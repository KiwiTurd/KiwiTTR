export type UserRole =
  | "admin"
  | "club_leader"
  | "member";

export type UserStatus =
  | "active"
  | "disabled";

export interface Profile {
  id: string;

  firstName: string;
  lastName: string;

  email: string;

  role: UserRole;
  status: UserStatus;

  clubId: string | null;
  playerId: string | null;

  createdAt: string;
}