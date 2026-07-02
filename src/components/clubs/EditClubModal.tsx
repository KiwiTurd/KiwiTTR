import { useEffect, useState } from "react";

import type { Club } from "../../types/club";

import Modal from "../ui/Modal";
import Button from "../ui/Button";

interface Props {
  open: boolean;
  club: Club;
  onClose: () => void;
  onSave: (club: Club) => void;
}

export default function EditClubModal({
  open,
  club,
  onClose,
  onSave,
}: Props) {
  const [editedClub, setEditedClub] =
    useState(club);

  useEffect(() => {
    setEditedClub(club);
  }, [club]);

  function update<K extends keyof Club>(
    key: K,
    value: Club[K]
  ) {
    setEditedClub({
      ...editedClub,
      [key]: value,
    });
  }

  function handleSave() {
    onSave(editedClub);
    onClose();
  }

  return (
    <Modal
      open={open}
      title="Edit Club"
      onClose={onClose}
    >

      <div className="space-y-4">

        <input
          className="border rounded-lg p-3 w-full"
          placeholder="Club Name"
          value={editedClub.name}
          onChange={(e) =>
            update("name", e.target.value)
          }
        />

        <input
          className="border rounded-lg p-3 w-full"
          placeholder="Short Name"
          value={editedClub.shortName}
          onChange={(e) =>
            update("shortName", e.target.value)
          }
        />

        <input
          className="border rounded-lg p-3 w-full"
          placeholder="Address"
          value={editedClub.address}
          onChange={(e) =>
            update("address", e.target.value)
          }
        />

        <input
          className="border rounded-lg p-3 w-full"
          placeholder="Phone"
          value={editedClub.phone}
          onChange={(e) =>
            update("phone", e.target.value)
          }
        />

        <input
          className="border rounded-lg p-3 w-full"
          placeholder="Email"
          value={editedClub.email}
          onChange={(e) =>
            update("email", e.target.value)
          }
        />

        <input
          className="border rounded-lg p-3 w-full"
          placeholder="Website"
          value={editedClub.website}
          onChange={(e) =>
            update("website", e.target.value)
          }
        />

        <div className="flex justify-end gap-3 pt-4">

          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSave}
          >
            Save Changes
          </Button>

        </div>

      </div>

    </Modal>
  );
}