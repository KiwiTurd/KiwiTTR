import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  ListChecks,
  Trophy,
  Users,
} from "lucide-react";

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
        <h1 className="text-3xl font-bold">
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
          className="mt-4 inline-flex items-center gap-2 text-blue-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Events
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
        className="inline-flex items-center gap-2 text-blue-700 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Events
      </Link>

      <div className="rounded-3xl border bg-white p-6 shadow-sm">

        <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
          <CalendarDays className="h-4 w-4" />
          Event
        </div>

        <h1 className="mt-4 text-4xl font-black tracking-tight">
          {event.name}
        </h1>

        <p className="mt-2 text-slate-500">
          {new Date(event.date).toLocaleDateString()}
        </p>

      </div>

      <div className="grid gap-3 md:grid-cols-2">

        <CompactStat
          icon={<Users className="h-5 w-5 text-blue-700" />}
          label="Players"
          value={standings.size}
        />

        <CompactStat
          icon={<Trophy className="h-5 w-5 text-amber-500" />}
          label="Matches"
          value={matches.length}
        />

      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

        <div className="flex items-center gap-3 border-b px-5 py-4">
          <ListChecks className="h-5 w-5 text-blue-700" />
          <h2 className="text-xl font-bold">
            Standings
          </h2>
        </div>

        {ranking.length === 0 ? (

          <p className="px-5 py-6 text-sm text-slate-500">
            No matches yet.
          </p>

        ) : (

          <table className="w-full text-sm">

            <thead>

              <tr className="border-b bg-slate-50 text-slate-500">

                <th className="px-5 py-3 text-left font-semibold">
                  Rank
                </th>

                <th className="px-5 py-3 text-left font-semibold">
                  Player
                </th>

                <th className="px-5 py-3 text-center font-semibold">
                  W
                </th>

                <th className="px-5 py-3 text-center font-semibold">
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
                    className="border-b last:border-b-0 hover:bg-slate-50"
                  >

                    <td className="px-5 py-3 font-semibold">

                      {index === 0
                        ? "1"
                        : index === 1
                        ? "2"
                        : index === 2
                        ? "3"
                        : index + 1}

                    </td>

                    <td className="px-5 py-3">

                      {player
                        ? `${player.firstName} ${player.lastName}`
                        : "Unknown"}

                    </td>

                    <td className="px-5 py-3 text-center font-semibold">
                      {stats.wins}
                    </td>

                    <td className="px-5 py-3 text-center font-semibold">
                      {stats.losses}
                    </td>

                  </tr>

                );

              })}

            </tbody>

          </table>

        )}

      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

        <button
          onClick={() =>
            setShowMatches(!showMatches)
          }
          className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-50"
        >

          <h2 className="text-xl font-bold">
            Match Results ({matches.length})
          </h2>

          <ChevronRight
            className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${
              showMatches
                ? "rotate-90"
                : ""
            }`}
          />

        </button>

        <div
          className={`overflow-hidden transition-all duration-500 ${
            showMatches
              ? "max-h-[5000px] border-t p-5 opacity-100"
              : "max-h-0 opacity-0"
          }`}
        >

          {matches.length === 0 ? (

            <p className="text-sm text-slate-500">
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

function CompactStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm">
      {icon}
      <div>
        <p className="text-xs font-semibold uppercase text-slate-500">
          {label}
        </p>
        <p className="text-xl font-black">
          {value}
        </p>
      </div>
    </div>
  );
}
