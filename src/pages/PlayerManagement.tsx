import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";

import {
  ArrowRight,
  Pencil,
  Plus,
  Users,
} from "lucide-react";

import type { Club } from "../types/club";
import type { Player } from "../types/player";

import {
  addPlayer,
  getPlayers,
  updatePlayer,
} from "../services/supabase/playerService";

import {
  getClubs,
} from "../services/supabase/clubService";

import useRole from "../hooks/useRole";
import useFormDraftState from "../hooks/useFormDraftState";
import { notify } from "../services/notificationService";
import LoadingScreen from "../components/shared/LoadingScreen";
import PlayerSelector from "../components/shared/PlayerSelector";

type InitialRatingMode =
  | "1200"
  | "1500"
  | "club_average"
  | "custom";

export default function PlayerManagement() {
  const {
    profileId,
    playerId: linkedPlayerId,
    isAdmin,
    isClubLeader,
    clubId: userClubId,
  } = useRole();

  const [players, setPlayers] =
    useState<Player[]>([]);

  const [clubs, setClubs] =
    useState<Club[]>([]);

  const [firstName, setFirstName] =
    useFormDraftState("players.new.firstName", "");

  const [lastName, setLastName] =
    useFormDraftState("players.new.lastName", "");

  const [clubId, setClubId] =
    useFormDraftState("players.new.clubId", "");

  const [initialRatingMode, setInitialRatingMode] =
    useFormDraftState<InitialRatingMode>("players.new.ratingMode", "club_average");

  const [customRating, setCustomRating] =
    useFormDraftState("players.new.customRating", 1500);

  const [clubFilter, setClubFilter] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [editingPlayer, setEditingPlayer] =
    useState<Player | null>(null);

  const [editFirstName, setEditFirstName] =
    useState("");

  const [editLastName, setEditLastName] =
    useState("");

  const [editMobile, setEditMobile] =
    useState("");

  const [editEmail, setEditEmail] =
    useState("");

  const [editClubId, setEditClubId] =
    useState("");

  const [editIsActive, setEditIsActive] =
    useState(true);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [creatorOpen, setCreatorOpen] =
    useState(false);

  const canCreatePlayer =
    isAdmin ||
    (isClubLeader && Boolean(userClubId));

  const canChooseInitialRating =
    isAdmin;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [playerData, clubData] =
        await Promise.all([
          getPlayers(),
          getClubs(),
        ]);

      setPlayers(playerData);

      if (isClubLeader && userClubId) {
        setClubs(
          clubData.filter(
            (club) => club.id === userClubId
          )
        );
        setClubId(userClubId);
        setClubFilter(userClubId);
      } else {
        setClubs(clubData);
      }
    } catch (error) {
      console.error(error);
      notify.fault("Failed to load players.");
    } finally {
      setLoading(false);
    }
  }, [
    isClubLeader,
    userClubId,
  ]);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadData();
      }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadData]);

  const visiblePlayers = useMemo(() => {
    if (isClubLeader && userClubId) {
      return players.filter(
        (player) => player.clubId === userClubId
      );
    }

    return players;
  }, [players, isClubLeader, userClubId]);

  const filteredPlayers = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return visiblePlayers.filter((player) => {
      const club = clubs.find(
        (item) => item.id === player.clubId
      );

      const matchesClub =
        !clubFilter ||
        player.clubId === clubFilter;

      const searchable = [
        player.firstName,
        player.lastName,
        club?.name,
        club?.shortName,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query ||
        searchable.includes(query);

      return matchesClub && matchesSearch;
    });
  }, [visiblePlayers, clubs, clubFilter, search]);

  const clubAverage = useMemo(() => {
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
  }, [players, clubId, isAdmin, userClubId]);

  function getClubName(playerClubId: string) {
    return (
      clubs.find((club) => club.id === playerClubId)
        ?.name ?? "-"
    );
  }

  function canEditPlayer(player: Player) {
    if (isAdmin) {
      return true;
    }

    if (
      isClubLeader &&
      userClubId &&
      player.clubId === userClubId
    ) {
      return true;
    }

    return (
      Boolean(profileId) &&
      (
        player.profileId === profileId ||
        player.id === linkedPlayerId
      )
    );
  }

  function openEdit(player: Player) {
    if (!canEditPlayer(player)) {
      notify.fault(
        "You can only edit players you are allowed to manage."
      );
      return;
    }

    setEditingPlayer(player);
    setEditFirstName(player.firstName);
    setEditLastName(player.lastName);
    setEditMobile(player.mobile);
    setEditEmail(player.email);
    setEditClubId(player.clubId);
    setEditIsActive(player.isActive);
  }

  function closeEdit() {
    setEditingPlayer(null);
    setEditFirstName("");
    setEditLastName("");
    setEditMobile("");
    setEditEmail("");
    setEditClubId("");
    setEditIsActive(true);
  }

  async function handleAddPlayer() {
    const assignedClubId = isAdmin
      ? clubId
      : userClubId;

    if (!canCreatePlayer) {
      notify.fault(
        "You do not have permission to add players."
      );
      return;
    }

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
      let startingRating = clubAverage;

      if (canChooseInitialRating) {
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
      }

      const newPlayer: Player = {
        id: crypto.randomUUID(),
        profileId: null,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        mobile: "",
        email: "",
        clubId: assignedClubId,
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

      await addPlayer(newPlayer);
      await loadData();

      notify.playerAdded(
        `${newPlayer.firstName} ${newPlayer.lastName}`
      );

      setFirstName("");
      setLastName("");
      setInitialRatingMode("club_average");
      setCustomRating(1500);

      if (isAdmin) {
        setClubId("");
      }

      setCreatorOpen(false);
    } catch (error) {
      console.error(error);
      notify.fault("Failed to add player.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePlayer() {
    if (!editingPlayer) {
      return;
    }

    if (!canEditPlayer(editingPlayer)) {
      notify.fault(
        "You can only edit players you are allowed to manage."
      );
      return;
    }

    if (
      !editFirstName.trim() ||
      !editLastName.trim()
    ) {
      notify.timeout(
        "First name and last name are required."
      );
      return;
    }

    const nextClubId = isAdmin
      ? editClubId
      : editingPlayer.clubId;

    if (!nextClubId) {
      notify.timeout("Club is required.");
      return;
    }

    setSaving(true);

    try {
      const updatedPlayer: Player = {
        ...editingPlayer,
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        mobile: editMobile.trim(),
        email: editEmail.trim(),
        clubId: nextClubId,
        isActive:
          isAdmin || isClubLeader
            ? editIsActive
            : editingPlayer.isActive,
      };

      await updatePlayer(updatedPlayer);
      await loadData();

      notify.playerUpdated(
        `${updatedPlayer.firstName} ${updatedPlayer.lastName}`
      );

      closeEdit();
    } catch (error) {
      console.error(error);
      notify.fault("Failed to update player.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingScreen label="Loading players..." />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">

      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-300 pb-6 md:items-end">

        <div className="players-page-header-copy">

        <h1 className="mt-2 text-5xl font-normal tracking-tight text-slate-900">
          Players
        </h1>

        <p className="mt-3 text-lg text-slate-500">
          Manage player details and open player profiles.
        </p>

        </div>

        {canCreatePlayer && (
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-slate-700"
            onClick={() => setCreatorOpen((current) => !current)}
            type="button"
          >
            <Plus className={`h-5 w-5 transition-transform duration-300 ${creatorOpen ? "rotate-45" : ""}`} />
            {creatorOpen ? "Close" : "Add Player"}
          </button>
        )}

      </div>

      {canCreatePlayer && (

        <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${creatorOpen ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0"}`}>

        <div className="overflow-hidden">

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center gap-3 border-b px-8 py-5">

            <Plus className="h-6 w-6 text-blue-700" />

            <h2 className="text-2xl font-bold">
              Add Player
            </h2>

          </div>

          <div className="p-8">

            <div
              className={`grid gap-4 ${
                isAdmin
                  ? "md:grid-cols-3"
                  : "md:grid-cols-2"
              }`}
            >

              <input
                placeholder="First Name"
                value={firstName}
                onChange={(e) =>
                  setFirstName(e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
              />

              <input
                placeholder="Last Name"
                value={lastName}
                onChange={(e) =>
                  setLastName(e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
              />

              {isAdmin && (
                <select
                  value={clubId}
                  onChange={(e) =>
                    setClubId(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
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

              <h3 className="text-lg font-semibold">
                Initial Rating
              </h3>

              {canChooseInitialRating ? (
                <>
                  <div className="mt-4 grid gap-3 md:grid-cols-4">

                    {[
                      ["1200", "1200"],
                      ["1500", "1500"],
                      [
                        "club_average",
                        `Club Average (${clubAverage})`,
                      ],
                      ["custom", "Custom"],
                    ].map(([value, label]) => (
                      <label
                        key={value}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 transition hover:bg-slate-50"
                      >
                        <input
                          type="radio"
                          name="initialRating"
                          checked={
                            initialRatingMode === value
                          }
                          onChange={() =>
                            setInitialRatingMode(
                              value as InitialRatingMode
                            )
                          }
                        />
                        <span>{label}</span>
                      </label>
                    ))}

                  </div>

                  {initialRatingMode === "custom" && (
                    <input
                      type="number"
                      min={0}
                      value={customRating}
                      onChange={(e) =>
                        setCustomRating(
                          Number(e.target.value)
                        )
                      }
                      className="mt-4 w-48 rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                    />
                  )}
                </>
              ) : (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">
                    Club admins add new players at the club average TTR.
                  </p>
                  <p className="mt-1 text-2xl font-bold">
                    {clubAverage}
                  </p>
                </div>
              )}

              <div className="mt-5 rounded-xl bg-slate-100 p-4">

                <p className="text-sm text-slate-500">
                  Starting Rating
                </p>

                <p className="text-3xl font-bold">
                  {canChooseInitialRating ? (
                    <>
                      {initialRatingMode === "1200" && 1200}
                      {initialRatingMode === "1500" && 1500}
                      {initialRatingMode === "club_average" &&
                        clubAverage}
                      {initialRatingMode === "custom" &&
                        customRating}
                    </>
                  ) : (
                    clubAverage
                  )}
                </p>

              </div>

              <button
                onClick={handleAddPlayer}
                disabled={saving}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-900 px-6 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                <Plus className="h-5 w-5" />
                {saving ? "Adding..." : "Add Player"}
              </button>

            </div>

          </div>

        </div>

        </div>

        </div>

      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="grid gap-4 md:grid-cols-[minmax(220px,280px)_1fr]">

          <select
            value={clubFilter}
            onChange={(e) =>
              setClubFilter(e.target.value)
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
          >
            {!isClubLeader && (
              <option value="">
                All Clubs
              </option>
            )}

            {clubs.map((club) => (
              <option
                key={club.id}
                value={club.id}
              >
                {club.name}
              </option>
            ))}
          </select>

          <PlayerSelector
            players={players
              .filter(
                (player) =>
                  !clubFilter || player.clubId === clubFilter
              )
              .map((player) => ({
                ...player,
                clubName:
                  clubs.find(
                    (club) => club.id === player.clubId
                  )?.name ?? "",
              }))}
            value={
              players.find(
                (player) =>
                  `${player.firstName} ${player.lastName}` === search
              ) ?? null
            }
            onChange={(player) =>
              setSearch(
                `${player.firstName} ${player.lastName}`
              )
            }
            onClear={() => setSearch("")}
            placeholder="Search players by name or club"
          />

        </div>

      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center gap-3 border-b px-6 py-5">

          <Users className="h-6 w-6 text-blue-700" />

          <h2 className="text-2xl font-bold">
            Player List
          </h2>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[860px]">

            <thead className="bg-slate-100">

              <tr>

                <th className="p-4 text-left">
                  Player
                </th>

                <th className="text-left">
                  Club
                </th>

                <th className="text-left">
                  TTR
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

                <th className="text-right pr-4">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan={8}
                    className="py-10 text-center text-slate-500"
                  >
                    Loading players...
                  </td>

                </tr>

              ) : filteredPlayers.length === 0 ? (

                <tr>

                  <td
                    colSpan={8}
                    className="py-10 text-center text-slate-500"
                  >
                    No players match your filters.
                  </td>

                </tr>

              ) : (

                filteredPlayers.map((player) => (

                  <tr
                    key={player.id}
                    className="border-t transition hover:bg-slate-50"
                  >

                    <td className="p-4">
                      <Link
                        to={`/players/${player.id}`}
                        className="group inline-flex items-center gap-2 font-semibold text-blue-700 hover:text-blue-900"
                      >
                        {player.firstName} {player.lastName}
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                      </Link>
                    </td>

                    <td>
                      {getClubName(player.clubId)}
                    </td>

                    <td className="font-semibold">
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
                        <span className="font-medium text-green-600">
                          Active
                        </span>
                      ) : (
                        <span className="font-medium text-red-600">
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="pr-4 text-right">
                      {canEditPlayer(player) && (
                        <button
                          type="button"
                          onClick={() => openEdit(player)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-900"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>
                      )}
                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

      {editingPlayer && (

        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4">

          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">

            <div className="border-b px-6 py-5">

              <h2 className="text-2xl font-bold">
                Edit Player
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                TTR is managed by match results and cannot be edited here.
              </p>

            </div>

            <div className="space-y-4 p-6">

              <input
                value={editFirstName}
                onChange={(e) =>
                  setEditFirstName(e.target.value)
                }
                placeholder="First Name"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
              />

              <input
                value={editLastName}
                onChange={(e) =>
                  setEditLastName(e.target.value)
                }
                placeholder="Last Name"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
              />

              <input
                value={editMobile}
                onChange={(e) =>
                  setEditMobile(e.target.value)
                }
                placeholder="Mobile"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
              />

              <input
                type="email"
                value={editEmail}
                onChange={(e) =>
                  setEditEmail(e.target.value)
                }
                placeholder="Email"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
              />

              {isAdmin ? (
                <select
                  value={editClubId}
                  onChange={(e) =>
                    setEditClubId(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
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
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">
                    Club
                  </p>
                  <p className="font-semibold">
                    {getClubName(editingPlayer.clubId)}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">
                    Current TTR
                  </p>
                  <p className="text-2xl font-bold">
                    {editingPlayer.rating}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">
                    Highest TTR
                  </p>
                  <p className="text-2xl font-bold">
                    {editingPlayer.highestRating}
                  </p>
                </div>

              </div>

              {(isAdmin || isClubLeader) && (
                <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) =>
                      setEditIsActive(e.target.checked)
                    }
                  />
                  <span className="font-medium">
                    Active player
                  </span>
                </label>
              )}

              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={closeEdit}
                  className="rounded-xl bg-slate-100 px-4 py-2 font-medium text-slate-900 transition hover:bg-slate-200"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSavePlayer}
                  disabled={saving}
                  className="rounded-xl bg-blue-900 px-4 py-2 font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}
