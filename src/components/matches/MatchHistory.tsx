import { useEffect, useState } from "react";

import type { Match } from "../../types/match";

import { getMatches } from "../../services/matchService";
import { getPlayers } from "../../services/playerService";

export default function MatchHistory() {

  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    setMatches(getMatches());
  }, []);

  const players = getPlayers();

  return (
    <div className="bg-white rounded-xl shadow p-6 mt-8">

      <h2 className="text-2xl font-bold mb-6">
        Recent Matches
      </h2>

      {matches.length === 0 && (
        <p className="text-slate-500">
          No matches recorded.
        </p>
      )}

      {matches.map(match => {

        const winner = players.find(
          p => p.id === match.winnerId
        );

        const loser = players.find(
          p => p.id === match.loserId
        );

        return (

          <div
            key={match.id}
            className="border-b py-4"
          >

            <div className="font-semibold">

              {winner?.firstName} {winner?.lastName}

              {" "}defeated{" "}

              {loser?.firstName} {loser?.lastName}

            </div>

            <div className="text-sm text-slate-500">

              {new Date(
                match.playedAt
              ).toLocaleString()}

            </div>

          </div>

        );

      })}

    </div>
  );

}