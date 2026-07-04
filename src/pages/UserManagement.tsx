import { useEffect, useState } from "react";

import type { Profile } from "../types/profile";
import type { Club } from "../types/club";
import type { Player } from "../types/player";

import {
  getProfiles,
  saveProfile,
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

      setProfiles((current) =>
        current.map((p) =>
          p.id === profile.id
            ? profile
            : p
        )
      );

      notify.edgeBall(
        "User updated successfully."
      );

    } catch (error) {
      console.error(error);
      notify.fault("Failed to save user.");
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
                Role
              </th>

              <th className="text-left">
                Club
              </th>

              <th className="text-center">
                Action
              </th>

            </tr>

          </thead>

          <tbody>

            {loading ? (

              <tr>

                <td
                  colSpan={4}
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
                    {getRoleDisplay(
                      profile.role
                    )}
                  </td>

                  <td>
                    {getClubName(
                      profile.clubId
                    )}
                  </td>

                  <td className="text-center">

                    <button
                      onClick={() => {
                        setSelectedProfile(
                          profile
                        );
                        setModalOpen(true);
                      }}
                      className="text-blue-700 hover:underline"
                    >
                      Edit
                    </button>

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
          setSelectedProfile(null);

          void loadData();
        }}
        onSave={async (profile) => {
          await handleSave(profile);
          await loadData();
        }}
      />

    </div>
  );
}