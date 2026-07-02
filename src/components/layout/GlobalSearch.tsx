import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { Player } from "../../types/player";
import type { Club } from "../../types/club";
import type { Event } from "../../types/event";

import { getPlayers } from "../../services/supabase/playerService";
import { getClubs } from "../../services/supabase/clubService";
import { getEvents } from "../../services/supabase/eventService";

export default function GlobalSearch() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");

  const [players, setPlayers] = useState<Player[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      const [playerData, clubData, eventData] =
        await Promise.all([
          getPlayers(),
          getClubs(),
          getEvents(),
        ]);

      setPlayers(playerData);
      setClubs(clubData);
      setEvents(eventData);
    } catch (error) {
      console.error(error);
    }
  }

  const results = useMemo(() => {
    if (!query.trim()) return [];

    const search = query.toLowerCase();

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

  return (
    <div className="relative">

      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
      />

      {results.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg z-50 overflow-hidden">

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

    </div>
  );
}