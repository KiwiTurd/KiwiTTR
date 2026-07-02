import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import type { Player } from "../types/player";
import type { Club } from "../types/club";

import { getPlayers } from "../services/supabase/playerService";
import { getClubs } from "../services/supabase/clubService";

import TopRatedPlayersCard from "../components/dashboard/TopRatedPlayersCard";

export default function Dashboard() {
  const { session, loading } = useAuth();

  const [players, setPlayers] = useState<Player[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      const [playerData, clubData] = await Promise.all([
        getPlayers(),
        getClubs(),
      ]);

      setPlayers(playerData);
      setClubs(clubData);
    } catch (error) {
      console.error(error);
    }
  }

  const activePlayers = players.filter(
    (player) => player.isActive
  ).length;

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      <div>

        <h1 className="text-5xl font-bold">
          Dashboard
        </h1>

        <p className="text-slate-500 mt-2">
          Welcome to KiwiTTR
        </p>

      </div>

      <div className="grid lg:grid-cols-4 gap-6">

        <div className="space-y-6">

          <div className="bg-white rounded-xl shadow p-6">

            <p className="text-slate-500">
              Active Players
            </p>

            <h2 className="text-5xl font-bold mt-2">
              {activePlayers}
            </h2>

          </div>

          <div className="bg-white rounded-xl shadow p-6">

            <p className="text-slate-500">
              Clubs
            </p>

            <h2 className="text-5xl font-bold mt-2">
              {clubs.length}
            </h2>

          </div>

          <div className="bg-white rounded-xl shadow p-6">

            <p className="text-slate-500">
              Authentication
            </p>

            {loading ? (

              <p className="font-semibold mt-2">
                Checking...
              </p>

            ) : session ? (

              <div className="space-y-2 mt-2">

                <p className="text-green-600 font-bold">
                  ✅ Logged In
                </p>

                <p className="text-sm break-all">
                  {session.user.email}
                </p>

              </div>

            ) : (

              <p className="text-red-600 font-bold mt-2">
                ❌ Not Logged In
              </p>

            )}

          </div>

        </div>

        <div className="lg:col-span-3">

          <TopRatedPlayersCard />

        </div>

      </div>

      <div className="bg-white rounded-xl shadow p-8">

        <h2 className="text-2xl font-bold mb-6">
          Latest Match
        </h2>

        <p className="text-slate-500">
          Coming soon with the new Match Engine.
        </p>

      </div>

      <div className="bg-white rounded-xl shadow p-8">

        <h2 className="text-2xl font-bold mb-6">
          Quick Actions
        </h2>

        <div className="grid md:grid-cols-4 gap-4">

          <Link
            to="/matches"
            className="bg-blue-900 text-white rounded-xl p-5 text-center hover:bg-blue-800 transition"
          >
            Record Match
          </Link>

          <Link
            to="/players"
            className="bg-white border rounded-xl p-5 text-center hover:bg-slate-50 transition"
          >
            Players
          </Link>

          <Link
            to="/rankings"
            className="bg-white border rounded-xl p-5 text-center hover:bg-slate-50 transition"
          >
            Rankings
          </Link>

          <Link
            to="/events"
            className="bg-white border rounded-xl p-5 text-center hover:bg-slate-50 transition"
          >
            Events
          </Link>

        </div>

      </div>

    </div>
  );
}