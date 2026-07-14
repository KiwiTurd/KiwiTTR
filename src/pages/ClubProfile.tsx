import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useParams } from "react-router-dom";

import {
  Building2,
  CalendarDays,
  ChevronRight,
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

import Card from "../components/shared/Card";

import EditClubModal from "../components/clubs/EditClubModal";

import useRole from "../hooks/useRole";
import { notify } from "../services/notificationService";
import { useTournament } from "../context/TournamentContext";
import type { SavedTournament } from "../types/tournament";
import LoadingScreen from "../components/shared/LoadingScreen";
import { formatStartTime } from "../utils/tournamentTime";

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
  const { savedTournaments } =
    useTournament();

  const [club, setClub] = useState<Club | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

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
    } finally {
      setLoading(false);
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

  const upcomingTournaments =
    useMemo(() => {
      if (!club) {
        return [];
      }

      const today = new Date()
        .toISOString()
        .slice(0, 10);

      return savedTournaments
        .filter(tournament => {
          const finished =
            tournament.status === "completed";
          const cancelled =
            tournament.status === "cancelled";

          return (
            tournament.settings.clubId === club.id &&
            !finished &&
            !cancelled &&
            tournament.settings.date >= today
          );
        })
        .sort(
          (a, b) =>
            new Date(a.settings.date).getTime() -
            new Date(b.settings.date).getTime()
        );
    }, [
      club,
      savedTournaments,
    ]);

  if (loading) {
    return <LoadingScreen label="Loading club..." />;
  }

  if (!club) {
    return (
      <div className="max-w-6xl mx-auto">

        <h1 className="text-4xl font-normal mb-4">
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
    <div className="-mx-4 -mt-4 space-y-8 md:-mx-8 md:-mt-8">

      <div
        className="relative flex min-h-80 overflow-hidden border-b border-slate-200 bg-slate-900 text-white shadow-sm"
        style={{
          backgroundImage:
            club.headerImageUrl
              ? `linear-gradient(rgba(15,23,42,0.22), rgba(15,23,42,0.82)), url(${club.headerImageUrl})`
              : "linear-gradient(135deg, #1e3a8a, #0f172a)",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-4 md:px-8 md:py-8">
          <Link
            to="/clubs"
            className="self-start rounded-lg bg-slate-950/30 px-3 py-2 font-semibold text-white backdrop-blur-sm transition hover:bg-slate-950/50"
          >
            ← Back to Clubs
          </Link>

        <div className="mt-auto flex w-full flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="club-profile-header">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold backdrop-blur">
              <Building2 className="h-4 w-4" />
              {club.shortName || "Club"}
            </div>

            <h1 className="mt-4 max-w-4xl text-5xl font-normal tracking-tight text-white">
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
      </div>

      <div className="mx-auto max-w-7xl space-y-8 px-4 md:px-8">

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

      <div className="grid gap-3 md:grid-cols-3">

        <ClubStatCard
          label="Players"
          value={rankings.length}
        />

        <ClubStatCard
          label="Average Rating"
          value={averageRating}
        />

        <ClubStatCard
          label="Top Player"
          value={
            topPlayer
              ? `${topPlayer.firstName} ${topPlayer.lastName}`
              : "-"
          }
        />

      </div>

      <Card className="p-0 overflow-hidden">

        <div className="flex items-center justify-between border-b px-5 py-4">

          <div className="flex items-center gap-2">

            <CalendarDays className="h-5 w-5 text-blue-700" />

            <h2 className="text-xl font-bold">
              Upcoming Tournaments
            </h2>

          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
            {upcomingTournaments.length}
          </span>

        </div>

        {upcomingTournaments.length === 0 ? (

          <div className="px-5 py-6 text-sm text-slate-500">
            No upcoming tournaments for this club.
          </div>

        ) : (

          <div className="divide-y">

            {upcomingTournaments.map(tournament => (

              <TournamentListRow
                key={tournament.id}
                tournament={tournament}
              />

            ))}

          </div>

        )}

      </Card>

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

    </div>
  );
}

function tournamentFormatLabel(
  tournament: SavedTournament
) {
  return tournament.settings.format === "pools"
    ? "Pools -> Knockout"
    : tournament.settings.format === "pool-ratings"
      ? "Pool Only Ratings"
    : tournament.settings.format === "doubles"
      ? "Doubles Knockout"
      : "Straight Knockout";
}

function ClubStatCard({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-semibold uppercase text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate text-lg font-bold text-slate-950">
        {value}
      </p>
    </div>
  );
}

function TournamentListRow({
  tournament,
}: {
  tournament: SavedTournament;
}) {
  const totalMatches =
    tournament.matches.length +
    tournament.knockout.length;
  const completedMatches = [
    ...tournament.matches,
    ...tournament.knockout,
  ].filter(match => match.completed).length;
  const live =
    totalMatches > 0 &&
    completedMatches < totalMatches;

  return (
    <Link
      to={`/tournaments/${tournament.id}/viewer`}
      className="flex items-center justify-between gap-4 px-5 py-3 transition hover:bg-slate-50"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-base font-medium">
            {tournament.settings.name}
          </h3>
          {live && (
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
              Live
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500">
          {new Date(
            tournament.settings.date
          ).toLocaleDateString()}
          {tournament.settings.startTime &&
            ` at ${formatStartTime(tournament.settings.startTime)}`}
          {" "}·{" "}
          {tournamentFormatLabel(tournament)}
        </p>
      </div>

      <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
    </Link>
  );
}
