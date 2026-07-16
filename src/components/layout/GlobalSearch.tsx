import { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import type { Player } from "../../types/player";
import type { Club } from "../../types/club";
import type { Event } from "../../types/event";

import { getPlayers } from "../../services/supabase/playerService";
import { getClubs } from "../../services/supabase/clubService";
import { getEvents } from "../../services/supabase/eventService";
import { KiwiTtrLoadingAnimation } from "../shared/LoadingScreen";

type SearchData = {
  players: Player[];
  clubs: Club[];
  events: Event[];
};

let cachedSearchData: SearchData | null = null;
let searchDataRequest: Promise<SearchData> | null = null;

function getSearchData() {
  if (cachedSearchData) {
    return Promise.resolve(cachedSearchData);
  }

  if (!searchDataRequest) {
    searchDataRequest = Promise.all([
      getPlayers(),
      getClubs(),
      getEvents(),
    ])
      .then(([players, clubs, events]) => {
        cachedSearchData = {
          players,
          clubs,
          events,
        };

        return cachedSearchData;
      })
      .catch((error) => {
        searchDataRequest = null;
        throw error;
      });
  }

  return searchDataRequest;
}

export default function GlobalSearch({
  resultsPlacement = "down",
}: {
  resultsPlacement?: "up" | "down";
}) {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [showCross, setShowCross] = useState(false);
  const [showBounce, setShowBounce] = useState(false);

  const [players, setPlayers] = useState<Player[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  const loadData = useCallback(async () => {
    try {
      const data = await getSearchData();

      setPlayers(data.players);
      setClubs(data.clubs);
      setEvents(data.events);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];

    const search = query.toLowerCase();

    if (["bounce", "flappy bat", "jesus"].includes(search.trim())) {
      return [];
    }

    const playerResults = players
      .filter((player) =>
        `${player.firstName} ${player.lastName}`
          .toLowerCase()
          .includes(search)
      )
      .map((player) => ({
        id: player.id,
        type: "Player",
        name: `${player.firstName} ${player.lastName}`,
        path: `/players/${player.id}`,
      }));

    const clubResults = clubs
      .filter((club) =>
        club.name.toLowerCase().includes(search)
      )
      .map((club) => ({
        id: club.id,
        type: "Club",
        name: club.name,
        path: `/clubs/${club.id}`,
      }));

    const eventResults = events
      .filter((event) =>
        event.name.toLowerCase().includes(search)
      )
      .map((event) => ({
        id: event.id,
        type: "Event",
        name: event.name,
        path: `/events/${event.id}`,
      }));

    return [
      ...playerResults,
      ...clubResults,
      ...eventResults,
    ].slice(0, 10);
  }, [query, players, clubs, events]);

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key !== "Enter") {
      return;
    }

    const easterEgg = query.trim().toLowerCase();

    if (easterEgg === "flappy bat") {
      event.preventDefault();
      setQuery("");
      navigate("/flappy-bat");
    }

    if (easterEgg === "jesus") {
      event.preventDefault();
      setQuery("");
      setShowCross(true);
    }

    if (easterEgg === "bounce") {
      event.preventDefault();
      setQuery("");
      setShowBounce(true);
    }
  }

  return (
    <div className="relative">

      <input
        type="text"
        placeholder="Search..."
        value={query}
        onFocus={() => void loadData()}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
      />

      {results.length > 0 && (
        <div
          className={`absolute left-0 right-0 z-50 max-h-[45vh] overflow-y-auto rounded-lg border bg-white shadow-lg ${
            resultsPlacement === "up"
              ? "bottom-full mb-2"
              : "mt-2"
          }`}
        >

          {results.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => {
                navigate(result.path);
                setQuery("");
              }}
              className="w-full text-left px-4 py-3 hover:bg-slate-100 border-b last:border-b-0"
            >
              <div className="text-xs uppercase text-slate-400">
                {result.type}
              </div>

              <div className="font-medium">
                {result.name}
              </div>

            </button>
          ))}

        </div>
      )}

      {showCross && createPortal(
        <button
          aria-label="Close Easter egg"
          className="fixed inset-0 z-[100] flex cursor-pointer items-center justify-center overflow-hidden bg-slate-950/95"
          onClick={() => setShowCross(false)}
          type="button"
        >
          <span className="absolute inset-0 bg-[radial-gradient(circle,rgba(250,204,21,0.22)_0%,rgba(15,23,42,0)_65%)]" />
          <span className="relative block h-[72vh] w-[48vh] max-h-[720px] max-w-[480px] animate-pulse drop-shadow-[0_0_45px_rgba(250,204,21,0.85)]">
            <span className="absolute left-1/2 top-0 h-full w-[20%] -translate-x-1/2 rounded-sm bg-gradient-to-b from-amber-100 via-yellow-300 to-amber-500" />
            <span className="absolute left-0 top-[28%] h-[14%] w-full rounded-sm bg-gradient-to-r from-amber-500 via-yellow-200 to-amber-500" />
          </span>
          <span className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs font-medium uppercase tracking-[0.3em] text-amber-100/70">
            Tap to close
          </span>
        </button>
      , document.body)}

      {showBounce && createPortal(
        <button
          aria-label="Close bounce animation"
          className="fixed inset-0 z-[100] flex cursor-pointer items-center justify-center bg-slate-100"
          onClick={() => setShowBounce(false)}
          type="button"
        >
          <KiwiTtrLoadingAnimation />
          <span className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs font-medium uppercase tracking-[0.3em] text-slate-500">
            Tap to close
          </span>
        </button>
      , document.body)}

    </div>
  );
}
