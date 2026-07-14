import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  PanelsTopLeft,
  X,
} from "lucide-react";

import LiveTournamentPanel from "../components/tournaments/LiveTournamentPanel";
import useMultiLiveViewer from "../hooks/useMultiLiveViewer";
import { getTournament } from "../services/supabase/tournamentService";
import type { SavedTournament } from "../types/tournament";

export default function MultiLiveViewer() {
  const {
    selectedTournamentIds,
    removeTournament,
  } = useMultiLiveViewer();
  const [tournaments, setTournaments] = useState<SavedTournament[]>([]);
  const [failedIds, setFailedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(
    Boolean(document.fullscreenElement)
  );

  const loadSelectedTournaments = useCallback(async () => {
    const results = await Promise.allSettled(
      selectedTournamentIds.map(id => getTournament(id))
    );
    const loaded: SavedTournament[] = [];
    const failures: string[] = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value) {
        loaded.push(result.value);
      } else {
        failures.push(selectedTournamentIds[index]);
      }
    });

    setTournaments(loaded);
    setFailedIds(failures);
    setIsLoading(false);
  }, [selectedTournamentIds]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadSelectedTournaments();
    }, 0);

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadSelectedTournaments();
      }
    }, 2000);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [loadSelectedTournaments]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.error(error);
    }
  }

  const gridClassName = useMemo(() => {
    if (tournaments.length <= 1) return "grid-cols-1";
    if (tournaments.length <= 4) return "grid-cols-1 md:grid-cols-2";
    if (tournaments.length <= 8) return "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3";
    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4";
  }, [tournaments.length]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-slate-950 p-3 text-white md:p-5">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-700 pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <PanelsTopLeft className="h-7 w-7 shrink-0 text-emerald-400" />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold md:text-3xl">Multi Live Viewer</h1>
            <p className="mt-0.5 text-xs text-slate-400 md:text-sm">
              {selectedTournamentIds.length} tournament{selectedTournamentIds.length === 1 ? "" : "s"} selected
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm font-semibold transition hover:bg-slate-800"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            <span className="hidden sm:inline">{isFullscreen ? "Exit Full Screen" : "Full Screen"}</span>
          </button>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm font-semibold transition hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Events</span>
          </Link>
        </div>
      </header>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-slate-400">
          Loading live tournaments…
        </div>
      ) : tournaments.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <PanelsTopLeft className="h-12 w-12 text-slate-600" />
          <h2 className="mt-5 text-2xl font-semibold">No tournaments added</h2>
          <p className="mt-2 max-w-md text-slate-400">
            Open a live tournament and use Add to Multi View to build this screen.
          </p>
          <Link
            to="/events"
            className="mt-5 rounded-xl bg-white px-4 py-2.5 font-semibold text-slate-900"
          >
            Browse Events
          </Link>
        </div>
      ) : (
        <div className={`mt-3 grid min-h-0 flex-1 gap-3 overflow-y-auto ${gridClassName}`}>
          {tournaments.map(tournament => {
            const poolMatches = tournament.matches.filter(match => !match.completed);
            const knockoutMatches = tournament.knockout.filter(
              match => !match.completed && match.playerOne && match.playerTwo
            );

            return (
              <section
                key={tournament.id}
                className="flex min-h-[300px] min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 p-3 shadow-2xl md:min-h-[340px]"
              >
                <div className="flex min-h-0 flex-1">
                  <LiveTournamentPanel
                    name={tournament.settings.name || "Tournament"}
                    pools={tournament.pools}
                    poolMatches={poolMatches}
                    knockoutMatches={knockoutMatches}
                    compact
                    viewerCount={tournaments.length}
                    action={!isFullscreen ? (
                      <button
                        type="button"
                        onClick={() => removeTournament(tournament.id)}
                        className="rounded-lg border border-slate-600 bg-slate-900 p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
                        aria-label={`Remove ${tournament.settings.name || "tournament"} from multi view`}
                        title="Remove from Multi View"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : undefined}
                  />
                </div>
              </section>
            );
          })}

          {failedIds.map(id => (
            <section
              key={id}
              className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-red-900/60 bg-slate-900 p-5 text-center"
            >
              <h2 className="font-semibold">This tournament could not be loaded</h2>
              <button
                type="button"
                onClick={() => removeTournament(id)}
                className="mt-3 text-sm font-semibold text-red-300 hover:text-red-200"
              >
                Remove from Multi View
              </button>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
