import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Context,
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
  cancelTournament as cancelTournamentRecord,
  deleteTournament as deleteTournamentRecord,
  getTournament,
  getTournaments,
  saveTournamentRecord,
  signUpForTournament as signUpForTournamentRecord,
  updateTournamentMetadata,
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
    id: string,
    forceRefresh?: boolean
  ) => Promise<SavedTournament | null>;

  signUpForTournament: (
    id: string,
    playerId: string
  ) => Promise<SavedTournament>;

  updateTournamentDetails: (
    tournament: SavedTournament
  ) => Promise<SavedTournament>;

  cancelTournament: (
    id: string
  ) => Promise<SavedTournament>;

  deleteTournament: (
    id: string
  ) => Promise<void>;

  setTournamentState: (
    tournament: TournamentState
  ) => void;

  resetTournament: () => void;
}

const tournamentContextStore = globalThis as typeof globalThis & {
  __kiwiTtrTournamentContext?: Context<TournamentContextType | null>;
};

// Keep one context identity when Vite hot-reloads this module. Without this,
// an updated consumer can briefly reference a different context instance from
// the provider that is already mounted above the router.
const TournamentContext =
  tournamentContextStore.__kiwiTtrTournamentContext ??
  createContext<TournamentContextType | null>(null);

tournamentContextStore.__kiwiTtrTournamentContext =
  TournamentContext;

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

  const persistenceQueue = useRef<Promise<void>>(
    Promise.resolve()
  );

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

      persistenceQueue.current = persistenceQueue.current
        .catch(() => undefined)
        .then(async () => {
          const saved = await saveTournamentRecord(
            nextTournament
          );
          commitSavedTournament(saved);
        })
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
    id: string,
    forceRefresh = false
  ): Promise<SavedTournament | null> {
    const cached =
      savedTournamentMap.get(id);

    if (cached && !forceRefresh) {
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

  async function signUpForTournament(
    id: string,
    playerId: string
  ): Promise<SavedTournament> {
    const saved =
      await signUpForTournamentRecord(
        id,
        playerId
      );

    setTournament(current =>
      current.id === saved.id
        ? saved
        : current
    );
    commitSavedTournament(saved);

    return saved;
  }

  async function updateTournamentDetails(
    tournamentToUpdate: SavedTournament
  ): Promise<SavedTournament> {
    const saved =
      await updateTournamentMetadata(
        tournamentToUpdate
      );

    setTournament(current =>
      current.id === saved.id
        ? saved
        : current
    );
    commitSavedTournament(saved);

    return saved;
  }

  async function cancelTournament(
    id: string
  ): Promise<SavedTournament> {
    const saved =
      await cancelTournamentRecord(id);

    setTournament(current =>
      current.id === saved.id
        ? saved
        : current
    );
    commitSavedTournament(saved);

    return saved;
  }

  async function deleteTournament(
    id: string
  ): Promise<void> {
    await deleteTournamentRecord(id);

    setSavedTournaments(current =>
      current.filter(item => item.id !== id)
    );
    setTournament(current =>
      current.id === id
        ? defaultTournament
        : current
    );
  }

  function setTournamentState(
    nextTournament: TournamentState
  ) {
    setTournament(nextTournament);
    if (nextTournament.id) {
      setSavedTournaments(current =>
        current.map(saved =>
          saved.id === nextTournament.id
            ? {
                ...saved,
                ...nextTournament,
                createdAt:
                  nextTournament.createdAt ?? saved.createdAt,
                updatedAt:
                  nextTournament.updatedAt ?? saved.updatedAt,
              }
            : saved
        )
      );
    }
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
        signUpForTournament,
        updateTournamentDetails,
        cancelTournament,
        deleteTournament,
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
