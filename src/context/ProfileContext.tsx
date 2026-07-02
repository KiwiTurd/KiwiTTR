import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

export type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: "player" | "club_leader" | "admin";
  club_id: string | null;
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

  async function refreshProfile() {
    if (authLoading) return;

    if (!session) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
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

    setProfile(data as Profile);
    setLoading(false);
  }

  useEffect(() => {
    void refreshProfile();
  }, [session, authLoading]);

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