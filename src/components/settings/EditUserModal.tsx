import { useEffect, useState } from "react";

import {
  Shield,
  UserCog,
} from "lucide-react";

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

  function normalizeName(value: string) {
    return value.trim().toLowerCase();
  }

  function namesMatch(player: Player) {
    return (
      normalizeName(player.firstName) ===
        normalizeName(edited?.firstName ?? "") &&
      normalizeName(player.lastName) ===
        normalizeName(edited?.lastName ?? "")
    );
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
    if (profile) {
      setEdited({ ...profile });
    }
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">

        <div className="flex items-center gap-3 border-b px-6 py-5">

          <UserCog className="h-6 w-6 text-blue-700" />

          <h2 className="text-2xl font-bold">
            Edit User
          </h2>

        </div>

        <div className="space-y-4 p-6">

          <input
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
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
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
            value={edited.lastName}
            onChange={(e) =>
              setEdited({
                ...edited,
                lastName: e.target.value,
              })
            }
            placeholder="Last Name"
          />

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-500">
              Email
            </p>
            <p className="font-semibold">
              {edited.email || "-"}
            </p>
          </div>

          <div className="relative">

            <Shield className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

          <select
            className="w-full appearance-none rounded-xl border border-slate-300 py-3 pl-12 pr-4 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
            value={edited.role}
            onChange={(e) =>
              setEdited({
                ...edited,
                role: e.target.value as UserRole,
              })
            }
          >
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

          </div>

          <select
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
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
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
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
              .filter(namesMatch)
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

        <div className="flex justify-end gap-3 border-t px-6 py-4">

          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-5 py-2 font-medium text-slate-900 transition hover:bg-slate-200"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="rounded-xl bg-blue-900 px-5 py-2 font-medium text-white transition hover:bg-blue-800"
          >
            Save Changes
          </button>

        </div>

      </div>

    </div>
  );
}
