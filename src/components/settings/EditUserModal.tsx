import { useEffect, useState } from "react";

import type {
  Profile,
  UserRole,
} from "../../types/profile";

import type { Club } from "../../types/club";
import type { Player } from "../../types/player";

interface Props {
  profile: Profile | null;

  clubs: Club[];
  players: Player[];

  open: boolean;

  onClose: () => void;
  onSave: (profile: Profile) => Promise<void>;
}

export default function EditUserModal({
  profile,
  clubs,
  players,
  open,
  onClose,
  onSave,
}: Props) {
  const [edited, setEdited] =
    useState<Profile | null>(null);

  useEffect(() => {
    if (profile) {
      setEdited({ ...profile });
    }
  }, [profile]);

  if (!open || !edited) {
    return null;
  }

  async function handleSave() {
    if (!edited) {
      return;
    }

    await onSave(edited);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl p-8">

        <h2 className="text-2xl font-bold mb-6">
          Edit User
        </h2>

        <div className="space-y-4">

          <input
            className="border rounded-lg p-3 w-full"
            value={edited.firstName}
            onChange={(e) =>
              setEdited({
                ...edited,
                firstName: e.target.value,
              })
            }
            placeholder="First Name"
          />

          <input
            className="border rounded-lg p-3 w-full"
            value={edited.lastName}
            onChange={(e) =>
              setEdited({
                ...edited,
                lastName: e.target.value,
              })
            }
            placeholder="Last Name"
          />

          <select
            className="border rounded-lg p-3 w-full"
            value={edited.role}
            onChange={(e) =>
              setEdited({
                ...edited,
                role: e.target.value as UserRole,
              })
            }
          >
            <option value="admin">
              👑 Admin
            </option>

            <option value="club_leader">
              🏓 Club Leader
            </option>

            <option value="member">
              👤 Member
            </option>
          </select>

          <select
            className="border rounded-lg p-3 w-full"
            value={edited.clubId ?? ""}
            onChange={(e) =>
              setEdited({
                ...edited,
                clubId:
                  e.target.value || null,
              })
            }
          >
            <option value="">
              No Club
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
            className="border rounded-lg p-3 w-full"
            value={edited.playerId ?? ""}
            onChange={(e) =>
              setEdited({
                ...edited,
                playerId:
                  e.target.value || null,
              })
            }
          >
            <option value="">
              No Linked Player
            </option>

            {players
              .filter((player) =>
                !edited.clubId
                  ? true
                  : player.clubId ===
                    edited.clubId
              )
              .map((player) => (
                <option
                  key={player.id}
                  value={player.id}
                >
                  {player.firstName}{" "}
                  {player.lastName}
                </option>
              ))}
          </select>

        </div>

        <div className="flex justify-end gap-3 mt-8">

          <button
            onClick={onClose}
            className="border rounded-lg px-5 py-2"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="bg-blue-900 text-white rounded-lg px-5 py-2"
          >
            Save Changes
          </button>

        </div>

      </div>

    </div>
  );
}