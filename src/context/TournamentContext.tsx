import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Player } from "../types/player";
import type {
  KnockoutMatch,
  Pool,
  SavedTournament,
  TournamentSettings,
  TournamentState,
  TournamentMatch,
} from "../types/tournament";
import { defaultTournament } from "../types/tournament";
import {
  getTournament,
  getTournaments,
  saveTournamentRecord,
} from "../services/supabase/tournamentService";

interface TournamentContextType {
  tournament: TournamentState;

  savedTournaments: SavedTournament[];

  isLoadingTournaments: boolean;

  updateSettings: (
    settings: Partial<TournamentSettings>
  ) => void;

  startTournament: (
    settings: TournamentSettings
  ) => void;

  setPlayers: (
    players: Player[]
  ) => void;

  setPools: (
    pools: Pool[]
  ) => void;

  setMatches: (
    matches: TournamentMatch[]
  ) => void;

  setKnockout: (
    knockout: KnockoutMatch[]
  ) => void;

  saveTournament: (
    tournament: TournamentState
  ) => Promise<SavedTournament>;

  loadTournament: (
    id: string
  ) => Promise<SavedTournament | null>;

  setTournamentState: (
    tournament: TournamentState
  ) => void;

  resetTournament: () => void;
}

const TournamentContext =
  createContext<TournamentContextType | null>(
    null
  );

export function TournamentProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    tournament,
    setTournament,
  ] = useState<TournamentState>(
    defaultTournament
  );

  const [
    savedTournaments,
    setSavedTournaments,
  ] = useState<SavedTournament[]>([]);

  const [
    isLoadingTournaments,
    setIsLoadingTournaments,
  ] = useState(true);

  const savedTournamentMap = useMemo(() => {
    return new Map(
      savedTournaments.map(saved => [
        saved.id,
        saved,
      ])
    );
  }, [savedTournaments]);

  const commitSavedTournament = useCallback(
    (saved: SavedTournament) => {
      setSavedTournaments(current => [
        saved,
        ...current.filter(
          item => item.id !== saved.id
        ),
      ]);
    },
    []
  );

  useEffect(() => {
    let isMounted = true;

    async function loadSavedTournaments() {
      try {
        const data = await getTournaments();

        if (isMounted) {
          setSavedTournaments(data);
        }
      } catch (error) {
        console.error(
          "Failed to load tournaments",
          error
        );
      } finally {
        if (isMounted) {
          setIsLoadingTournaments(false);
        }
      }
    }

    void loadSavedTournaments();

    return () => {
      isMounted = false;
    };
  }, []);

  const persistCurrentIfSaved = useCallback(
    (nextTournament: TournamentState) => {
      if (!nextTournament.id) {
        return;
      }

      void saveTournamentRecord(nextTournament)
        .then(commitSavedTournament)
        .catch(error => {
          console.error(
            "Failed to save tournament",
            error
          );
        });
    },
    [commitSavedTournament]
  );

  function updateSettings(
    settings: Partial<TournamentSettings>
  ) {
    setTournament((current) => {
      const next = {
        ...current,
        settings: {
          ...current.settings,
          ...settings,
        },
      };

      persistCurrentIfSaved(next);

      return next;
    });
  }

  function startTournament(
    settings: TournamentSettings
  ) {
    setTournament({
      ...defaultTournament,
      settings,
    });
  }

  function setPlayers(
    players: Player[]
  ) {
    setTournament((current) => {
      const next = {
        ...current,
        players,
      };

      persistCurrentIfSaved(next);

      return next;
    });
  }

  function setPools(
    pools: Pool[]
  ) {
    setTournament((current) => {
      const next = {
        ...current,
        pools,
      };

      persistCurrentIfSaved(next);

      return next;
    });
  }

  function setMatches(
    matches: TournamentMatch[]
  ) {
    setTournament((current) => {
      const next = {
        ...current,
        matches,
      };

      persistCurrentIfSaved(next);

      return next;
    });
  }

  function setKnockout(
    knockout: KnockoutMatch[]
  ) {
    setTournament((current) => {
      const next = {
        ...current,
        knockout,
      };

      persistCurrentIfSaved(next);

      return next;
    });
  }

  async function saveTournament(
    tournamentToSave: TournamentState
  ): Promise<SavedTournament> {
    const saved =
      await saveTournamentRecord(
        tournamentToSave
      );

    setTournament(saved);
    commitSavedTournament(saved);

    return saved;
  }

  async function loadTournament(
    id: string
  ): Promise<SavedTournament | null> {
    const cached =
      savedTournamentMap.get(id);

    if (cached) {
      setTournament(cached);
      return cached;
    }

    const saved = await getTournament(id);

    if (!saved) {
      return null;
    }

    setTournament(saved);
    commitSavedTournament(saved);

    return saved;
  }

  function setTournamentState(
    nextTournament: TournamentState
  ) {
    setTournament(nextTournament);
    persistCurrentIfSaved(nextTournament);
  }

  function resetTournament() {
    setTournament(defaultTournament);
  }

  return (
    <TournamentContext.Provider
      value={{
        tournament,
        savedTournaments,
        isLoadingTournaments,
        updateSettings,
        startTournament,
        setPlayers,
        setPools,
        setMatches,
        setKnockout,
        saveTournament,
        loadTournament,
        setTournamentState,
        resetTournament,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTournament() {
  const context =
    useContext(TournamentContext);

  if (!context) {
    throw new Error(
      "useTournament must be used inside TournamentProvider"
    );
  }

  return context;
}
