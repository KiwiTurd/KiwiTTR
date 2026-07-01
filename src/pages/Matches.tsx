import MatchForm from "../components/matches/MatchForm";
import MatchHistory from "../components/matches/MatchHistory";

export default function Matches() {
  return (
    <div className="max-w-5xl mx-auto">

      <h1 className="text-4xl font-bold mb-8">
        Match Centre
      </h1>

      <MatchForm />

      <MatchHistory />

    </div>
  );
}