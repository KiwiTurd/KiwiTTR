import { useEffect, useMemo, useState } from "react";

import type { Event } from "../../types/event";
import type { MatchSet } from "../../types/match";
import type { Player } from "../../types/player";

import { getEvents } from "../../services/eventService";
import { getPlayers } from "../../services/playerService";
import { recordMatch } from "../../services/matchService";

import SetScoreInput from "./SetScoreInput";

export default function MatchForm() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  const [eventId, setEventId] = useState("");

  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");

  const [sets, setSets] = useState<MatchSet[]>([
    {
      player1Score: 11,
      player2Score: 8,
    },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    setPlayers(getPlayers());
    setEvents(getEvents());
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

  const summary = useMemo(() => {
    let player1Sets = 0;
    let player2Sets = 0;

    sets.forEach((set) => {
      const max = Math.max(set.player1Score, set.player2Score);
      const min = Math.min(set.player1Score, set.player2Score);

      // Ignore incomplete sets
      if (max < 11) return;

      // Must win by 2
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

  function handleRecordMatch() {
    if (!eventId) {
      alert("Please select an event.");
      return;
    }

    if (!player1Id || !player2Id) {
      alert("Please select both players.");
      return;
    }

    if (player1Id === player2Id) {
      alert("A player cannot play themselves.");
      return;
    }

    if (summary.player1Sets === summary.player2Sets) {
      alert("The match is tied.");
      return;
    }

    try {
      recordMatch(
        eventId,
        player1Id,
        player2Id,
        sets
      );

      alert("Match recorded successfully!");

      setEventId("");
      setPlayer1Id("");
      setPlayer2Id("");

      setSets([
        {
          player1Score: 11,
          player2Score: 8,
        },
      ]);

      loadData();

    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Unable to record match.");
      }
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-8 space-y-6">

      <div>
        <label className="block font-semibold mb-2">
          Event
        </label>

        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="border rounded-lg p-3 w-full"
        >
          <option value="">Select Event</option>

          {events.map((event) => (
            <option
              key={event.id}
              value={event.id}
            >
              {event.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-semibold mb-2">
          Player 1
        </label>

        <select
          value={player1Id}
          onChange={(e) => setPlayer1Id(e.target.value)}
          className="border rounded-lg p-3 w-full"
        >
          <option value="">Select Player</option>

          {players.map((player) => (
            <option
              key={player.id}
              value={player.id}
            >
              {player.firstName} {player.lastName} ({player.rating})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-semibold mb-2">
          Player 2
        </label>

        <select
          value={player2Id}
          onChange={(e) => setPlayer2Id(e.target.value)}
          className="border rounded-lg p-3 w-full"
        >
          <option value="">Select Player</option>

          {players.map((player) => (
            <option
              key={player.id}
              value={player.id}
            >
              {player.firstName} {player.lastName} ({player.rating})
            </option>
          ))}
        </select>
      </div>

      <hr />

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
        />
      ))}

      <button
        onClick={addSet}
        className="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-lg transition"
      >
        + Add Set
      </button>

      <div className="bg-slate-100 rounded-lg p-5">

        <h2 className="text-xl font-bold mb-3">
          Live Match Summary
        </h2>

        <div className="space-y-2">

          <p>
            Score:{" "}
            <strong>
              {summary.player1Sets} - {summary.player2Sets}
            </strong>
          </p>

          <p>
            Winner:{" "}
            <strong>
              {summary.winner || "-"}
            </strong>
          </p>

        </div>

      </div>

      <button
        onClick={handleRecordMatch}
        className="w-full bg-blue-900 hover:bg-blue-800 text-white py-3 rounded-lg transition"
      >
        Record Match
      </button>

    </div>
  );
}