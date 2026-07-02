import { Link } from "react-router-dom";

import { getTopRatedPlayers } from "../../services/statisticsService";

export default function TopRatedPlayersCard() {
  const players = getTopRatedPlayers();

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="bg-white rounded-xl shadow p-6 h-full">

      <h2 className="text-xl font-bold mb-5">
        🏆 Top Rated Players
      </h2>

      <div className="space-y-3">

        {players.length === 0 && (
          <p className="text-slate-500">
            No players yet.
          </p>
        )}

        {players.map((player, index) => (

          <Link
            key={player.id}
            to={`/players/${player.id}`}
            className="flex justify-between items-center rounded-lg px-3 py-3 hover:bg-slate-50 transition"
          >

            <div className="flex items-center gap-3">

              <span className="w-7 text-xl">

                {index < 3
                  ? medals[index]
                  : index + 1}

              </span>

              <span className="font-medium">

                {player.firstName} {player.lastName}

              </span>

            </div>

            <span className="font-bold text-lg">

              {player.rating}

            </span>

          </Link>

        ))}

      </div>

    </div>
  );
}