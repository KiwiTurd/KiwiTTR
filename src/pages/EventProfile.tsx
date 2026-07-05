import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import type { Event } from "../types/event";
import type { Match } from "../types/match";
import type { Player } from "../types/player";

import { getEvents } from "../services/supabase/eventService";
import { getMatches } from "../services/supabase/matchService";
import { getPlayers } from "../services/supabase/playerService";

import { notify } from "../services/notificationService";

import EventMatchCard from "../components/events/EventMatchCard";

export default function EventProfile() {
  const { id } = useParams();

  const [event, setEvent] = useState<Event | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  const [showMatches, setShowMatches] = useState(false);

  useEffect(() => {
    void loadData();
  }, [id]);

  async function loadData() {
    if (!id) return;

    try {
      const [events, matchData, playerData] =
        await Promise.all([
          getEvents(),
          getMatches(),
          getPlayers(),
        ]);

      setEvent(
        events.find((e) => e.id === id) ?? null
      );

      setMatches(
        matchData.filter(
          (m) => m.eventId === id
        )
      );

      setPlayers(playerData);

    } catch (error) {
      console.error(error);
      notify.fault("Unable to load event.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold">
          Loading...
        </h1>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-6xl mx-auto">

        <h1 className="text-4xl font-bold">
          Event Not Found
        </h1>

        <Link
          to="/events"
          className="text-blue-700 hover:underline mt-4 inline-block"
        >
          ← Back to Events
        </Link>

      </div>
    );
  }

  const standings = new Map<
    string,
    {
      wins: number;
      losses: number;
    }
  >();

  matches.forEach((match) => {

    if (!standings.has(match.winnerId)) {
      standings.set(match.winnerId, {
        wins: 0,
        losses: 0,
      });
    }

    if (!standings.has(match.loserId)) {
      standings.set(match.loserId, {
        wins: 0,
        losses: 0,
      });
    }

    standings.get(match.winnerId)!.wins++;
    standings.get(match.loserId)!.losses++;

  });

  const ranking = [...standings.entries()].sort(
    (a, b) => b[1].wins - a[1].wins
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      <Link
        to="/events"
        className="text-blue-700 hover:underline"
      >
        ← Back to Events
      </Link>

      <div className="bg-white rounded-xl shadow p-8">

        <h1 className="text-5xl font-bold">
          🏓 {event.name}
        </h1>

        <p className="text-slate-500 mt-3">
          {new Date(event.date).toLocaleDateString()}
        </p>

      </div>

      <div className="grid md:grid-cols-2 gap-6">

        <div className="bg-white rounded-xl shadow p-6">

          <p className="text-slate-500">
            Players
          </p>

          <h2 className="text-5xl font-bold mt-2">
            {standings.size}
          </h2>

        </div>

        <div className="bg-white rounded-xl shadow p-6">

          <p className="text-slate-500">
            Matches
          </p>

          <h2 className="text-5xl font-bold mt-2">
            {matches.length}
          </h2>

        </div>

      </div>

      <div className="bg-white rounded-xl shadow p-8">

        <h2 className="text-2xl font-bold mb-6">
          Standings
        </h2>

        {ranking.length === 0 ? (

          <p className="text-slate-500">
            No matches yet.
          </p>

        ) : (

          <table className="w-full">

            <thead>

              <tr className="border-b">

                <th className="text-left pb-3">
                  Rank
                </th>

                <th className="text-left pb-3">
                  Player
                </th>

                <th className="text-center pb-3">
                  W
                </th>

                <th className="text-center pb-3">
                  L
                </th>

              </tr>

            </thead>

            <tbody>

              {ranking.map(([playerId, stats], index) => {

                const player = players.find(
                  (p) => p.id === playerId
                );

                return (

                  <tr
                    key={playerId}
                    className="border-b"
                  >

                    <td className="py-3">

                      {index === 0
                        ? "🥇"
                        : index === 1
                        ? "🥈"
                        : index === 2
                        ? "🥉"
                        : index + 1}

                    </td>

                    <td>

                      {player
                        ? `${player.firstName} ${player.lastName}`
                        : "Unknown"}

                    </td>

                    <td className="text-center">
                      {stats.wins}
                    </td>

                    <td className="text-center">
                      {stats.losses}
                    </td>

                  </tr>

                );

              })}

            </tbody>

          </table>

        )}

      </div>

      <div className="bg-white rounded-xl shadow p-8">

        <button
          onClick={() =>
            setShowMatches(!showMatches)
          }
          className="w-full flex items-center justify-between hover:text-blue-700 transition"
        >

          <h2 className="text-2xl font-bold">
            Match Results ({matches.length})
          </h2>

          <span
            className={`text-2xl transition-transform duration-300 ${
              showMatches
                ? "rotate-90"
                : ""
            }`}
          >
            ▶
          </span>

        </button>

        <div
          className={`overflow-hidden transition-all duration-500 ${
            showMatches
              ? "max-h-[5000px] opacity-100 mt-6"
              : "max-h-0 opacity-0"
          }`}
        >

          {matches.length === 0 ? (

            <p className="text-slate-500">
              No matches have been recorded yet.
            </p>

          ) : (

            <div className="space-y-4">

              {matches.map((match) => (

                <EventMatchCard
                  key={match.id}
                  match={match}
                  winner={players.find(
                    (p) =>
                      p.id === match.winnerId
                  )}
                  loser={players.find(
                    (p) =>
                      p.id === match.loserId
                  )}
                />

              ))}

            </div>

          )}

        </div>

      </div>

    </div>
  );
}