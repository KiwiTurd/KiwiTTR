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
          Match Centre
        </h1>

        <p className="mt-3 text-lg text-slate-500">
          Record match results and review the latest outcomes.
        </p>

      </div>

      <MatchForm />

      <MatchHistory />

    </div>
  );
}
