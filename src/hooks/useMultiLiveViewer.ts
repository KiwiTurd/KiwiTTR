import {
  useCallback,
  useEffect,
  useState,
} from "react";

const STORAGE_KEY = "kiwittr:multi-live-viewer";
const SELECTION_CHANGED_EVENT = "kiwittr:multi-live-viewer-changed";

function readSelectedTournamentIds() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "[]"
    );

    return Array.isArray(stored)
      ? stored.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

function writeSelectedTournamentIds(ids: string[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(SELECTION_CHANGED_EVENT));
}

export default function useMultiLiveViewer() {
  const [selectedTournamentIds, setSelectedTournamentIds] = useState(
    readSelectedTournamentIds
  );

  useEffect(() => {
    const syncSelection = () => {
      setSelectedTournamentIds(readSelectedTournamentIds());
    };

    window.addEventListener("storage", syncSelection);
    window.addEventListener(SELECTION_CHANGED_EVENT, syncSelection);

    return () => {
      window.removeEventListener("storage", syncSelection);
      window.removeEventListener(SELECTION_CHANGED_EVENT, syncSelection);
    };
  }, []);

  const addTournament = useCallback((id: string) => {
    const current = readSelectedTournamentIds();

    if (!current.includes(id)) {
      writeSelectedTournamentIds([...current, id]);
    }
  }, []);

  const removeTournament = useCallback((id: string) => {
    writeSelectedTournamentIds(
      readSelectedTournamentIds().filter(tournamentId => tournamentId !== id)
    );
  }, []);

  const toggleTournament = useCallback((id: string) => {
    const current = readSelectedTournamentIds();

    writeSelectedTournamentIds(
      current.includes(id)
        ? current.filter(tournamentId => tournamentId !== id)
        : [...current, id]
    );
  }, []);

  return {
    selectedTournamentIds,
    addTournament,
    removeTournament,
    toggleTournament,
    isSelected: (id: string) => selectedTournamentIds.includes(id),
  };
}
