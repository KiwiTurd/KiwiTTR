import type { Match } from "../../types/match";
import type { Player } from "../../types/player";

interface Props {
  match: Match;
  winner: Player | undefined;
  loser: Player | undefined;
}

export default function EventMatchCard({
  match,
  winner,
  loser,
}: Props) {
  return (
    <div className="border rounded-xl p-5 hover:bg-slate-50 transition">

      <div className="flex justify-between items-center">

        <div>

          <p className="font-bold text-lg">
            🏓 {winner?.firstName} {winner?.lastName}
          </p>

          <p className="text-slate-500">
            defeated {loser?.firstName} {loser?.lastName}
          </p>

        </div>

        <div className="text-right">

          <p className="font-bold text-green-600">
            +{match.winnerRatingChange}
          </p>

          <p className="text-red-600">
            {match.loserRatingChange}
          </p>

        </div>

      </div>

      <div className="mt-5 flex flex-wrap gap-2">

        {match.sets.map((set, index) => (

          <span
            key={index}
            className="bg-slate-100 px-3 py-1 rounded-full text-sm"
          >
            {set.player1Score}-{set.player2Score}
          </span>

        ))}

      </div>

    </div>
  );
}