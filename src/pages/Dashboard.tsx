import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import TopRatedPlayersCard from "../components/dashboard/TopRatedPlayersCard";

import {
  getDashboardData,
} from "../services/supabase/dashboardService";

type DashboardData = Awaited<
  ReturnType<typeof getDashboardData>
>;

export default function Dashboard() {
  const { session, loading } = useAuth();

  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      const data = await getDashboardData();
      setDashboard(data);
    } catch (error) {
      console.error(error);
    }
  }

  const activePlayers =
    dashboard?.activePlayers ?? 0;

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

      <div className="grid lg:grid-cols-5 gap-6">

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
              {dashboard?.clubs.length ?? 0}
            </h2>

          </div>

          <div className="bg-white rounded-xl shadow p-6">

            <p className="text-slate-500">
              Events
            </p>

            <h2 className="text-5xl font-bold mt-2">
              {dashboard?.totalEvents ?? 0}
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

        <div className="lg:col-span-4">

          <TopRatedPlayersCard />

        </div>

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

      <div className="text-center text-sm text-slate-400 pb-2">
  KiwiTTR v{__APP_VERSION__} • © 2026
</div>

    </div>
  );
}