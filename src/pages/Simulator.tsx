import { useEffect, useState } from "react";

import {
  Calculator,
  Trophy,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import PlayerSelector from "../components/shared/PlayerSelector";

import {
  calculateMatch,
  type MatchResult,
} from "../services/ttrEngine";

import type {
  PlayerSearchResult,
} from "../services/supabase/playerService";

export default function Simulator() {

  const [winner, setWinner] =
    useState<PlayerSearchResult | null>(
      null
    );

  const [loser, setLoser] =
    useState<PlayerSearchResult | null>(
      null
    );

  const [result, setResult] =
    useState<MatchResult | null>(
      null
    );

  useEffect(() => {

    if (
      !winner ||
      !loser
    ) {

      setResult(null);

      return;

    }

    setResult(
      calculateMatch(
        winner,
        loser
      )
    );

  }, [
    winner,
    loser,
  ]);
    return (

    <div className="max-w-5xl mx-auto space-y-8">

      {/* Header */}

      <div>

        <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">

          <Calculator className="h-4 w-4" />

          Tools

        </div>

        <h1 className="mt-4 text-5xl font-normal tracking-tight text-slate-900">

          TTR Calculator

        </h1>

        <p className="mt-3 text-lg text-slate-500 max-w-2xl">

          Predict rating changes before recording a match. Simply select the
          winner and loser to see the expected TTR movement.

        </p>

      </div>

      {/* Player Selection */}

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Winner */}

        <div className="rounded-3xl border border-green-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3 mb-5">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100">

              <Trophy className="h-6 w-6 text-green-700" />

            </div>

            <div>

              <h2 className="text-xl font-bold">

                Winner

              </h2>

              <p className="text-sm text-slate-500">

                Select the winning player

              </p>

            </div>

          </div>

          <PlayerSelector
            value={winner}
            onChange={setWinner}
            excludePlayerId={loser?.id}
          />

          {winner && (

            <div className="mt-6 rounded-2xl bg-slate-50 p-4">

              <div className="grid grid-cols-2 gap-4">

                <div>

                  <p className="text-xs uppercase tracking-wide text-slate-500">

                    Current Rating

                  </p>

                  <p className="mt-1 text-3xl font-bold">

                    {winner.rating}

                  </p>

                </div>

                <div>

                  <p className="text-xs uppercase tracking-wide text-slate-500">

                    Highest Rating

                  </p>

                  <p className="mt-1 text-3xl font-bold">

                    {winner.highestRating}

                  </p>

                </div>

              </div>

            </div>

          )}

        </div>

        {/* Loser */}

        <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3 mb-5">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100">

              <TrendingDown className="h-6 w-6 text-red-700" />

            </div>

            <div>

              <h2 className="text-xl font-bold">

                Loser

              </h2>

              <p className="text-sm text-slate-500">

                Select the losing player

              </p>

            </div>

          </div>

          <PlayerSelector
            value={loser}
            onChange={setLoser}
            excludePlayerId={winner?.id}
          />

          {loser && (

            <div className="mt-6 rounded-2xl bg-slate-50 p-4">

              <div className="grid grid-cols-2 gap-4">

                <div>

                  <p className="text-xs uppercase tracking-wide text-slate-500">

                    Current Rating

                  </p>

                  <p className="mt-1 text-3xl font-bold">

                    {loser.rating}

                  </p>

                </div>

                <div>

                  <p className="text-xs uppercase tracking-wide text-slate-500">

                    Highest Rating

                  </p>

                  <p className="mt-1 text-3xl font-bold">

                    {loser.highestRating}

                  </p>

                </div>

              </div>

            </div>

          )}

        </div>

      </div>
            {/* Results */}

      {result && (

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">

          <div className="flex items-center gap-3 mb-8">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100">

              <TrendingUp className="h-6 w-6 text-blue-700" />

            </div>

            <div>

              <h2 className="text-2xl font-bold">

                Predicted Rating Changes

              </h2>

              <p className="text-slate-500">

                Based on the current KiwiTTR algorithm.

              </p>

            </div>

          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            {/* Winner */}

            <div className="rounded-2xl border border-green-200 bg-green-50 p-6">

              <p className="text-lg font-bold text-green-800">

                Winner

              </p>

              <p className="mt-1 text-slate-500">

                {winner?.firstName} {winner?.lastName}

              </p>

              <div className="my-6 flex items-center justify-center gap-6">

                <div className="text-center">

                  <p className="text-xs uppercase text-slate-500">

                    Current

                  </p>

                  <p className="text-4xl font-black">

                    {winner?.rating}

                  </p>

                </div>

                <div className="text-3xl text-slate-400">

                  →

                </div>

                <div className="text-center">

                  <p className="text-xs uppercase text-slate-500">

                    New

                  </p>

                  <p className="text-4xl font-black text-green-700">

                    {result.winner.rating}

                  </p>

                </div>

              </div>

              <div className="flex justify-center">

                <span className="rounded-full bg-green-600 px-4 py-2 text-lg font-bold text-white">

                  +{result.winnerChange}

                </span>

              </div>

              {result.winner.rating >
                winner!.highestRating && (

                <div className="mt-5 rounded-xl bg-yellow-100 p-3 text-center text-sm font-semibold text-yellow-800">

                  🎉 New Highest Rating

                </div>

              )}

            </div>

            {/* Loser */}

            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">

              <p className="text-lg font-bold text-red-800">

                Loser

              </p>

              <p className="mt-1 text-slate-500">

                {loser?.firstName} {loser?.lastName}

              </p>

              <div className="my-6 flex items-center justify-center gap-6">

                <div className="text-center">

                  <p className="text-xs uppercase text-slate-500">

                    Current

                  </p>

                  <p className="text-4xl font-black">

                    {loser?.rating}

                  </p>

                </div>

                <div className="text-3xl text-slate-400">

                  →

                </div>

                <div className="text-center">

                  <p className="text-xs uppercase text-slate-500">

                    New

                  </p>

                  <p className="text-4xl font-black text-red-700">

                    {result.loser.rating}

                  </p>

                </div>

              </div>

              <div className="flex justify-center">

                <span className="rounded-full bg-red-600 px-4 py-2 text-lg font-bold text-white">

                  {result.loserChange}

                </span>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}
