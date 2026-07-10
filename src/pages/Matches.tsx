import { Users } from "lucide-react";
import { Link } from "react-router-dom";

import MatchForm from "../components/matches/MatchForm";
import MatchHistory from "../components/matches/MatchHistory";

export default function Matches() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">

      <div>

        <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
          KiwiTTR
        </p>

        <h1 className="mt-2 text-5xl font-black tracking-tight">
          Management
        </h1>

        <p className="mt-3 text-lg text-slate-500">
          Record match results, review outcomes and manage players.
        </p>

      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/players"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800"
        >
          <Users className="h-5 w-5" />
          Player Management
        </Link>
      </div>

      <MatchForm />

      <MatchHistory />

    </div>
  );
}
