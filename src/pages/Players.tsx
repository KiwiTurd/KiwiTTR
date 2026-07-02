import { useEffect, useState } from "react";
import type { Player } from "../types/player";
import type { Club } from "../types/club";

import {
  addPlayer,
  getPlayers,
} from "../services/playerService";

import { getClubs } from "../services/clubService";

export default function Players() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [clubId, setClubId] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    setPlayers(getPlayers());
    setClubs(getClubs());
  }

  function handleAddPlayer() {
    if (!firstName.trim() || !lastName.trim() || !clubId) {
      alert("Please complete all fields.");
      return;
    }

    const startingRating = 1500;

    const newPlayer: Player = {
      id: crypto.randomUUID(),

      firstName: firstName.trim(),
      lastName: lastName.trim(),

      clubId,

      rating: startingRating,
      highestRating: startingRating,

      wins: 0,
      losses: 0,
      matchesPlayed: 0,

      provisionalMatchesRemaining: 10,
      ratingReliability: 0,

      isActive: true,

      createdAt: new Date().toISOString(),
    };

    addPlayer(newPlayer);

    loadData();

    setFirstName("");
    setLastName("");
    setClubId("");
  }

  return (
    <div className="max-w-6xl mx-auto">

      <h1 className="text-4xl font-bold mb-8">
        Players
      </h1>

      <div className="bg-white rounded-xl shadow p-6 mb-8">

        <div className="grid grid-cols-3 gap-4">

          <input
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="border rounded-lg p-3"
          />

          <input
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="border rounded-lg p-3"
          />

          <select
            value={clubId}
            onChange={(e) => setClubId(e.target.value)}
            className="border rounded-lg p-3"
          >
            <option value="">Select Club</option>

            {clubs.map((club) => (
              <option
                key={club.id}
                value={club.id}
              >
                {club.name}
              </option>
            ))}

          </select>

        </div>

        <button
          onClick={handleAddPlayer}
          className="mt-4 bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-lg transition"
        >
          Add Player
        </button>

      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">

        <table className="w-full">

          <thead className="bg-slate-100">

            <tr>
              <th className="text-left p-4">Player</th>
              <th className="text-left">Club</th>
              <th className="text-left">Rating</th>
              <th className="text-left">Highest</th>
              <th className="text-left">W</th>
              <th className="text-left">L</th>
              <th className="text-left">Status</th>
            </tr>

          </thead>

          <tbody>

            {players.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-10 text-slate-500"
                >
                  No players yet.
                </td>
              </tr>
            )}

            {players.map((player) => {

              const club = clubs.find(
                (c) => c.id === player.clubId
              );

              return (
                <tr
                  key={player.id}
                  className="border-t hover:bg-slate-50"
                >

                  <td className="p-4 font-medium">
                    {player.firstName} {player.lastName}
                  </td>

                  <td>
                    {club?.name ?? "-"}
                  </td>

                  <td>
                    {player.rating}
                  </td>

                  <td>
                    {player.highestRating}
                  </td>

                  <td>
                    {player.wins}
                  </td>

                  <td>
                    {player.losses}
                  </td>

                  <td>
                    {player.isActive ? (
                      <span className="text-green-600 font-medium">
                        Active
                      </span>
                    ) : (
                      <span className="text-red-600 font-medium">
                        Inactive
                      </span>
                    )}
                  </td>

                </tr>
              );

            })}

          </tbody>

        </table>

      </div>

    </div>
  );
}