import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Image,
  MapPin,
  Save,
  Upload,
} from "lucide-react";

import type { Club } from "../types/club";

import {
  getClubs,
  updateClub,
} from "../services/supabase/clubService";

import useRole from "../hooks/useRole";
import useFormDraftState, { hasFormDraft } from "../hooks/useFormDraftState";
import { notify } from "../services/notificationService";

function readImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(String(reader.result ?? ""));
    };

    reader.onerror = () => {
      reject(reader.error);
    };

    reader.readAsDataURL(file);
  });
}

export default function ClubSettings() {
  const {
    isAdmin,
    isClubLeader,
    clubId: userClubId,
  } = useRole();

  const [clubs, setClubs] =
    useState<Club[]>([]);

  const [selectedClubId, setSelectedClubId] =
    useFormDraftState("settings.club.selectedClubId", "");

  const [editedClub, setEditedClub] =
    useFormDraftState<Club | null>("settings.club.editedClub", null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [editorOpen, setEditorOpen] =
    useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getClubs();

      const visibleClubs =
        isClubLeader && userClubId
          ? data.filter(
              (club) => club.id === userClubId
            )
          : data;

      setClubs(visibleClubs);

      const nextClubId =
        isClubLeader && userClubId
          ? userClubId
          : selectedClubId || visibleClubs[0]?.id || "";

      if (!hasFormDraft("settings.club.editedClub")) {
        setSelectedClubId(nextClubId);
        setEditedClub(
          visibleClubs.find(
            (club) => club.id === nextClubId
          ) ?? null
        );
      }
    } catch (error) {
      console.error(error);
      notify.fault("Unable to load club settings.");
    } finally {
      setLoading(false);
    }
  }, [
    isClubLeader,
    selectedClubId,
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

  const canEdit =
    isAdmin ||
    (isClubLeader && Boolean(userClubId));

  const selectedClub = useMemo(() => {
    return clubs.find(
      (club) => club.id === selectedClubId
    ) ?? null;
  }, [
    clubs,
    selectedClubId,
  ]);

  function update<K extends keyof Club>(
    key: K,
    value: Club[K]
  ) {
    if (!editedClub) {
      return;
    }

    setEditedClub({
      ...editedClub,
      [key]: value,
    });
  }

  function handleClubChange(clubId: string) {
    setSelectedClubId(clubId);
    setEditedClub(
      clubs.find((club) => club.id === clubId) ?? null
    );
    setEditorOpen(true);
  }

  async function handleImageUpload(
    file: File | undefined
  ) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      notify.timeout("Please choose an image file.");
      return;
    }

    try {
      const imageUrl = await readImageFile(file);
      update("headerImageUrl", imageUrl);
    } catch (error) {
      console.error(error);
      notify.fault("Unable to read image.");
    }
  }

  async function handleSave() {
    if (!editedClub || !canEdit) {
      return;
    }

    if (!editedClub.name.trim()) {
      notify.timeout("Club name is required.");
      return;
    }

    setSaving(true);

    try {
      await updateClub({
        ...editedClub,
        name: editedClub.name.trim(),
        shortName: editedClub.shortName.trim(),
        address: editedClub.address.trim(),
        phone: editedClub.phone.trim(),
        email: editedClub.email.trim(),
        website: editedClub.website.trim(),
        notice: editedClub.notice.trim(),
      });

      notify.clubUpdated(editedClub.name);
      await loadData();
    } catch (error) {
      console.error(error);
      notify.fault("Unable to save club settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-normal">
          Loading...
        </h1>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">

      <div>
        <h1 className="mt-2 text-5xl font-normal tracking-tight text-slate-900">
          Club Settings
        </h1>

        <p className="mt-3 text-lg text-slate-500">
          {editorOpen
            ? "Update club information, notices and the public header image."
            : "Select a club to open its settings and public information."}
        </p>
      </div>

      {!editorOpen ? (
        clubs.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
            No club is available for this account.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {clubs.map((club) => (
              <button
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                key={club.id}
                onClick={() => handleClubChange(club.id)}
                type="button"
              >
                <div
                  className="h-28 bg-slate-800"
                  style={{
                    backgroundImage: club.headerImageUrl
                      ? `linear-gradient(rgba(15,23,42,0.20), rgba(15,23,42,0.60)), url(${club.headerImageUrl})`
                      : "linear-gradient(135deg, #1e3a8a, #0f172a)",
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                  }}
                />

                <div className="flex items-center gap-4 p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-bold text-slate-900">
                      {club.name}
                    </h2>
                    <p className="mt-1 flex items-center gap-1 truncate text-sm text-slate-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {club.address || "No address added"}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-700" />
                </div>
              </button>
            ))}
          </div>
        )
      ) : !editedClub ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          No club is available for this account.
        </div>
      ) : (
        <>
          <div>
            <button
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900 hover:shadow-sm"
              onClick={() => setEditorOpen(false)}
              type="button"
            >
              <ArrowLeft className="h-4 w-4" />
              All clubs
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div
              className="relative flex min-h-64 items-end bg-slate-900 p-8 text-white"
              style={{
                backgroundImage:
                  editedClub.headerImageUrl
                    ? `linear-gradient(rgba(15,23,42,0.30), rgba(15,23,42,0.78)), url(${editedClub.headerImageUrl})`
                    : "linear-gradient(135deg, #1e3a8a, #0f172a)",
                backgroundPosition: "center",
                backgroundSize: "cover",
              }}
            >
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold backdrop-blur">
                  <Image className="h-4 w-4" />
                  Header Preview
                </div>

                <h2 className="mt-4 text-4xl font-black">
                  {editedClub.name || "Club Name"}
                </h2>

                <p className="mt-2 max-w-2xl text-white/80">
                  {editedClub.address ||
                    "Add a header image and club information below."}
                </p>
              </div>
            </div>

            <div className="grid gap-4 border-t p-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h3 className="font-bold">
                  Header Image
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Upload a wide image for the public club hero section.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-900 px-4 py-3 font-semibold text-white transition hover:bg-blue-800">
                  <Upload className="h-4 w-4" />
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) =>
                      void handleImageUpload(
                        event.target.files?.[0]
                      )
                    }
                  />
                </label>

                {editedClub.headerImageUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      update("headerImageUrl", "")
                    }
                    className="rounded-xl bg-slate-100 px-4 py-3 font-semibold text-slate-900 transition hover:bg-slate-200"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-blue-700" />
                <h2 className="text-2xl font-bold">
                  Standard Information
                </h2>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <input
                  value={editedClub.name}
                  onChange={(event) =>
                    update("name", event.target.value)
                  }
                  placeholder="Club Name"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                />

                <input
                  value={editedClub.shortName}
                  onChange={(event) =>
                    update("shortName", event.target.value)
                  }
                  placeholder="Short Name"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                />

                <input
                  value={editedClub.address}
                  onChange={(event) =>
                    update("address", event.target.value)
                  }
                  placeholder="Address"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100 md:col-span-2"
                />

                <input
                  value={editedClub.phone}
                  onChange={(event) =>
                    update("phone", event.target.value)
                  }
                  placeholder="Phone"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                />

                <input
                  type="email"
                  value={editedClub.email}
                  onChange={(event) =>
                    update("email", event.target.value)
                  }
                  placeholder="Email"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                />

                <input
                  value={editedClub.website}
                  onChange={(event) =>
                    update("website", event.target.value)
                  }
                  placeholder="Website"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100 md:col-span-2"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold">
                Notices
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Add a public club notice for members and visitors.
              </p>

              <textarea
                value={editedClub.notice}
                onChange={(event) =>
                  update("notice", event.target.value)
                }
                placeholder="Training updates, venue notes, holiday closures..."
                rows={10}
                className="mt-5 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-6 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <Save className="h-5 w-5" />
              {saving ? "Saving..." : "Save Club Settings"}
            </button>
          </div>
        </>
      )}

      {editorOpen && selectedClub && (
        <p className="text-sm text-slate-500">
          Editing {selectedClub.name}
        </p>
      )}

    </div>
  );
}
