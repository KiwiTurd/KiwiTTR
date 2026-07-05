import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import type { Session } from "@supabase/supabase-js";

import { supabase } from "../lib/supabase";

import {
  getProfile,
} from "../services/supabase/profileService";

import { notify } from "../services/notificationService";

type AuthContextType = {
  session: Session | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
});

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  const [session, setSession] =
    useState<Session | null>(null);

  const [loading, setLoading] =
    useState(true);

  async function validateSession(
    session: Session | null
  ) {

    if (!session) {
      setSession(null);
      setLoading(false);
      return;
    }

    const profile = await getProfile(
      session.user.id
    );

    if (
      profile &&
      profile.status === "disabled"
    ) {

      await supabase.auth.signOut();

      notify.fault(
        "Your account has been disabled. Please contact an administrator."
      );

      setSession(null);
      setLoading(false);

      return;
    }

    setSession(session);
    setLoading(false);

  }

  useEffect(() => {

    async function initialize() {

      const {
        data: { session },
      } = await supabase.auth.getSession();

      await validateSession(session);

    }

    void initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {

        await validateSession(session);

      }
    );

    return () => {
      subscription.unsubscribe();
    };

  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );

}

export function useAuth() {
  return useContext(AuthContext);
}