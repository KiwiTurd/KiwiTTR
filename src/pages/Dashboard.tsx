import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";

import {
  ArrowRight,
  Building2,
  CalendarDays,
  ClipboardPen,
  Medal,
  Settings,
  ShieldCheck,
  Trophy,
  User,
  Users,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useTournament } from "../context/TournamentContext";
import useRole from "../hooks/useRole";

import TopRatedPlayersCard from "../components/dashboard/TopRatedPlayersCard";
import FullLogo from "../assets/KIWITTR - Logo Full.svg?react";
import LoadingScreen from "../components/shared/LoadingScreen";

import type { Club } from "../types/club";
import type { Player } from "../types/player";

import {
  getDashboardData,
} from "../services/supabase/dashboardService";
import {
  getClub,
} from "../services/supabase/clubService";
import {
  getPlayer,
  getPlayers,
} from "../services/supabase/playerService";

type DashboardData = Awaited<
  ReturnType<typeof getDashboardData>
>;

type MemberDashboardData = {
  player: Player | null;
  club: Club | null;
  clubPlayers: Player[];
};

function getPlayerName(player: Player) {
  return `${player.firstName} ${player.lastName}`.trim();
}

export default function Dashboard() {

  const { session, loading } = useAuth();
  const { savedTournaments } =
    useTournament();

  const {
    isAdmin,
    isClubLeader,
    isPlayer,
    playerId,
    clubId: userClubId,
  } = useRole();

  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [
    memberDashboard,
    setMemberDashboard,
  ] = useState<MemberDashboardData>({
    player: null,
    club: null,
    clubPlayers: [],
  });

  const loadData = useCallback(async () => {
    if (!session) {
      return;
    }

    try {
      if (isAdmin) {
        const data =
          await getDashboardData();

        setDashboard(data);
        return;
      }

      const linkedPlayer =
        playerId
          ? await getPlayer(playerId)
          : null;

      const selectedClubId =
        userClubId ?? linkedPlayer?.clubId ?? null;

      const [
        club,
        players,
      ] = await Promise.all([
        selectedClubId
          ? getClub(selectedClubId)
          : Promise.resolve(null),
        getPlayers(),
      ]);

      const clubPlayers = players
        .filter((player) =>
          selectedClubId
            ? player.clubId === selectedClubId
            : false
        )
        .sort(
          (a, b) => b.rating - a.rating
        );

      setMemberDashboard({
        player: linkedPlayer,
        club,
        clubPlayers,
      });
    } catch (error) {
      console.error(error);
    }
  }, [
    isAdmin,
    playerId,
    session,
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

  const activePlayers =
    dashboard?.activePlayers ?? 0;

  const clubs =
    dashboard?.clubs.length ?? 0;

  const events =
    dashboard?.totalEvents ?? 0;

  const {
    player,
    club,
    clubPlayers,
  } = memberDashboard;

  const topClubPlayers = useMemo(() => {
    return clubPlayers.slice(0, 5);
  }, [clubPlayers]);

  const clubRank = useMemo(() => {
    if (!player) {
      return null;
    }

    const index =
      clubPlayers.findIndex(
        (clubPlayer) =>
          clubPlayer.id === player.id
      );

    return index >= 0
      ? index + 1
      : null;
  }, [
    clubPlayers,
    player,
  ]);

  const winRate = useMemo(() => {
    if (!player?.matchesPlayed) {
      return null;
    }

    return Math.round(
      (player.wins / player.matchesPlayed) * 100
    );
  }, [player]);

  const isMemberDashboard =
    !isAdmin &&
    (isClubLeader || isPlayer);

  const upcomingTournaments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return savedTournaments
      .filter((tournament) => {
        const date = new Date(
          tournament.settings.date
        );
        date.setHours(0, 0, 0, 0);
        return date >= today;
      })
      .sort(
        (a, b) =>
          new Date(a.settings.date).getTime() -
          new Date(b.settings.date).getTime()
      )
      .slice(0, 5);
  }, [savedTournaments]);

  if (loading) {
    return <LoadingScreen label="Loading dashboard..." />;
  }

  if (!session) {
    return <SignedOutDashboard />;
  }

  if (isAdmin) {
    return (

      <div className="mx-auto max-w-7xl space-y-10">

        <div>

          <h1 className="mt-2 text-5xl font-normal tracking-tight text-slate-900">

            Dashboard

          </h1>

          <p className="mt-3 text-lg text-slate-500">

            Welcome back. Here's what's happening today.

          </p>

        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

            <div className="flex items-center justify-between">

              <Users className="h-5 w-5 text-blue-700" />

              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">

                Players

              </span>

            </div>

            <h2 className="mt-3 text-3xl font-black">

              {activePlayers}

            </h2>

            <p className="mt-1 text-sm text-slate-500">

              Active Players

            </p>

          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

            <div className="flex items-center justify-between">

              <Building2 className="h-5 w-5 text-indigo-600" />

              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">

                Clubs

              </span>

            </div>

            <h2 className="mt-3 text-3xl font-black">

              {clubs}

            </h2>

            <p className="mt-1 text-sm text-slate-500">

              Registered Clubs

            </p>

          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

            <div className="flex items-center justify-between">

              <CalendarDays className="h-5 w-5 text-emerald-600" />

              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">

                Events

              </span>

            </div>

            <h2 className="mt-3 text-3xl font-black">

              {events}

            </h2>

            <p className="mt-1 text-sm text-slate-500">

              Total Events

            </p>

          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

            <div className="flex items-center justify-between">

              <ShieldCheck className="h-5 w-5 text-green-600" />

              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">

                Status

              </span>

            </div>

            <h2 className="mt-3 text-xl font-bold">

              {loading
                ? "Checking..."
                : session
                  ? "Online"
                  : "Offline"}

            </h2>

            <p className="mt-1 truncate text-sm text-slate-500">

              {session?.user.email ?? "Not signed in"}

            </p>

          </div>

        </div>

        <div className="grid gap-6 lg:grid-cols-2">

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b px-5 py-4">

            <div className="flex items-center gap-3">

              <Trophy className="h-5 w-5 text-amber-500" />

              <h2 className="text-lg font-bold">

                Top Rated Players

              </h2>

            </div>

          </div>

            <TopRatedPlayersCard />

        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b px-5 py-4">

            <div className="flex items-center gap-3">

              <CalendarDays className="h-5 w-5 text-emerald-600" />

              <h2 className="text-lg font-bold">

                Upcoming Tournaments

              </h2>

            </div>

            <Link
              to="/tournaments"
              className="text-sm font-semibold text-blue-800 hover:text-blue-600"
            >
              View all
            </Link>

          </div>

          <div className="divide-y">

            {upcomingTournaments.length === 0 ? (
              <p className="px-5 py-4 text-sm text-slate-500">
                No upcoming tournaments.
              </p>
            ) : (
              upcomingTournaments.map((tournament) => (
                <Link
                  key={tournament.id}
                  to={`/tournaments/${tournament.id}/viewer`}
                  className="flex items-center justify-between gap-4 px-5 py-3 transition hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {tournament.settings.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(
                        tournament.settings.date
                      ).toLocaleDateString()}
                      {" "}·{" "}
                      {tournament.settings.playerLimitEnabled
                        ? `${tournament.settings.playerCount} players`
                        : `${tournament.players.length} players signed up`}
                    </p>
                  </div>

                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                </Link>
              ))
            )}

          </div>

        </div>

        </div>

        <QuickActions
          isAdmin
          isClubLeader={false}
          isPlayer={false}
        />

      </div>

    );
  }

  if (!isMemberDashboard) {
    return (
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="mt-2 text-5xl font-normal tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="mt-3 text-lg text-slate-500">
            Sign in with a linked player account to view your dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (

    <div className="mx-auto max-w-7xl space-y-10">

      <div>

        <h1 className="mt-2 text-5xl font-normal tracking-tight text-slate-900">

          Dashboard

        </h1>

        <p className="mt-3 text-lg text-slate-500">

          Your player snapshot and club activity.

        </p>

      </div>

      {!player && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          Your account is not linked to a player profile yet. Link a player profile to show personal rating, rank and match stats here.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        <StatCard
          icon={<User className="h-8 w-8 text-blue-700" />}
          label="Rating"
          value={
            player
              ? player.rating
              : "-"
          }
          caption="Current TTR rating"
        />

        <StatCard
          icon={<Medal className="h-8 w-8 text-amber-500" />}
          label="Club Rank"
          value={
            clubRank
              ? `#${clubRank}`
              : "-"
          }
          caption={
            club
              ? `Within ${club.shortName || club.name}`
              : "No club assigned"
          }
        />

        <StatCard
          icon={<Trophy className="h-8 w-8 text-green-600" />}
          label="Record"
          value={
            player
              ? `${player.wins}-${player.losses}`
              : "-"
          }
          caption={
            winRate !== null
              ? `${winRate}% win rate`
              : "No match record yet"
          }
        />

        <StatCard
          icon={<Users className="h-8 w-8 text-indigo-600" />}
          label="Club Players"
          value={clubPlayers.length}
          caption="Active club roster"
        />

      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b px-8 py-5">

            <div className="flex items-center gap-3">

              <Trophy className="h-6 w-6 text-amber-500" />

              <h2 className="text-2xl font-bold">

                Club Top 5

              </h2>

            </div>

            <Link
              to="/rankings"
              className="text-sm font-semibold text-blue-800 hover:text-blue-600"
            >
              View Rankings
            </Link>

          </div>

          <div className="divide-y">

            {topClubPlayers.length === 0 ? (
              <p className="p-8 text-slate-500">
                No ranked players found for this club.
              </p>
            ) : (
              topClubPlayers.map((clubPlayer, index) => (
                <Link
                  key={clubPlayer.id}
                  to={`/players/${clubPlayer.id}`}
                  className="flex items-center gap-4 px-8 py-4 transition hover:bg-slate-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-900">
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {getPlayerName(clubPlayer)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {clubPlayer.matchesPlayed} matches
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-black">
                      {clubPlayer.rating}
                    </p>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      TTR
                    </p>
                  </div>
                </Link>
              ))
            )}

          </div>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

          <div className="flex items-center gap-3">

            <Building2 className="h-6 w-6 text-indigo-600" />

            <h2 className="text-2xl font-bold">

              Club Info

            </h2>

          </div>

          {club ? (
            <div className="mt-6 space-y-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Club
                </p>
                <p className="mt-1 text-2xl font-black">
                  {club.name}
                </p>
              </div>

              <InfoRow
                label="Email"
                value={club.email || "-"}
              />

              <InfoRow
                label="Phone"
                value={club.phone || "-"}
              />

              <InfoRow
                label="Address"
                value={club.address || "-"}
              />

              <Link
                to={`/clubs/${club.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-4 py-3 font-semibold text-white transition hover:bg-blue-800"
              >
                View Club
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <p className="mt-6 text-slate-500">
              No club is assigned to this account yet.
            </p>
          )}

        </div>

      </div>

      <QuickActions
        isAdmin={false}
        isClubLeader={isClubLeader}
        isPlayer={isPlayer}
      />

    </div>

  );

}

function StatCard({
  icon,
  label,
  value,
  caption,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  caption: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </span>
      </div>
      <h2 className="mt-6 text-4xl font-black">
        {value}
      </h2>
      <p className="mt-2 text-slate-500">
        {caption}
      </p>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-slate-700">
        {value}
      </p>
    </div>
  );
}

function QuickActions({
  isAdmin,
  isClubLeader,
  isPlayer,
}: {
  isAdmin: boolean;
  isClubLeader: boolean;
  isPlayer: boolean;
}) {
  const actions = [
    ...(isAdmin
      ? [
          {
            to: "/players",
            icon: <Users className="h-5 w-5 text-blue-700" />,
            title: "Manage Players",
          },
          {
            to: "/clubs",
            icon: <Building2 className="h-5 w-5 text-indigo-600" />,
            title: "Manage Clubs",
          },
          {
            to: "/events",
            icon: <CalendarDays className="h-5 w-5 text-emerald-600" />,
            title: "Events",
          },
          {
            to: "/tournaments",
            icon: <Trophy className="h-5 w-5 text-amber-500" />,
            title: "Tournaments",
          },
          {
            to: "/settings/users",
            icon: <ShieldCheck className="h-5 w-5 text-green-600" />,
            title: "User Access",
          },
          {
            to: "/matches",
            icon: <ClipboardPen className="h-5 w-5 text-blue-700" />,
            title: "Record Match",
          },
        ]
      : []),
    ...(!isAdmin && isClubLeader
      ? [
          {
            to: "/tournaments/new",
            icon: <Trophy className="h-5 w-5 text-amber-500" />,
            title: "New Tournament",
          },
          {
            to: "/tournaments",
            icon: <Trophy className="h-5 w-5 text-blue-700" />,
            title: "Tournaments",
          },
          {
            to: "/events",
            icon: <CalendarDays className="h-5 w-5 text-emerald-600" />,
            title: "Events",
          },
          {
            to: "/players",
            icon: <Users className="h-5 w-5 text-blue-700" />,
            title: "Club Players",
          },
          {
            to: "/settings/club",
            icon: <Settings className="h-5 w-5 text-slate-600" />,
            title: "Club Settings",
          },
        ]
      : []),
    ...(isPlayer
      ? [
          {
            to: "/events",
            icon: <CalendarDays className="h-5 w-5 text-emerald-600" />,
            title: "Events",
          },
          {
            to: "/my-profile",
            icon: <User className="h-5 w-5 text-blue-700" />,
            title: "My Profile",
          },
        ]
      : []),
    {
      to: "/rankings",
      icon: <Medal className="h-5 w-5 text-amber-500" />,
      title: "Rankings",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-bold">
        Quick Actions
      </h2>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="group flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-blue-300 hover:bg-blue-50"
          >
            <div className="flex min-w-0 items-center gap-3">
              {action.icon}
              <span className="truncate font-semibold">
                {action.title}
              </span>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-700" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function SignedOutDashboard() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-4xl flex-col items-center justify-center px-4 text-center">
      <FullLogo className="h-20 w-auto" />

      <h1 className="mt-8 text-4xl font-normal tracking-tight text-slate-950 md:text-5xl">
        Welcome to KiwiTTR
      </h1>

      <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
        A modern table tennis platform for ratings, clubs,
        events, tournaments and player progress.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/login"
          className="rounded-xl bg-blue-900 px-5 py-3 font-semibold text-white transition hover:bg-blue-800"
        >
          Sign In
        </Link>

        <Link
          to="/register"
          className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-50"
        >
          Create Account
        </Link>
      </div>

      <section className="mt-10 max-w-3xl rounded-2xl border border-slate-200 bg-white px-6 py-5 text-left shadow-sm">
        <h2 className="text-lg font-bold text-slate-950">
          About KiwiTTR
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          KiwiTTR is inspired by the German TTR rating system,
          bringing structured, transparent table tennis ratings
          into a broader club and competition platform. The goal is
          to create the ultimate table tennis hub: rankings that
          feel meaningful, tournaments that are easy to run, and
          profiles that make every match part of a player story.
        </p>
      </section>
    </div>
  );
}
