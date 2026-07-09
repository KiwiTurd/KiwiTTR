import { useProfile } from "../context/ProfileContext";

export default function useRole() {
  const { profile } = useProfile();

  return {
    profileId: profile?.id ?? null,

    role: profile?.role,

    clubId: profile?.club_id ?? null,

    playerId: profile?.player_id ?? null,

    isAdmin: profile?.role === "admin",

    isClubLeader: profile?.role === "club_admin",

    isPlayer: profile?.role === "player",
  };
}
