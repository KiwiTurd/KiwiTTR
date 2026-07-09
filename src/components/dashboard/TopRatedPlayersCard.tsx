import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import type { Player } from "../../types/player";

import { getPlayers } from "../../services/supabase/playerService";

export default function TopRatedPlayersCard() {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    void loadPlayers();
  }, []);

  async function loadPlayers() {
    try {
      const data = await getPlayers();

      setPlayers(
        data
          .filter((player) => player.isActive)
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 5)
      );
    } catch (error) {
      console.error(error);
    }
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="divide-y">

        {players.length === 0 ? (

          <p className="px-5 py-4 text-sm text-slate-500">
            No players yet.
          </p>

        ) : (

          players.map((player, index) => (

            <Link
              key={player.id}
              to={`/players/${player.id}`}
              className="flex items-center justify-between gap-4 px-5 py-3 transition hover:bg-slate-50"
            >

              <div className="flex min-w-0 items-center gap-3">

                <span className="w-7 shrink-0 text-lg">
                  {index < 3 ? medals[index] : index + 1}
                </span>

                <span className="truncate text-sm font-semibold">
                  {player.firstName} {player.lastName}
                </span>

              </div>

              <span className="text-base font-black">
                {player.rating}
              </span>

            </Link>

          ))

        )}

    </div>
  );
}
