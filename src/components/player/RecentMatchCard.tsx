import { useState } from "react";

import type { Match } from "../../types/match";
import type { Player } from "../../types/player";
import type { Event } from "../../types/event";

interface Props {
  match: Match;
  player: Player;
  opponent: Player | undefined;
  event: Event | undefined;
}

export default function RecentMatchCard({
  match,
  player,
  opponent,
  event,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const won = match.winnerId === player.id;

  const ratingBefore = won
    ? match.winnerRatingBefore
    : match.loserRatingBefore;

  const ratingAfter = won
    ? match.winnerRatingAfter
    : match.loserRatingAfter;

  const ratingChange = won
    ? match.winnerRatingChange
    : match.loserRatingChange;

  return (
    <div className="border rounded-xl overflow-hidden">

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex justify-between items-center p-5 hover:bg-slate-50 transition"
      >

        <div className="text-left">

          <p className="font-semibold">

            {expanded ? "▼" : "▶"}{" "}

            {won ? "🟢 Victory" : "🔴 Defeat"}

          </p>

          <p className="text-slate-500 text-sm">

            vs {opponent
              ? `${opponent.firstName} ${opponent.lastName}`
              : "Unknown"}

          </p>

        </div>

        <div className="text-right">

          <p
            className={`font-bold ${
              ratingChange >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {ratingChange > 0 ? "+" : ""}
            {ratingChange}
          </p>

          <p className="text-xs text-slate-500">
            {new Date(match.playedAt).toLocaleDateString()}
          </p>

        </div>

      </button>

      {expanded && (

        <div className="border-t bg-slate-50 p-5 space-y-5">

          <div>

            <h3 className="font-semibold mb-2">
              Event
            </h3>

            <p>
              {event?.name ?? "Unknown Event"}
            </p>

          </div>

          <div>

            <h3 className="font-semibold mb-2">
              Rating
            </h3>

            <p>

              {ratingBefore}

              {" → "}

              {ratingAfter}

              {" ("}

              {ratingChange > 0 ? "+" : ""}

              {ratingChange}

              )

            </p>

          </div>

          <div>

            <h3 className="font-semibold mb-3">
              Set Scores
            </h3>

            <div className="space-y-2">

              {match.sets.map((set, index) => (

                <div
                  key={index}
                  className="flex justify-between border rounded-lg bg-white px-4 py-2"
                >

                  <span>

                    Set {index + 1}

                  </span>

                  <strong>

                    {set.player1Score}

                    {" - "}

                    {set.player2Score}

                  </strong>

                </div>

              ))}

            </div>

          </div>

        </div>

      )}

    </div>
  );
}