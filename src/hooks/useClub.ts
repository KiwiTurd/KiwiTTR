import { useCallback, useEffect, useState } from "react";

import type { Club } from "../types/club";

import {
  getClub,
  updateClub,
} from "../services/supabase/clubService";

export default function useClub(
  id: string | undefined
) {
  const [club, setClub] = useState<Club>();

  const refresh = useCallback(async () => {
    if (!id) {
      setClub(undefined);
      return;
    }

    try {
      const data = await getClub(id);

      setClub(data ?? undefined);
    } catch (error) {
      console.error(error);
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function save(updated: Club) {
    try {
      await updateClub(updated);

      await refresh();
    } catch (error) {
      console.error(error);
    }
  }

  return {
    club,
    save,
    refresh,
  };
}