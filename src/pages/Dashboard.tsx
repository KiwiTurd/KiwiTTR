import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Users,
  Building2,
  CalendarDays,
  ShieldCheck,
  Trophy,
  ClipboardPen,
  ArrowRight,
} from "lucide-react";

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

      const data =
        await getDashboardData();

      setDashboard(data);

    } catch (error) {

      console.error(error);

    }

  }

  const activePlayers =
    dashboard?.activePlayers ?? 0;

  const clubs =
    dashboard?.clubs.length ?? 0;

  const events =
    dashboard?.totalEvents ?? 0;

  return (

    <div className="mx-auto max-w-7xl space-y-10">

      {/* Header */}

      <div>

        <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">

          KiwiTTR

        </p>

        <h1 className="mt-2 text-5xl font-black tracking-tight">

          Dashboard

        </h1>

        <p className="mt-3 text-lg text-slate-500">

          Welcome back. Here's what's happening today.

        </p>

      </div>

      {/* Stats */}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <Users className="h-8 w-8 text-blue-700" />

            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">

              Players

            </span>

          </div>

          <h2 className="mt-6 text-5xl font-black">

            {activePlayers}

          </h2>

          <p className="mt-2 text-slate-500">

            Active Players

          </p>

        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <Building2 className="h-8 w-8 text-indigo-600" />

            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">

              Clubs

            </span>

          </div>

          <h2 className="mt-6 text-5xl font-black">

            {clubs}

          </h2>

          <p className="mt-2 text-slate-500">

            Registered Clubs

          </p>

        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <CalendarDays className="h-8 w-8 text-emerald-600" />

            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">

              Events

            </span>

          </div>

          <h2 className="mt-6 text-5xl font-black">

            {events}

          </h2>

          <p className="mt-2 text-slate-500">

            Total Events

          </p>

        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <ShieldCheck className="h-8 w-8 text-green-600" />

            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">

              Status

            </span>

          </div>

          <h2 className="mt-6 text-2xl font-bold">

            {loading
              ? "Checking..."
              : session
              ? "Online"
              : "Offline"}

          </h2>

          <p className="mt-2 text-slate-500 truncate">

            {session?.user.email ?? "Not signed in"}

          </p>

        </div>

      </div>

      {/* Rankings */}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

        <div className="flex items-center justify-between border-b px-8 py-5">

          <div className="flex items-center gap-3">

            <Trophy className="h-6 w-6 text-amber-500" />

            <h2 className="text-2xl font-bold">

              Top Rated Players

            </h2>

          </div>

        </div>

        <div className="p-8">

          <TopRatedPlayersCard />

        </div>

      </div>

      {/* Quick Actions */}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8">

        <h2 className="text-2xl font-bold mb-6">

          Quick Actions

        </h2>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

          <Link
            to="/matches"
            className="group rounded-2xl bg-blue-900 p-6 text-white transition hover:bg-blue-800"
          >

            <ClipboardPen className="mb-5 h-8 w-8" />

            <h3 className="text-xl font-semibold">

              Record Match

            </h3>

            <div className="mt-6 flex items-center gap-2 text-blue-200 group-hover:text-white">

              Open

              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />

            </div>

          </Link>

          <Link
            to="/players"
            className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-blue-300 hover:shadow-md"
          >

            <Users className="mb-5 h-8 w-8 text-blue-700" />

            <h3 className="text-xl font-semibold">

              Players

            </h3>

          </Link>

          <Link
            to="/rankings"
            className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-blue-300 hover:shadow-md"
          >

            <Trophy className="mb-5 h-8 w-8 text-amber-500" />

            <h3 className="text-xl font-semibold">

              Rankings

            </h3>

          </Link>

          <Link
            to="/events"
            className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-blue-300 hover:shadow-md"
          >

            <CalendarDays className="mb-5 h-8 w-8 text-emerald-600" />

            <h3 className="text-xl font-semibold">

              Events

            </h3>

          </Link>

        </div>

      </div>

    </div>

  );

}