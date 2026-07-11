import { useEffect, useMemo, useState } from "react";

import {
  ClipboardPen,
  Plus,
} from "lucide-react";

import type { Event } from "../../types/event";
import type { MatchSet } from "../../types/match";
import type { Player } from "../../types/player";

import { getEvents } from "../../services/supabase/eventService";
import { getPlayers } from "../../services/supabase/playerService";
import { recordMatch } from "../../services/recordMatch";
import { notify } from "../../services/notificationService";

import SetScoreInput from "./SetScoreInput";
import useFormDraftState from "../../hooks/useFormDraftState";

const MIN_SETS_TO_WIN = 2;

export default function MatchForm() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  const [eventId, setEventId] = useFormDraftState("matches.new.eventId", "");
  const [player1Id, setPlayer1Id] = useFormDraftState("matches.new.player1Id", "");
  const [player2Id, setPlayer2Id] = useFormDraftState("matches.new.player2Id", "");

  const [sets, setSets] = useFormDraftState<MatchSet[]>("matches.new.sets", [
    {
      player1Score: 0,
      player2Score: 0,
    },
  ]);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      const [playerData, eventData] = await Promise.all([
        getPlayers(),
        getEvents(),
      ]);

      setPlayers(playerData);
      setEvents(eventData);
    } catch (error) {
      console.error(error);
      notify.fault("Unable to load match data.");
    }
  }

  function updateSet(
    index: number,
    player1Score: number,
    player2Score: number
  ) {
    const updated = [...sets];

    updated[index] = {
      player1Score,
      player2Score,
    };

    setSets(updated);
  }

  function addSet() {
    setSets([
      ...sets,
      {
        player1Score: 0,
        player2Score: 0,
      },
    ]);
  }

  function removeSet(index: number) {
    if (sets.length === 1) {
      return;
    }

    setSets(
      sets.filter((_, setIndex) => setIndex !== index)
    );
  }

  const summary = useMemo(() => {
    let player1Sets = 0;
    let player2Sets = 0;

    sets.forEach((set) => {
      const max = Math.max(set.player1Score, set.player2Score);
      const min = Math.min(set.player1Score, set.player2Score);

      if (max < 11) return;
      if (max - min < 2) return;

      if (set.player1Score > set.player2Score) {
        player1Sets++;
      } else {
        player2Sets++;
      }
    });

    const player1 = players.find((p) => p.id === player1Id);
    const player2 = players.find((p) => p.id === player2Id);

    let winner = "";

    if (player1Sets > player2Sets && player1) {
      winner = `${player1.firstName} ${player1.lastName}`;
    }

    if (player2Sets > player1Sets && player2) {
      winner = `${player2.firstName} ${player2.lastName}`;
    }

    return {
      player1Sets,
      player2Sets,
      winner,
    };
  }, [sets, player1Id, player2Id, players]);

  const hasMinimumSetsWon =
    Math.max(
      summary.player1Sets,
      summary.player2Sets
    ) >= MIN_SETS_TO_WIN;

  const canRecordMatch =
    Boolean(eventId) &&
    Boolean(player1Id) &&
    Boolean(player2Id) &&
    player1Id !== player2Id &&
    summary.player1Sets !== summary.player2Sets &&
    hasMinimumSetsWon;

  async function handleRecordMatch() {
    if (!eventId) {
      notify.timeout("Please select an event.");
      return;
    }

    if (!player1Id || !player2Id) {
      notify.timeout("Please select both players.");
      return;
    }

    if (player1Id === player2Id) {
      notify.fault("A player cannot play themselves.");
      return;
    }

    if (summary.player1Sets === summary.player2Sets) {
      notify.timeout("The match is tied.");
      return;
    }

    if (!hasMinimumSetsWon) {
      notify.timeout(
        `A player must win at least ${MIN_SETS_TO_WIN} sets before the match can be recorded.`
      );
      return;
    }

    const confirmed = window.confirm(
      `Record this match?\n\n${summary.winner} will win ${summary.player1Sets}-${summary.player2Sets}.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await recordMatch(
        eventId,
        player1Id,
        player2Id,
        sets
      );

      notify.matchRecorded(
        summary.winner,
        `${summary.player1Sets}-${summary.player2Sets}`
      );

      setEventId("");
      setPlayer1Id("");
      setPlayer2Id("");

      setSets([
        {
          player1Score: 0,
          player2Score: 0,
        },
      ]);

      await loadData();

    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        notify.fault(error.message);
      } else {
        notify.fault("Unable to record match.");
      }
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      <div className="flex items-center gap-3 border-b px-8 py-5">

        <ClipboardPen className="h-6 w-6 text-blue-700" />

        <h2 className="text-2xl font-bold">
          Record Match
        </h2>

      </div>

      <div className="space-y-6 p-8">

        <div className="grid gap-4 lg:grid-cols-3">

          <div>
            <label className="mb-2 block font-semibold">
              Event
            </label>

            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">Select Event</option>

              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-semibold">
              Player 1
            </label>

            <select
              value={player1Id}
              onChange={(e) => setPlayer1Id(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">Select Player</option>

              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.firstName} {player.lastName} ({player.rating})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-semibold">
              Player 2
            </label>

            <select
              value={player2Id}
              onChange={(e) => setPlayer2Id(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">Select Player</option>

              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.firstName} {player.lastName} ({player.rating})
                </option>
              ))}
            </select>
          </div>

        </div>

        <div className="border-t pt-6">

          <div className="mb-3 grid grid-cols-[minmax(72px,1fr)_96px_96px_44px] gap-3 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <span>Set</span>
            <span className="text-center">P1</span>
            <span className="text-center">P2</span>
            <span />
          </div>

          <div className="space-y-3">
            {sets.map((set, index) => (
              <SetScoreInput
                key={index}
                index={index}
                player1Score={set.player1Score}
                player2Score={set.player2Score}
                onPlayer1Change={(value) =>
                  updateSet(index, value, set.player2Score)
                }
                onPlayer2Change={(value) =>
                  updateSet(index, set.player1Score, value)
                }
                onRemove={() => removeSet(index)}
                canRemove={sets.length > 1}
              />
            ))}
          </div>

          <button
            onClick={addSet}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 font-medium text-slate-900 transition hover:bg-slate-200"
          >
            <Plus className="h-4 w-4" />
            Add Set
          </button>

        </div>

        <div className="grid gap-4 rounded-xl bg-slate-100 p-5 md:grid-cols-3 md:items-center">

          <div>
            <h3 className="text-lg font-bold">
              Live Match Summary
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Review the score before recording.
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Score
            </p>
            <p className="text-2xl font-black">
              {summary.player1Sets} - {summary.player2Sets}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Winner
            </p>
            <p className="truncate text-xl font-bold">
              {summary.winner || "-"}
            </p>
          </div>

        </div>

        {!hasMinimumSetsWon && (
          <p className="text-sm font-medium text-slate-500">
            A player must win at least {MIN_SETS_TO_WIN} sets before this match can be recorded.
          </p>
        )}

        <button
          onClick={handleRecordMatch}
          disabled={!canRecordMatch}
          className="
            w-full
            rounded-xl
            bg-blue-900
            py-3
            font-semibold
            text-white
            transition

            hover:bg-blue-800

            disabled:cursor-not-allowed
            disabled:bg-slate-400
            disabled:hover:bg-slate-400
          "
        >
          Record Match
        </button>

      </div>

    </div>
  );
}
