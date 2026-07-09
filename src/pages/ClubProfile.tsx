import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useParams } from "react-router-dom";

import {
  Building2,
  Pencil,
} from "lucide-react";

import type { Club } from "../types/club";
import type { Player } from "../types/player";

import {
  getClub,
  updateClub,
} from "../services/supabase/clubService";

import {
  getPlayers,
} from "../services/supabase/playerService";

import StatCard from "../components/shared/StatCard";
import Card from "../components/shared/Card";

import EditClubModal from "../components/clubs/EditClubModal";

import useRole from "../hooks/useRole";
import { notify } from "../services/notificationService";

function externalUrl(url: string) {
  return /^https?:\/\//i.test(url)
    ? url
    : `https://${url}`;
}

export default function ClubProfile() {
  const {
    isAdmin,
    isClubLeader,
    clubId,
  } = useRole();

  const { id } = useParams();

  const [club, setClub] = useState<Club | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  const [editing, setEditing] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;

    try {
      const [clubData, playerData] = await Promise.all([
        getClub(id),
        getPlayers(),
      ]);

      setClub(clubData);
      setPlayers(playerData);

    } catch (error) {
      console.error(error);
      notify.fault("Failed to load club.");
    }
  }, [id]);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadData();
      }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadData]);

  async function handleSave(updatedClub: Club) {
    const canSave =
      isAdmin ||
      (
        isClubLeader &&
        clubId === updatedClub.id
      );

    if (!canSave) {
      notify.fault(
        "You can only edit your associated club."
      );
      return;
    }

    try {
      await updateClub(updatedClub);

      setEditing(false);

      await loadData();

      notify.clubUpdated(updatedClub.name);

    } catch (error) {
      console.error(error);
      notify.fault("Unable to save club.");
    }
  }

  const rankings = useMemo(() => {
    if (!club) return [];

    return players
      .filter(
        (player) =>
          player.clubId === club.id &&
          player.isActive
      )
      .sort((a, b) => b.rating - a.rating);

  }, [players, club]);

  const averageRating = useMemo(() => {
    if (rankings.length === 0) return "-";

    return Math.round(
      rankings.reduce(
        (sum, player) => sum + player.rating,
        0
      ) / rankings.length
    );

  }, [rankings]);

  const topPlayer = rankings[0];

  const canEditClub =
    isAdmin ||
    (
      isClubLeader &&
      clubId === club?.id
    );

  if (!club) {
    return (
      <div className="max-w-6xl mx-auto">

        <h1 className="text-4xl font-bold mb-4">
          Club Not Found
        </h1>

        <Link
          to="/clubs"
          className="text-blue-700 hover:underline"
        >
          ← Back to Clubs
        </Link>

      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      <Link
        to="/clubs"
        className="text-blue-700 hover:underline"
      >
        ← Back to Clubs
      </Link>

      <div
        className="relative flex min-h-80 overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white shadow-sm"
        style={{
          backgroundImage:
            club.headerImageUrl
              ? `linear-gradient(rgba(15,23,42,0.22), rgba(15,23,42,0.82)), url(${club.headerImageUrl})`
              : "linear-gradient(135deg, #1e3a8a, #0f172a)",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="mt-auto flex w-full flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold backdrop-blur">
              <Building2 className="h-4 w-4" />
              {club.shortName || "Club"}
            </div>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight">
              {club.name}
            </h1>

            <p className="mt-3 max-w-2xl text-lg text-white/80">
              {club.address || "Club profile"}
            </p>
          </div>

          {canEditClub && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-blue-50"
            >
              <Pencil className="h-4 w-4" />
              Edit Club
            </button>
          )}
        </div>
      </div>

      {club.notice && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">
            Club Notice
          </p>
          <p className="mt-2 whitespace-pre-line text-slate-700">
            {club.notice}
          </p>
        </div>
      )}

      <Card className="p-8">

        <div className="grid md:grid-cols-3 gap-6">

          <div>

            <p className="text-sm text-slate-500">
              Phone
            </p>

            <p className="font-semibold">
              {club.phone || "-"}
            </p>

          </div>

          <div>

            <p className="text-sm text-slate-500">
              Email
            </p>

            <p className="font-semibold">
              {club.email || "-"}
            </p>

          </div>

          <div>

            <p className="text-sm text-slate-500">
              Website
            </p>

            {club.website ? (
              <a
                href={externalUrl(club.website)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 hover:underline"
              >
                {club.website}
              </a>
            ) : (
              "-"
            )}

          </div>

        </div>

      </Card>

      <div className="grid md:grid-cols-3 gap-4">

        <StatCard
          title="Players"
          value={rankings.length}
        />

        <StatCard
          title="Average Rating"
          value={averageRating}
        />

        <StatCard
          title="Top Player"
          value={
            topPlayer
              ? `${topPlayer.firstName} ${topPlayer.lastName}`
              : "-"
          }
        />

      </div>

      <Card className="p-8">

        <h2 className="text-2xl font-bold mb-6">
          Club Rankings
        </h2>

        {rankings.length === 0 ? (

          <p className="text-slate-500">
            No players yet.
          </p>

        ) : (

          <table className="w-full">

            <thead>

              <tr className="border-b">

                <th className="text-left pb-4">
                  Rank
                </th>

                <th className="text-left pb-4">
                  Player
                </th>

                <th className="text-center pb-4">
                  Rating
                </th>

              </tr>

            </thead>

            <tbody>

              {rankings.map((player, index) => (

                <tr
                  key={player.id}
                  className="border-b hover:bg-slate-50"
                >

                  <td className="py-3">
                    {index + 1}
                  </td>

                  <td>

                    <Link
                      to={`/players/${player.id}`}
                      className="text-blue-700 hover:underline"
                    >
                      {player.firstName} {player.lastName}
                    </Link>

                  </td>

                  <td className="text-center font-semibold">
                    {player.rating}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        )}

      </Card>

      {canEditClub && (

        <EditClubModal
          open={editing}
          club={club}
          onClose={() => setEditing(false)}
          onSave={handleSave}
        />

      )}

    </div>
  );
}
