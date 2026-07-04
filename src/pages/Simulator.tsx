import { useState } from "react";
import { calculateMatch } from "../services/ttrEngine";
import type { Player } from "../types/player";

export default function Simulator() {
  const [winnerRating, setWinnerRating] = useState(1500);
  const [loserRating, setLoserRating] = useState(1500);

  const [winnerMatches, setWinnerMatches] = useState(10);
  const [loserMatches, setLoserMatches] = useState(10);

  const [winnerNewRating, setWinnerNewRating] = useState<number | null>(null);
  const [loserNewRating, setLoserNewRating] = useState<number | null>(null);

  const [winnerChange, setWinnerChange] = useState<number | null>(null);
  const [loserChange, setLoserChange] = useState<number | null>(null);

  function handleCalculate() {
    const winner: Player = {
      id: "winner",

      profileId: null,

      firstName: "Winner",
      lastName: "Player",

      clubId: "",

      rating: winnerRating,
      highestRating: winnerRating,

      wins: 0,
      losses: 0,

      matchesPlayed: 0,

      provisionalMatchesRemaining: winnerMatches,

      ratingReliability: 0,

      isActive: true,

      createdAt: new Date().toISOString(),
    };

    const loser: Player = {
      id: "loser",

      profileId: null,

      firstName: "Loser",
      lastName: "Player",

      clubId: "",

      rating: loserRating,
      highestRating: loserRating,

      wins: 0,
      losses: 0,

      matchesPlayed: 0,

      provisionalMatchesRemaining: loserMatches,

      ratingReliability: 0,

      isActive: true,

      createdAt: new Date().toISOString(),
    };

    const result = calculateMatch(winner, loser);

    setWinnerNewRating(result.winner.rating);
    setLoserNewRating(result.loser.rating);

    setWinnerChange(result.winnerChange);
    setLoserChange(result.loserChange);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">
        🧮 Rating Simulator
      </h1>

      <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">

        <div>
          <label className="block mb-2 font-medium">
            Winner Rating
          </label>

          <input
            type="number"
            value={winnerRating}
            onChange={(e) =>
              setWinnerRating(Number(e.target.value))
            }
            className="w-full border rounded-lg p-3"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Winner Provisional Matches Remaining
          </label>

          <input
            type="number"
            value={winnerMatches}
            onChange={(e) =>
              setWinnerMatches(Number(e.target.value))
            }
            className="w-full border rounded-lg p-3"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Loser Rating
          </label>

          <input
            type="number"
            value={loserRating}
            onChange={(e) =>
              setLoserRating(Number(e.target.value))
            }
            className="w-full border rounded-lg p-3"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Loser Provisional Matches Remaining
          </label>

          <input
            type="number"
            value={loserMatches}
            onChange={(e) =>
              setLoserMatches(Number(e.target.value))
            }
            className="w-full border rounded-lg p-3"
          />
        </div>

        <button
          onClick={handleCalculate}
          className="w-full bg-blue-900 hover:bg-blue-800 text-white py-3 rounded-lg font-semibold transition"
        >
          Calculate Rating Change
        </button>

        {winnerNewRating !== null &&
          loserNewRating !== null && (
            <div className="border-t pt-6 space-y-4">

              <h2 className="text-2xl font-bold">
                Result
              </h2>

              <div className="flex justify-between">
                <span>Winner</span>

                <strong>
                  {winnerNewRating} (
                  {winnerChange! >= 0 ? "+" : ""}
                  {winnerChange})
                </strong>
              </div>

              <div className="flex justify-between">
                <span>Loser</span>

                <strong>
                  {loserNewRating} ({loserChange})
                </strong>
              </div>

            </div>
          )}

      </div>
    </div>
  );
}