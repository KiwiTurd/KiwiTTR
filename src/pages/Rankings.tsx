import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import type { Player } from "../types/player";
import type { Club } from "../types/club";

import { getPlayers } from "../services/supabase/playerService";
import { getClubs } from "../services/supabase/clubService";

import { notify } from "../services/notificationService";

export default function Rankings() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [clubFilter, setClubFilter] = useState("");

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [playerData, clubData] = await Promise.all([
        getPlayers(),
        getClubs(),
      ]);

      setPlayers(playerData);
      setClubs(clubData);

    } catch (error) {
      console.error(error);
      notify.fault("Failed to load rankings.");
    } finally {
      setLoading(false);
    }
  }

  const rankings = useMemo(() => {
    return players
      .filter((player) => player.isActive)
      .filter((player) =>
        !clubFilter ? true : player.clubId === clubFilter
      )
      .filter((player) =>
        `${player.firstName} ${player.lastName}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
      .sort((a, b) => b.rating - a.rating);
  }, [players, clubFilter, search]);

  function getClubName(clubId: string) {
    return clubs.find((c) => c.id === clubId)?.name ?? "-";
  }

  function getRankDisplay(rank: number) {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return rank.toString();
    }
  }

  return (
    <div className="max-w-7xl mx-auto">

      <div className="flex justify-between items-center mb-8">

        <div>
          <h1 className="text-4xl font-bold">
            Grand Rankings
          </h1>

          <p className="text-slate-500 mt-2">
            Live KiwiTTR Rankings
          </p>
        </div>

      </div>

      <div className="bg-white rounded-xl shadow p-6 mb-8">

        <div className="grid md:grid-cols-2 gap-4">

          <input
            type="text"
            placeholder="Search player..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg p-3"
          />

          <select
            value={clubFilter}
            onChange={(e) => setClubFilter(e.target.value)}
            className="border rounded-lg p-3"
          >
            <option value="">
              All Clubs
            </option>

            {clubs.map((club) => (
              <option
                key={club.id}
                value={club.id}
              >
                {club.name}
              </option>
            ))}

          </select>

        </div>

      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">

        <table className="w-full">

          <thead className="bg-slate-100">

            <tr>

              <th className="text-left p-4">
                Rank
              </th>

              <th className="text-left">
                Player
              </th>

              <th className="text-left">
                Club
              </th>

              <th className="text-center">
                Rating
              </th>

              <th className="text-center">
                W
              </th>

              <th className="text-center">
                L
              </th>

              <th className="text-center">
                Win %
              </th>

            </tr>

          </thead>

          <tbody>

            {loading ? (

              <tr>

                <td
                  colSpan={7}
                  className="text-center py-10 text-slate-500"
                >
                  Loading rankings...
                </td>

              </tr>

            ) : rankings.length === 0 ? (

              <tr>

                <td
                  colSpan={7}
                  className="text-center py-10 text-slate-500"
                >
                  No players found.
                </td>

              </tr>

            ) : (

              rankings.map((player, index) => {

                const matches =
                  player.wins + player.losses;

                const winPercentage =
                  matches === 0
                    ? "-"
                    : `${(
                        (player.wins / matches) *
                        100
                      ).toFixed(1)}%`;

                return (

                  <tr
                    key={player.id}
                    className="border-t hover:bg-slate-50 transition"
                  >

                    <td className="p-4 font-bold text-lg">
                      {getRankDisplay(index + 1)}
                    </td>

                    <td className="font-medium">

                      <Link
                        to={`/players/${player.id}`}
                        className="text-blue-700 hover:text-blue-900 hover:underline"
                      >
                        {player.firstName} {player.lastName}
                      </Link>

                    </td>

                    <td>
                      {getClubName(player.clubId)}
                    </td>

                    <td className="text-center font-bold">
                      {player.rating}
                    </td>

                    <td className="text-center">
                      {player.wins}
                    </td>

                    <td className="text-center">
                      {player.losses}
                    </td>

                    <td className="text-center">
                      {winPercentage}
                    </td>

                  </tr>

                );

              })

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}