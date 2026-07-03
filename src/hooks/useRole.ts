import { useProfile } from "../context/ProfileContext";

export default function useRole() {
  const { profile } = useProfile();

  return {
    role: profile?.role,

    clubId: profile?.club_id ?? null,

    isAdmin: profile?.role === "admin",

    isClubLeader: profile?.role === "club_leader",

    isPlayer: profile?.role === "player",
  };
}