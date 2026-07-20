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

const PROFILE_VALIDATION_TIMEOUT_MS = 15_000;

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  const [session, setSession] =
    useState<Session | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let active = true;
    let validationSequence = 0;
    const pendingTimers = new Set<number>();

    async function validateSession(
      nextSession: Session | null,
      sequence: number
    ) {
      let profileTimeout: number | undefined;

      try {
        if (!nextSession) {
          if (active && sequence === validationSequence) {
            setSession(null);
          }
          return;
        }

        const profile = await Promise.race([
          getProfile(nextSession.user.id),
          new Promise<never>((_, reject) => {
            profileTimeout = window.setTimeout(() => {
              reject(new Error("Profile validation timed out."));
            }, PROFILE_VALIDATION_TIMEOUT_MS);
          }),
        ]);

        if (!active || sequence !== validationSequence) {
          return;
        }

        if (profile?.status === "disabled") {
          setSession(null);
          notify.fault(
            "Your account has been disabled. Please contact an administrator."
          );

          const { error } = await supabase.auth.signOut({ scope: "local" });
          if (error) {
            console.error("Unable to clear disabled account session:", error);
          }
          return;
        }

        setSession(nextSession);
      } catch (error) {
        if (!active || sequence !== validationSequence) {
          return;
        }

        console.error("Unable to validate the current session:", error);
        setSession(null);
        notify.fault(
          "Unable to verify your account. Check your connection and try again."
        );
      } finally {
        if (profileTimeout !== undefined) {
          window.clearTimeout(profileTimeout);
        }

        if (active && sequence === validationSequence) {
          setLoading(false);
        }
      }
    }

    function queueSessionValidation(nextSession: Session | null) {
      const sequence = ++validationSequence;
      const timer = window.setTimeout(() => {
        pendingTimers.delete(timer);
        void validateSession(nextSession, sequence);
      }, 0);

      pendingTimers.add(timer);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        queueSessionValidation(nextSession);
      }
    );

    return () => {
      active = false;
      pendingTimers.forEach((timer) => window.clearTimeout(timer));
      pendingTimers.clear();
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
