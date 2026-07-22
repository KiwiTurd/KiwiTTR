import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
import SlateImagePageHeader from "../components/shared/SlateImagePageHeader";
import UpcomingTournamentAccordion from "../components/tournaments/UpcomingTournamentAccordion";

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

        <SlateImagePageHeader
          pageKey="dashboard"
          title="Dashboard"
          subtitle="Welcome back. Here's what's happening today."
        />

        <ScrollableCardRow
          itemCount={4}
          desktopGridClassName="sm:grid-cols-2 xl:grid-cols-4"
          desktopStatStyle
        >
          <StatCard
            icon={<Users className="h-10 w-10 text-blue-700 sm:h-8 sm:w-8" />}
            label="Players"
            value={activePlayers}
            caption="Active Players"
          />
          <StatCard
            icon={<Building2 className="h-10 w-10 text-indigo-600 sm:h-8 sm:w-8" />}
            label="Clubs"
            value={clubs}
            caption="Registered Clubs"
          />
          <StatCard
            icon={<CalendarDays className="h-10 w-10 text-emerald-600 sm:h-8 sm:w-8" />}
            label="Events"
            value={events}
            caption="Total Events"
          />
          <StatCard
            icon={<ShieldCheck className="h-10 w-10 text-green-600 sm:h-8 sm:w-8" />}
            label="Status"
            value={loading ? "Checking..." : session ? "Online" : "Offline"}
            caption={session?.user.email ?? "Not signed in"}
          />
        </ScrollableCardRow>

        <div className="md:hidden">
          <QuickActions
            isAdmin
            isClubLeader={false}
            isPlayer={false}
          />
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
              <UpcomingTournamentAccordion
                tournaments={upcomingTournaments}
                clubNameFor={(tournamentClubId) =>
                  dashboard?.clubs.find(
                    (dashboardClub) => dashboardClub.id === tournamentClubId
                  )?.name ??
                  (club?.id === tournamentClubId ? club.name : undefined)
                }
              />
            )}

          </div>

        </div>

        </div>

        <div className="hidden md:block">
          <QuickActions
            isAdmin
            isClubLeader={false}
            isPlayer={false}
          />
        </div>

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

      <SlateImagePageHeader
        pageKey="dashboard"
        title="Dashboard"
        subtitle="Your player snapshot and club activity."
      />

      {!player && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          Your account is not linked to a player profile yet. Link a player profile to show personal rating, rank and match stats here.
        </div>
      )}

      <ScrollableCardRow
        itemCount={4}
        desktopGridClassName="sm:grid-cols-2 xl:grid-cols-4"
        desktopStatStyle
      >

        <StatCard
          icon={<User className="h-10 w-10 text-blue-700 sm:h-8 sm:w-8" />}
          label="Current Rating"
          value={
            player
              ? player.rating
              : "-"
          }
          caption="Current TTR rating"
        />

        <StatCard
          icon={<Medal className="h-10 w-10 text-amber-500 sm:h-8 sm:w-8" />}
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
          icon={<Trophy className="h-10 w-10 text-green-600 sm:h-8 sm:w-8" />}
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
          icon={<Users className="h-10 w-10 text-indigo-600 sm:h-8 sm:w-8" />}
          label="Club Players"
          value={clubPlayers.length}
          caption="Active club roster"
        />

      </ScrollableCardRow>

      <div className="md:hidden">
        <QuickActions
          isAdmin={false}
          isClubLeader={isClubLeader}
          isPlayer={isPlayer}
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

      <div className="hidden md:block">
        <QuickActions
          isAdmin={false}
          isClubLeader={isClubLeader}
          isPlayer={isPlayer}
        />
      </div>

    </div>

  );

}

function ScrollableCardRow({
  children,
  itemCount,
  desktopGridClassName,
  desktopStatStyle = false,
}: {
  children: React.ReactNode;
  itemCount: number;
  desktopGridClassName: string;
  desktopStatStyle?: boolean;
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [indicator, setIndicator] = useState({
    left: 0,
    width: 100,
    visible: false,
  });

  const updateIndicator = useCallback(() => {
    const row = rowRef.current;

    if (!row) {
      return;
    }

    const maxScroll = row.scrollWidth - row.clientWidth;
    const width = Math.min(
      100,
      Math.max(20, (row.clientWidth / row.scrollWidth) * 100)
    );
    const left = maxScroll > 0
      ? (row.scrollLeft / maxScroll) * (100 - width)
      : 0;

    setIndicator({
      left,
      width,
      visible: maxScroll > 1,
    });
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(updateIndicator);
    window.addEventListener("resize", updateIndicator);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [itemCount, updateIndicator]);

  return (
    <div>
      <div
        ref={rowRef}
        onScroll={updateIndicator}
        className={`flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:overflow-visible ${
          desktopStatStyle
            ? "sm:gap-0 sm:border-y sm:border-slate-200 sm:py-10 sm:[&>*]:border-r sm:[&>*]:border-slate-200 sm:[&>*:nth-child(2n)]:border-r-0 xl:[&>*:nth-child(2n)]:border-r xl:[&>*:last-child]:border-r-0"
            : "sm:pb-0"
        } ${desktopGridClassName}`}
      >
        {children}
      </div>

      <div
        aria-hidden="true"
        className={`relative mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 transition-opacity sm:hidden ${
          indicator.visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className="absolute inset-y-0 rounded-full bg-blue-800 transition-[left] duration-100"
          style={{
            left: `${indicator.left}%`,
            width: `${indicator.width}%`,
          }}
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  caption: string;
}) {
  return (
    <div className="flex aspect-square w-36 shrink-0 snap-start flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm sm:aspect-auto sm:w-auto sm:flex-row sm:gap-4 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-6 sm:py-0 sm:text-left sm:shadow-none sm:[&>svg]:h-9 sm:[&>svg]:w-9">
      {icon}
      <div>
        <span className="text-sm font-semibold text-slate-500 sm:text-xs sm:uppercase sm:tracking-wide">
          {label}
        </span>
        <h2 className="mt-1 text-3xl font-bold">
          {value}
        </h2>
      </div>
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
            icon: <Users className="h-10 w-10 text-blue-700 sm:h-5 sm:w-5" />,
            title: "Manage Players",
          },
          {
            to: "/clubs",
            icon: <Building2 className="h-10 w-10 text-indigo-600 sm:h-5 sm:w-5" />,
            title: "Manage Clubs",
          },
          {
            to: "/events",
            icon: <CalendarDays className="h-10 w-10 text-emerald-600 sm:h-5 sm:w-5" />,
            title: "Events",
          },
          {
            to: "/tournaments",
            icon: <Trophy className="h-10 w-10 text-amber-500 sm:h-5 sm:w-5" />,
            title: "Tournaments",
          },
          {
            to: "/settings/users",
            icon: <ShieldCheck className="h-10 w-10 text-green-600 sm:h-5 sm:w-5" />,
            title: "User Access",
          },
          {
            to: "/matches",
            icon: <ClipboardPen className="h-10 w-10 text-blue-700 sm:h-5 sm:w-5" />,
            title: "Match Input",
          },
        ]
      : []),
    ...(!isAdmin && isClubLeader
      ? [
          {
            to: "/tournaments/new",
            icon: <Trophy className="h-10 w-10 text-amber-500 sm:h-5 sm:w-5" />,
            title: "New Tournament",
          },
          {
            to: "/tournaments",
            icon: <Trophy className="h-10 w-10 text-blue-700 sm:h-5 sm:w-5" />,
            title: "Tournaments",
          },
          {
            to: "/events",
            icon: <CalendarDays className="h-10 w-10 text-emerald-600 sm:h-5 sm:w-5" />,
            title: "Events",
          },
          {
            to: "/players",
            icon: <Users className="h-10 w-10 text-blue-700 sm:h-5 sm:w-5" />,
            title: "Club Players",
          },
          {
            to: "/settings/club",
            icon: <Settings className="h-10 w-10 text-slate-600 sm:h-5 sm:w-5" />,
            title: "Club Settings",
          },
        ]
      : []),
    ...(isPlayer
      ? [
          {
            to: "/events",
            icon: <CalendarDays className="h-10 w-10 text-emerald-600 sm:h-5 sm:w-5" />,
            title: "Events",
          },
          {
            to: "/my-profile",
            icon: <User className="h-10 w-10 text-blue-700 sm:h-5 sm:w-5" />,
            title: "My Profile",
          },
        ]
      : []),
    {
      to: "/rankings",
      icon: <Medal className="h-10 w-10 text-amber-500 sm:h-5 sm:w-5" />,
      title: "Rankings",
    },
  ];

  return (
    <section>
      <h2 className="mb-4 text-base font-bold sm:mb-5 sm:text-xl">
        Quick Actions
      </h2>

      <ScrollableCardRow
        itemCount={actions.length}
        desktopGridClassName="sm:grid-cols-2 sm:gap-3 lg:grid-cols-3"
      >
        {actions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="group flex aspect-square w-[calc((100%_-_1.5rem)/3)] min-w-0 shrink-0 snap-start flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 text-center shadow-sm transition hover:border-blue-300 hover:bg-blue-50 sm:aspect-auto sm:w-auto sm:flex-row sm:gap-4 sm:overflow-visible sm:px-4 sm:py-3 sm:text-left"
          >
            <div className="flex min-w-0 max-w-full flex-col items-center gap-1.5 [&>svg]:h-6 [&>svg]:w-6 sm:flex-row sm:gap-3 sm:[&>svg]:h-5 sm:[&>svg]:w-5">
              {action.icon}
              <span className="max-w-full break-words text-xs font-bold leading-tight sm:truncate sm:text-base sm:leading-normal">
                {action.title}
              </span>
            </div>
          </Link>
        ))}
      </ScrollableCardRow>
    </section>
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
