import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import type { Player } from "../types/player";
import type { Club } from "../types/club";

import { getPlayer } from "../services/supabase/playerService";
import { getClubs } from "../services/supabase/clubService";

export default function PlayerProfile() {
  const { id } = useParams();

  const [player, setPlayer] = useState<Player | null>(null);
  const [club, setClub] = useState<Club | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadData();
  }, [id]);

  async function loadData() {
    if (!id) return;

    try {
      setLoading(true);

      const playerData = await getPlayer(id);

      if (!playerData) {
        setPlayer(null);
        setLoading(false);
        return;
      }

      setPlayer(playerData);

      const clubs = await getClubs();

      const playerClub =
        clubs.find((c) => c.id === playerData.clubId) ?? null;

      setClub(playerClub);

    } catch (error) {
      console.error(error);
      alert("Unable to load player.");
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

  if (!player) {
    return (
      <div className="max-w-6xl mx-auto">

        <h1 className="text-4xl font-bold mb-4">
          Player Not Found
        </h1>

        <Link
          to="/rankings"
          className="text-blue-700 hover:underline"
        >
          ← Back to Rankings
        </Link>

      </div>
    );
  }

  const winPercentage =
    player.matchesPlayed === 0
      ? 0
      : (
          (player.wins / player.matchesPlayed) *
          100
        ).toFixed(1);

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      <Link
        to="/rankings"
        className="text-blue-700 hover:underline"
      >
        ← Back to Rankings
      </Link>

      <div className="bg-white rounded-xl shadow p-8">

        <h1 className="text-4xl font-bold">
          {player.firstName} {player.lastName}
        </h1>

        <p className="text-slate-500 text-lg mt-2">
          {club?.name ?? "-"}
        </p>

      </div>

      <div className="grid md:grid-cols-4 gap-4">

        <div className="bg-white rounded-xl shadow p-6 text-center">

          <p className="text-slate-500">
            Rating
          </p>

          <p className="text-4xl font-bold mt-2">
            {player.rating}
          </p>

        </div>

        <div className="bg-white rounded-xl shadow p-6 text-center">

          <p className="text-slate-500">
            Highest Rating
          </p>

          <p className="text-4xl font-bold mt-2">
            {player.highestRating}
          </p>

        </div>

        <div className="bg-white rounded-xl shadow p-6 text-center">

          <p className="text-slate-500">
            Matches
          </p>

          <p className="text-4xl font-bold mt-2">
            {player.matchesPlayed}
          </p>

        </div>

        <div className="bg-white rounded-xl shadow p-6 text-center">

          <p className="text-slate-500">
            Win %
          </p>

          <p className="text-4xl font-bold mt-2">
            {winPercentage}%
          </p>

        </div>

      </div>

      <div className="bg-white rounded-xl shadow p-8">

        <h2 className="text-2xl font-bold mb-6">
          Career Statistics
        </h2>

        <div className="grid md:grid-cols-2 gap-y-4">

          <p>Wins</p>
          <p className="font-semibold">
            {player.wins}
          </p>

          <p>Losses</p>
          <p className="font-semibold">
            {player.losses}
          </p>

          <p>Provisional Matches Remaining</p>
          <p className="font-semibold">
            {player.provisionalMatchesRemaining}
          </p>

          <p>Status</p>
          <p className="font-semibold">
            {player.isActive ? "Active" : "Inactive"}
          </p>

          <p>Created</p>
          <p className="font-semibold">
            {new Date(player.createdAt).toLocaleDateString()}
          </p>

        </div>

      </div>

      <div className="bg-white rounded-xl shadow p-8">

        <h2 className="text-2xl font-bold mb-4">
          Coming Soon
        </h2>

        <ul className="list-disc ml-6 space-y-2 text-slate-600">

          <li>📈 Rating History</li>
          <li>🏓 Recent Matches</li>
          <li>🥇 National Ranking</li>
          <li>🏆 Club Ranking</li>
          <li>🤝 Head-to-Head Records</li>
          <li>📅 Upcoming Events</li>
          <li>🔥 Win/Loss Streaks</li>

        </ul>

      </div>

    </div>
  );
}