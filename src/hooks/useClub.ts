import { useCallback, useEffect, useState } from "react";

import type { Club } from "../types/club";

import {
  getClub,
  updateClub,
} from "../services/supabase/clubService";

export default function useClub(
  id: string | undefined
) {
  const [club, setClub] =
    useState<Club>();

  const refresh = useCallback(() => {
    if (!id) return;

    setClub(getClub(id));
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function save(updated: Club) {
    updateClub(updated);

    refresh();
  }

  return {
    club,
    save,
    refresh,
  };
}