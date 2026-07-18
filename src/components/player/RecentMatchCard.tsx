import { useState } from "react";
import { Link } from "react-router-dom";

import type { Match } from "../../types/match";
import type { Player } from "../../types/player";
import type { Event } from "../../types/event";

interface Props {
  match: Match;
  player: Player;
  opponent: Player | undefined;
  event: Event | undefined;
  eventHref?: string;
}

export default function RecentMatchCard({
  match,
  player,
  opponent,
  event,
  eventHref,
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

  const opponentRatingBefore = won
    ? match.loserRatingBefore
    : match.winnerRatingBefore;

  return (
    <div className="overflow-hidden rounded-lg border">

      <div className="flex w-full items-center justify-between gap-3 px-4 py-3 transition hover:bg-slate-50">

        <div className="min-w-0 text-left">

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className={`text-sm font-semibold ${
              won ? "text-green-700" : "text-red-700"
            }`}
          >

            <span className="text-slate-400">
              {expanded ? "▼" : "▶"}
            </span>{" "}

            {won ? "Victory" : "Defeat"}

          </button>

          <p className="truncate text-xs text-slate-500">

            vs{" "}
            {opponent ? (
              <Link
                to={`/players/${opponent.id}`}
                className="font-semibold text-blue-700 underline-offset-2 hover:underline"
              >
                {opponent.firstName} {opponent.lastName}
              </Link>
            ) : (
              "Unknown"
            )}
            {" · "}
            {opponentRatingBefore} TTR

          </p>

        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 text-right"
          aria-label={expanded ? "Hide match details" : "Show match details"}
        >

          <p
            className={`text-sm font-bold ${
              ratingChange >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {ratingChange > 0 ? "+" : ""}
            {ratingChange}
          </p>

          <p className="text-xs text-slate-500">
            {new Date(match.playedAt)
              .toLocaleDateString()}
          </p>

        </button>

      </div>

      {expanded && (

        <div className="space-y-3 border-t bg-slate-50 px-4 py-3 text-sm">

          <div>

            <h3 className="mb-1 text-xs font-semibold uppercase text-slate-500">
              Event
            </h3>

            {eventHref ? (
              <Link
                to={eventHref}
                className="font-semibold text-blue-700 underline-offset-4 hover:underline"
              >
                {event?.name ?? "Unknown Event"}
              </Link>
            ) : (
              <p>
                {event?.name ?? "Unknown Event"}
              </p>
            )}

          </div>

          <div>

            <h3 className="mb-1 text-xs font-semibold uppercase text-slate-500">
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

            <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">
              Set Scores
            </h3>

            <div className="space-y-1.5">

              {match.sets.map((set, index) => (

                <div
                  key={index}
                  className="flex justify-between rounded-md border bg-white px-3 py-1.5"
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
