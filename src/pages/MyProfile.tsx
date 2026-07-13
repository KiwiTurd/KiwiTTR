import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";

import {
  getProfile,
} from "../services/supabase/profileService";

import { notify } from "../services/notificationService";
import LoadingScreen from "../components/shared/LoadingScreen";

export default function MyProfile() {
  const navigate = useNavigate();

  useEffect(() => {
    void loadProfile();
  }, []);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return;
    }

    try {
      const profile = await getProfile(user.id);

      if (!profile?.playerId) {
        notify.info(
          "Your account hasn't been linked to a player profile yet. Please contact your club administrator."
        );

        setTimeout(() => {
          navigate("/dashboard");
        }, 2500);

        return;
      }

      navigate(`/players/${profile.playerId}`);
    } catch (error) {
      console.error(error);

      notify.fault(
        "Unable to load your profile."
      );

      navigate("/dashboard");
    }
  }

  return (
    <LoadingScreen label="Loading your profile..." />
  );
}
