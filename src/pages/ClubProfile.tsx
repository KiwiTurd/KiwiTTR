import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import type { Club } from "../types/club";
import type { Player } from "../types/player";

import {
  getClub,
  updateClub,
} from "../services/supabase/clubService";

import {
  getPlayers,
} from "../services/supabase/playerService";

import PageHeader from "../components/shared/PageHeader";
import StatCard from "../components/shared/StatCard";
import Card from "../components/shared/Card";
import Button from "../components/shared/Button";

import EditClubModal from "../components/clubs/EditClubModal";

import useRole from "../hooks/useRole";
import { notify } from "../services/notificationService";

export default function ClubProfile() {
  const { isAdmin } = useRole();

  const { id } = useParams();

  const [club, setClub] = useState<Club | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  const [editing, setEditing] = useState(false);

  useEffect(() => {
    void loadData();
  }, [id]);

  async function loadData() {
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
  }

  async function handleSave(updatedClub: Club) {
    try {
      await updateClub(updatedClub);

      setEditing(false);

      await loadData();

      notify.clubCreated(updatedClub.name);

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

      <PageHeader
        title={club.name}
        subtitle={club.address}
        actions={
          isAdmin ? (
            <Button
              onClick={() => setEditing(true)}
            >
              Edit Club
            </Button>
          ) : undefined
        }
      />

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
                href={club.website}
                target="_blank"
                rel="noreferrer"
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

      {isAdmin && (

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