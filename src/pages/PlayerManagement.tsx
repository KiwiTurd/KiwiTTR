import { useEffect, useState } from "react";

import type { Player } from "../types/player";
import type { Club } from "../types/club";

import {
  addPlayer,
  getPlayers,
} from "../services/supabase/playerService";

import {
  getClubs,
} from "../services/supabase/clubService";

import useRole from "../hooks/useRole";
import { notify } from "../services/notificationService";

export default function PlayerManagement() {
  const {
    isAdmin,
    isClubLeader,
    clubId: userClubId,
  } = useRole();

  const [players, setPlayers] = useState<Player[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [clubId, setClubId] = useState("");
  const [initialRatingMode, setInitialRatingMode] = useState<
  "1200" | "1500" | "club_average" | "custom"
>("club_average");

const [customRating, setCustomRating] = useState(1500);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadData();
  }, [isAdmin, userClubId]);

  async function loadData() {
    try {
      setLoading(true);

      const [playerData, clubData] = await Promise.all([
        getPlayers(),
        getClubs(),
      ]);

      if (isAdmin) {
        setPlayers(playerData);
        setClubs(clubData);
      } else if (isClubLeader && userClubId) {
        setPlayers(
          playerData.filter(
            (player) => player.clubId === userClubId
          )
        );

        setClubs(
          clubData.filter(
            (club) => club.id === userClubId
          )
        );

        setClubId(userClubId);
      }

    } catch (error) {
      console.error(error);
      notify.fault("Failed to load players.");
    } finally {
      setLoading(false);
    }
  }
const clubAverage = (() => {
  const selectedClubId = isAdmin
    ? clubId
    : userClubId;

  if (!selectedClubId) {
    return 1500;
  }

  const clubPlayers = players.filter(
    (player) =>
      player.clubId === selectedClubId &&
      player.isActive
  );

  if (clubPlayers.length === 0) {
    return 1500;
  }

  return Math.round(
    clubPlayers.reduce(
      (sum, player) => sum + player.rating,
      0
    ) / clubPlayers.length
  );
})();
  async function handleAddPlayer() {
    const assignedClubId = isAdmin
      ? clubId
      : userClubId;

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !assignedClubId
    ) {
      notify.timeout("Please complete all fields.");
      return;
    }

    setSaving(true);

    try {
      let startingRating = 1500;

switch (initialRatingMode) {
  case "1200":
    startingRating = 1200;
    break;

  case "1500":
    startingRating = 1500;
    break;

  case "club_average":
    startingRating = clubAverage;
    break;

  case "custom":
    startingRating = customRating;
    break;
}

      const newPlayer: Player = {
  id: crypto.randomUUID(),

  profileId: null,

  firstName,
  lastName,

  clubId,

  rating: 1000,
  highestRating: 1000,

  wins: 0,
  losses: 0,

  matchesPlayed: 0,

  provisionalMatchesRemaining: 20,

  ratingReliability: 0,

  isActive: true,

  createdAt: new Date().toISOString(),
};

      await addPlayer(newPlayer);

      await loadData();

      notify.playerAdded(`${newPlayer.firstName} ${newPlayer.lastName}`);

      setFirstName("");
      setLastName("");
      setInitialRatingMode("club_average");
setCustomRating(1500);

      if (isAdmin) {
        setClubId("");
      }

    } catch (error) {
      console.error(error);
      notify.fault("Failed to add player.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto">

      <h1 className="text-4xl font-bold mb-8">
        Player Management
      </h1>

      <div className="bg-white rounded-xl shadow p-6 mb-8">

        <div
          className={`grid gap-4 ${
            isAdmin
              ? "grid-cols-3"
              : "grid-cols-2"
          }`}
        >

          <input
            placeholder="First Name"
            value={firstName}
            onChange={(e) =>
              setFirstName(e.target.value)
            }
            className="border rounded-lg p-3"
          />

          <input
            placeholder="Last Name"
            value={lastName}
            onChange={(e) =>
              setLastName(e.target.value)
            }
            className="border rounded-lg p-3"
          />

          {isAdmin && (
            <select
              value={clubId}
              onChange={(e) =>
                setClubId(e.target.value)
              }
              className="border rounded-lg p-3"
            >
              <option value="">
                Select Club
              </option>

              {clubs.map((club) => (
                <option
                  key={club.id}
                  value={club.id}
                >
                  {club.name}
                </option>
              ))}
            </select>
          )}

        </div>

        <div className="mt-6 border-t pt-6">

  <h2 className="text-lg font-semibold mb-4">
    Initial Rating
  </h2>

  <div className="space-y-3">

    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="radio"
        name="initialRating"
        checked={initialRatingMode === "1200"}
        onChange={() =>
          setInitialRatingMode("1200")
        }
      />
      <span>1200</span>
    </label>

    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="radio"
        name="initialRating"
        checked={initialRatingMode === "1500"}
        onChange={() =>
          setInitialRatingMode("1500")
        }
      />
      <span>1500</span>
    </label>

    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="radio"
        name="initialRating"
        checked={initialRatingMode === "club_average"}
        onChange={() =>
          setInitialRatingMode("club_average")
        }
      />
      <span>
        Club Average ({clubAverage})
      </span>
    </label>

    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="radio"
        name="initialRating"
        checked={initialRatingMode === "custom"}
        onChange={() =>
          setInitialRatingMode("custom")
        }
      />
      <span>Custom</span>
    </label>

    {initialRatingMode === "custom" && (
      <input
        type="number"
        min={0}
        value={customRating}
        onChange={(e) =>
          setCustomRating(Number(e.target.value))
        }
        className="border rounded-lg p-3 w-48 ml-7"
      />
    )}

  </div>

  <div className="mt-5 bg-slate-100 rounded-lg p-4">

    <p className="text-sm text-slate-500">
      Starting Rating
    </p>

    <p className="text-3xl font-bold">

      {initialRatingMode === "1200" && 1200}

      {initialRatingMode === "1500" && 1500}

      {initialRatingMode === "club_average" &&
        clubAverage}

      {initialRatingMode === "custom" &&
        customRating}

    </p>

  </div>

  <button
    onClick={handleAddPlayer}
    disabled={saving}
    className="mt-6 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-400 text-white px-6 py-3 rounded-lg transition"
  >
    {saving ? "Adding..." : "Add Player"}
  </button>

</div>

      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">

        <table className="w-full">

          <thead className="bg-slate-100">

            <tr>

              <th className="text-left p-4">
                Player
              </th>

              <th className="text-left">
                Club
              </th>

              <th className="text-left">
                Rating
              </th>

              <th className="text-left">
                Highest
              </th>

              <th className="text-left">
                W
              </th>

              <th className="text-left">
                L
              </th>

              <th className="text-left">
                Status
              </th>

            </tr>

          </thead>

          <tbody>

            {loading ? (

              <tr>

                <td
                  colSpan={7}
                  className="text-center py-10 text-slate-500"
                >
                  Loading players...
                </td>

              </tr>

            ) : players.length === 0 ? (

              <tr>

                <td
                  colSpan={7}
                  className="text-center py-10 text-slate-500"
                >
                  No players yet.
                </td>

              </tr>

            ) : (

              players.map((player) => {

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

              })

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}