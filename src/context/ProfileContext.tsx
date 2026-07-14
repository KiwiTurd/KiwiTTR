import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import { PLAYER_AVATAR_UPDATED_EVENT } from "../constants/playerAvatar";

export type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: "player" | "club_admin" | "admin";
  club_id: string | null;
  player_id: string | null;
  avatar_url: string | null;
};

type ProfileContextType = {
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export function ProfileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (authLoading) return;

    if (!session) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, role, club_id, player_id")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error) {
      console.error("Profile error:", error);

      alert(
        `Profile Error\n\n${error.message}`
      );

      setProfile(null);
      setLoading(false);
      return;
    }

    if (!data) {
      console.warn(
        "No profile exists for user:",
        session.user.id
      );

      setProfile(null);
      setLoading(false);
      return;
    }

    let avatarUrl: string | null = null;

    if (data.player_id) {
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("avatar_url")
        .eq("id", data.player_id)
        .maybeSingle();

      if (playerError) {
        console.error("Player avatar error:", playerError);
      } else {
        avatarUrl = playerData?.avatar_url ?? null;
      }
    }

    setProfile({
      ...data,
      avatar_url: avatarUrl,
    } as Profile);
    setLoading(false);
  }, [authLoading, session]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    const handleAvatarUpdated = () => {
      void refreshProfile();
    };

    window.addEventListener(PLAYER_AVATAR_UPDATED_EVENT, handleAvatarUpdated);
    return () => window.removeEventListener(PLAYER_AVATAR_UPDATED_EVENT, handleAvatarUpdated);
  }, [refreshProfile]);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading,
        refreshProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
