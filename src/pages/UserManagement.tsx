import { useEffect, useState } from "react";

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

  function getClubName(
    clubId: string | null
  ) {

    if (!clubId) {
      return "-";
    }

    return (
      clubs.find(
        (club) => club.id === clubId
      )?.name ?? "-"
    );

  }

  function getPlayerName(
    playerId: string | null
  ) {

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

  }

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

      case "club_leader":
        return "🏓 Club Leader";

      default:
        return "👤 Member";

    }

  }

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
        "Failed to save user."
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

    <div className="max-w-7xl mx-auto">

      <h1 className="text-4xl font-bold mb-8">
        User Management
      </h1>

      <div className="bg-white rounded-xl shadow overflow-hidden">

        <table className="w-full">

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
                  className="text-center py-10"
                >
                  Loading users...
                </td>

              </tr>

            ) : (

              profiles.map((profile) => (

                <tr
                  key={profile.id}
                  className="border-t hover:bg-slate-50"
                >

                  <td className="p-4">

                    {profile.firstName ||
                    profile.lastName
                      ? `${profile.firstName} ${profile.lastName}`
                      : "Unnamed User"}

                  </td>

                  <td>

                    {profile.email || "-"}

                  </td>

                  <td>

                    {getStatusBadge(
                      profile.status
                    )}

                  </td>

                  <td>

                    {getRoleDisplay(
                      profile.role
                    )}

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
                        className="text-blue-700 hover:underline"
                      >
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
                            ? "text-red-600 hover:underline"
                            : "text-green-600 hover:underline"
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

            )}

          </tbody>

        </table>

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