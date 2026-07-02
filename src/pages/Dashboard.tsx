import { Link } from "react-router-dom";

import { getPlayer } from "../services/playerService";

import {
  getLatestMatch,
  getActivePlayerCount,
  getClubCount,
} from "../services/statisticsService";

import TopRatedPlayersCard from "../components/dashboard/TopRatedPlayersCard";

export default function Dashboard() {
  const latestMatch = getLatestMatch();

  const winner = latestMatch
    ? getPlayer(latestMatch.winnerId)
    : undefined;

  const loser = latestMatch
    ? getPlayer(latestMatch.loserId)
    : undefined;

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
              {getActivePlayerCount()}
            </h2>

          </div>

          <div className="bg-white rounded-xl shadow p-6">

            <p className="text-slate-500">
              Clubs
            </p>

            <h2 className="text-5xl font-bold mt-2">
              {getClubCount()}
            </h2>

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

        {latestMatch && winner && loser ? (

          <div>

            <p className="text-xl font-semibold">

              {winner.firstName} {winner.lastName}

            </p>

            <p className="text-slate-500">
              defeated
            </p>

            <p className="text-xl font-semibold">

              {loser.firstName} {loser.lastName}

            </p>

            <p className="mt-4 text-green-600 font-bold text-lg">

              +{latestMatch.winnerRatingChange}

            </p>

          </div>

        ) : (

          <p className="text-slate-500">
            No matches yet.
          </p>

        )}

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