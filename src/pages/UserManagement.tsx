import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Pencil,
  Search,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";

import type { Profile } from "../types/profile";
import type { Club } from "../types/club";
import type { Player } from "../types/player";

import {
  getProfiles,
  saveProfile,
  setProfileStatus,
} from "../services/supabase/profileService";

import {
  getClubs,
} from "../services/supabase/clubService";

import {
  getPlayers,
} from "../services/supabase/playerService";

import EditUserModal from "../components/settings/EditUserModal";
import { notify } from "../services/notificationService";

export default function UserManagement() {

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  const [loading, setLoading] = useState(true);

  const [clubFilter, setClubFilter] =
    useState("");

  const [roleFilter, setRoleFilter] =
    useState("");

  const [profileSearch, setProfileSearch] =
    useState("");

  const [selectedProfile, setSelectedProfile] =
    useState<Profile | null>(null);

  const [modalOpen, setModalOpen] =
    useState(false);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {

      setLoading(true);

      const [
        profileData,
        clubData,
        playerData,
      ] = await Promise.all([
        getProfiles(),
        getClubs(),
        getPlayers(),
      ]);

      setProfiles(profileData);
      setClubs(clubData);
      setPlayers(playerData);

    } catch (error) {

      console.error(error);
      notify.fault("Failed to load users.");

    } finally {

      setLoading(false);

    }
  }

  const getClubName = useCallback((
    clubId: string | null
  ) => {

    if (!clubId) {
      return "-";
    }

    return (
      clubs.find(
        (club) => club.id === clubId
      )?.name ?? "-"
    );

  }, [clubs]);

  const getPlayerName = useCallback((
    playerId: string | null
  ) => {

    if (!playerId) {
      return "-";
    }

    const player = players.find(
      (p) => p.id === playerId
    );

    if (!player) {
      return "-";
    }

    return `${player.firstName} ${player.lastName}`;

  }, [players]);

  function getStatusBadge(
    status: Profile["status"]
  ) {

    if (status === "active") {

      return (
        <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-3 py-1 text-sm font-medium">
          🟢 Active
        </span>
      );

    }

    return (
      <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-3 py-1 text-sm font-medium">
        🔴 Disabled
      </span>
    );

  }

  function getRoleDisplay(
    role: Profile["role"]
  ) {

    switch (role) {

      case "admin":
        return "👑 Admin";

      case "club_admin":
        return "Club Admin";

      case "player":
        return "Player";

      default:
        return "Player";

    }

  }

  const filteredProfiles = useMemo(() => {
    const query =
      profileSearch.trim().toLowerCase();

    return profiles.filter((profile) => {
      const clubName =
        getClubName(profile.clubId);

      const playerName =
        getPlayerName(profile.playerId);

      const searchable = [
        profile.firstName,
        profile.lastName,
        profile.email,
        getRoleDisplay(profile.role),
        clubName,
        playerName,
      ]
        .join(" ")
        .toLowerCase();

      const matchesClub =
        !clubFilter ||
        profile.clubId === clubFilter;

      const matchesRole =
        !roleFilter ||
        profile.role === roleFilter;

      const matchesSearch =
        !query ||
        searchable.includes(query);

      return (
        matchesClub &&
        matchesRole &&
        matchesSearch
      );
    });
  }, [
    profiles,
    getClubName,
    getPlayerName,
    clubFilter,
    roleFilter,
    profileSearch,
  ]);

  async function handleSave(
    profile: Profile
  ) {

    try {

      await saveProfile(profile);

      notify.edgeBall(
        "User updated successfully."
      );

      await loadData();

    } catch (error) {

      console.error(error);

      notify.fault(
        error instanceof Error
          ? error.message
          : "Failed to save user."
      );

    }

  }

  async function handleToggleStatus(
    profile: Profile
  ) {

    const newStatus =
      profile.status === "active"
        ? "disabled"
        : "active";

    const confirmed = window.confirm(
      `${
        newStatus === "disabled"
          ? "Disable"
          : "Enable"
      } ${profile.firstName} ${profile.lastName}?`
    );

    if (!confirmed) {
      return;
    }

    try {

      await setProfileStatus(
        profile.id,
        newStatus
      );

      notify.edgeBall(
        `User ${newStatus}.`
      );

      await loadData();

    } catch (error) {

      console.error(error);

      notify.fault(
        "Unable to update user."
      );

    }

  }

  return (

    <div className="mx-auto max-w-7xl space-y-8">

      <div>

        <h1 className="mt-2 text-5xl font-normal tracking-tight text-slate-900">
          User Management
        </h1>

        <p className="mt-3 text-lg text-slate-500">
          Manage account access, roles, clubs and linked player profiles.
        </p>

      </div>

      <div className="grid gap-4 md:grid-cols-3">

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Users className="h-5 w-5 text-blue-700" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Users
            </p>
            <p className="text-2xl font-black">
              {profiles.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <ShieldCheck className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Active
            </p>
            <p className="text-2xl font-black">
              {
                profiles.filter(
                  (profile) =>
                    profile.status === "active"
                ).length
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <UserCog className="h-5 w-5 text-indigo-600" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Admins
            </p>
            <p className="text-2xl font-black">
              {
                profiles.filter(
                  (profile) =>
                    profile.role === "admin"
                ).length
              }
            </p>
          </div>
        </div>

      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="grid gap-3 md:grid-cols-[minmax(180px,240px)_minmax(160px,220px)_1fr]">

          <select
            value={clubFilter}
            onChange={(e) =>
              setClubFilter(e.target.value)
            }
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">
              All Clubs
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

          <select
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(e.target.value)
            }
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">
              All Roles
            </option>
            <option value="admin">
              Admin
            </option>
            <option value="club_admin">
              Club Admin
            </option>
            <option value="player">
              Player
            </option>
          </select>

          <div className="relative">

            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={profileSearch}
              onChange={(e) =>
                setProfileSearch(e.target.value)
              }
              placeholder="Search profiles"
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
            />

          </div>

        </div>

      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center gap-3 border-b px-8 py-5">

          <UserCog className="h-6 w-6 text-blue-700" />

          <h2 className="text-2xl font-bold">
            Users
          </h2>

        </div>

        <div className="overflow-x-auto">

        <table className="w-full min-w-[980px]">

          <thead className="bg-slate-100">

            <tr>

              <th className="text-left p-4">
                Name
              </th>

              <th className="text-left">
                Email
              </th>

              <th className="text-left">
                Status
              </th>

              <th className="text-left">
                Role
              </th>

              <th className="text-left">
                Club
              </th>

              <th className="text-left">
                Linked Player
              </th>

              <th className="text-center">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>
                        {loading ? (

              <tr>

                <td
                  colSpan={7}
                  className="py-10 text-center text-slate-500"
                >
                  Loading users...
                </td>

              </tr>

            ) : (

              filteredProfiles.length === 0 ? (

                <tr>

                  <td
                    colSpan={7}
                    className="py-10 text-center text-slate-500"
                  >
                    No users match your filters.
                  </td>

                </tr>

              ) : (

              filteredProfiles.map((profile) => (

                <tr
                  key={profile.id}
                  className="border-t transition hover:bg-slate-50"
                >

                  <td className="p-4 font-semibold">

                    {profile.firstName ||
                    profile.lastName
                      ? `${profile.firstName} ${profile.lastName}`
                      : "Unnamed User"}

                  </td>

                  <td>

                    <span className="text-slate-600">
                      {profile.email || "-"}
                    </span>

                  </td>

                  <td>

                    {getStatusBadge(
                      profile.status
                    )}

                  </td>

                  <td>

                    <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                      {getRoleDisplay(
                        profile.role
                      )}
                    </span>

                  </td>

                  <td>

                    {getClubName(
                      profile.clubId
                    )}

                  </td>

                  <td>

                    {getPlayerName(
                      profile.playerId
                    )}

                  </td>

                  <td className="text-center">

                    <div className="flex justify-center gap-4">

                      <button
                        onClick={() => {

                          setSelectedProfile(
                            profile
                          );

                          setModalOpen(
                            true
                          );

                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-900"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          void handleToggleStatus(
                            profile
                          )
                        }
                        className={
                          profile.status ===
                          "active"
                            ? "rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                            : "rounded-xl border border-green-200 px-3 py-2 text-sm font-medium text-green-700 transition hover:bg-green-50"
                        }
                      >
                        {profile.status ===
                        "active"
                          ? "Disable"
                          : "Enable"}
                      </button>

                    </div>

                  </td>

                </tr>

              ))

              )

            )}

          </tbody>

        </table>

        </div>

      </div>

      <EditUserModal
        profile={selectedProfile}
        clubs={clubs}
        players={players}
        open={modalOpen}
        onClose={() => {

          setModalOpen(false);

          setSelectedProfile(
            null
          );

          void loadData();

        }}
        onSave={async (
          profile
        ) => {

          await handleSave(
            profile
          );

          await loadData();

        }}
      />

    </div>

  );

}
