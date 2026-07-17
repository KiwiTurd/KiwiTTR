import { useCallback, useEffect, useState } from "react";

import {
  History,
  Trophy,
} from "lucide-react";

import type { Match } from "../../types/match";
import type { Player } from "../../types/player";

import { getMatches, getRecentMatches } from "../../services/supabase/matchService";
import { getPlayers } from "../../services/supabase/playerService";

export default function MatchHistory({
  eventId,
  refreshKey = 0,
}: {
  eventId?: string;
  refreshKey?: number;
} = {}) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [matchData, playerData] = await Promise.all([
        eventId ? getMatches() : getRecentMatches(10),
        getPlayers(),
      ]);

      setMatches(
        eventId
          ? matchData.filter((match) => match.eventId === eventId)
          : matchData
      );
      setPlayers(playerData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData, refreshKey]);

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center gap-3 border-b px-8 py-5">

          <History className="h-6 w-6 text-blue-700" />

          <h2 className="text-2xl font-bold">
            {eventId ? "Club Night Matches" : "Recent Matches"}
          </h2>

        </div>

        <p className="p-8 text-slate-500">
          Loading...
        </p>

      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      <div className="flex items-center justify-between gap-4 border-b px-8 py-5">

        <div className="flex items-center gap-3">

          <History className="h-6 w-6 text-blue-700" />

          <h2 className="text-2xl font-bold">
            {eventId ? "Club Night Matches" : "Recent Matches"}
          </h2>

        </div>

        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {eventId ? "This event" : "Last 10"}
        </span>

      </div>

      <div className="p-8">

      {matches.length === 0 ? (

        <p className="text-slate-500">
          No matches recorded.
        </p>

      ) : (

        <div className="divide-y divide-slate-100">

          {matches.map((match) => {
          const winner = players.find(
            (p) => p.id === match.winnerId
          );

          const loser = players.find(
            (p) => p.id === match.loserId
          );

          return (
            <div
              key={match.id}
              className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:justify-between"
            >

              <div className="flex items-start gap-3">

                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <Trophy className="h-4 w-4" />
                </div>

                <div>
                  <div className="font-semibold">
                    {winner?.firstName} {winner?.lastName}
                    {" "}defeated{" "}
                    {loser?.firstName} {loser?.lastName}
                  </div>

                  <div className="text-sm text-slate-500">
                    {new Date(match.playedAt).toLocaleString()}
                  </div>
                </div>

              </div>

              <div className="text-sm font-semibold text-slate-500">
                {match.winnerRatingChange > 0
                  ? `+${match.winnerRatingChange}`
                  : match.winnerRatingChange}
                {" "}TTR
              </div>

            </div>
          );
          })}

        </div>

      )}

      </div>

    </div>
  );
}
