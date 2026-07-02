import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import type { Club } from "../types/club";

import { getClub, updateClub } from "../services/clubService";

import {
  getClubAverageRating,
  getClubMatchCount,
  getClubPlayerCount,
  getClubRankings,
  getClubTopPlayer,
} from "../services/statisticsService";

import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

import EditClubModal from "../components/clubs/EditClubModal";

export default function ClubProfile() {
  const { id } = useParams();

  const [editing, setEditing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const club = id ? getClub(id) : undefined;

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

  const rankings = getClubRankings(club.id);
  const topPlayer = getClubTopPlayer(club.id);

  function handleSave(updatedClub: Club) {
    updateClub(updatedClub);

    setRefreshKey((k) => k + 1);
  }

  return (
    <div
      key={refreshKey}
      className="max-w-7xl mx-auto space-y-8"
    >

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
          <Button
            onClick={() => setEditing(true)}
          >
            Edit Club
          </Button>
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

      <div className="grid md:grid-cols-4 gap-4">

        <StatCard
          title="Players"
          value={getClubPlayerCount(club.id)}
        />

        <StatCard
          title="Average Rating"
          value={getClubAverageRating(club.id)}
        />

        <StatCard
          title="Top Player"
          value={
            topPlayer
              ? `${topPlayer.firstName} ${topPlayer.lastName}`
              : "-"
          }
        />

        <StatCard
          title="Matches"
          value={getClubMatchCount(club.id)}
        />

      </div>

      <Card className="p-8">

        <h2 className="text-2xl font-bold mb-6">
          Current Club Rankings
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

      <EditClubModal
        open={editing}
        club={club}
        onClose={() => setEditing(false)}
        onSave={handleSave}
      />

    </div>
  );
}