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
  Pencil,
  Trophy,
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
import LoadingScreen from "../components/shared/LoadingScreen";
import UpcomingTournamentAccordion from "../components/tournaments/UpcomingTournamentAccordion";

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

            <UpcomingTournamentAccordion
              tournaments={upcomingTournaments}
              clubNameFor={() => club.name}
            />

          </div>

        )}

      </Card>

      <Card className="overflow-hidden p-0">

        <div className="flex items-center border-b border-slate-300 px-5 py-4 sm:px-6">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Trophy className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Club Rankings
              </h2>
              <p className="text-sm text-slate-500">
                Active players ranked by TTR
              </p>
            </div>

          </div>

        </div>

        {rankings.length === 0 ? (

          <p className="px-6 py-8 text-sm text-slate-500">
            No players yet.
          </p>

        ) : (

          <div>

            <div className="grid grid-cols-[4rem_minmax(0,1fr)_minmax(0,0.8fr)_4.5rem] items-center gap-3 border-b border-slate-300 bg-slate-50 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 sm:grid-cols-[5rem_minmax(0,1fr)_minmax(0,0.8fr)_4.5rem] sm:gap-4 sm:px-6">
              <span className="text-center">Rank</span>
              <span>Player</span>
              <span>Club</span>
              <span className="text-right">TTR</span>
            </div>

            <div className="divide-y divide-slate-300">

              {rankings.map((player, index) => (

                <Link
                  key={player.id}
                  to={`/players/${player.id}`}
                  className="grid grid-cols-[4rem_minmax(0,1fr)_minmax(0,0.8fr)_4.5rem] items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50 sm:grid-cols-[5rem_minmax(0,1fr)_minmax(0,0.8fr)_4.5rem] sm:gap-4 sm:px-6"
                >

                  <span
                    className={`flex h-8 w-8 justify-self-center items-center justify-center rounded-full text-sm font-bold ${
                      index === 0
                        ? "bg-amber-100 text-amber-700"
                        : index === 1
                          ? "bg-slate-200 text-slate-700"
                          : index === 2
                            ? "bg-orange-100 text-orange-700"
                            : "bg-slate-100 text-slate-500"
                    }`}
                    aria-label={`Rank ${index + 1}`}
                  >
                    {index + 1}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {player.firstName} {player.lastName}
                    </p>
                  </div>

                  <p className="truncate text-sm text-slate-600">
                    {club.name}
                  </p>

                  <div className="text-right">
                    <p className="text-lg font-black tabular-nums text-slate-950">
                      {player.rating}
                    </p>
                  </div>

                </Link>

              ))}

            </div>

          </div>

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
