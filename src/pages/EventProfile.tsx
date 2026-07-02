import { Link, useParams } from "react-router-dom";

import { getEvents } from "../services/eventService";
import { getMatches } from "../services/matchService";
import { getPlayer } from "../services/playerService";

export default function EventProfile() {
  const { id } = useParams();

  const event = getEvents().find(
    (e) => e.id === id
  );

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

  const matches = getMatches().filter(
    (m) => m.eventId === event.id
  );

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

  const ranking = [...standings.entries()]
    .sort((a, b) => b[1].wins - a[1].wins);

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

                const player = getPlayer(playerId);

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

    </div>
  );
}