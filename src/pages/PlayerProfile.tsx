import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  Mail,
  Pencil,
  Phone,
  Trophy,
  TrendingUp,
  Users,
} from "lucide-react";

import type { Player } from "../types/player";
import type { Club } from "../types/club";
import type { Match } from "../types/match";
import type { Event } from "../types/event";

import {
  getPlayer,
  getPlayers,
  updateOwnPlayerContact,
} from "../services/supabase/playerService";

import {
  getClubs,
} from "../services/supabase/clubService";

import {
  getPlayerMatches,
} from "../services/supabase/matchService";

import {
  getEvents,
} from "../services/supabase/eventService";

import RatingGraph from "../components/player/RatingGraph";
import RecentMatchCard from "../components/player/RecentMatchCard";
import LoadingScreen from "../components/shared/LoadingScreen";

import { notify } from "../services/notificationService";
import useRole from "../hooks/useRole";
import { useTournament } from "../context/TournamentContext";
import { useSidebar } from "../context/SidebarContext";
import { getTeamGames } from "../services/teams/teamGameService";
import PlayerAvatar from "../components/shared/PlayerAvatar";
import PlayerAvatarUploader from "../components/player/PlayerAvatarUploader";

function ProfileStatRow({
  children,
  itemCount,
}: {
  children: React.ReactNode;
  itemCount: number;
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
    <div className="border-b border-slate-200 pb-8">
      <div
        ref={rowRef}
        onScroll={updateIndicator}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] sm:overflow-visible sm:pb-0"
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

export default function PlayerProfile() {

  const { id } = useParams();
  const navigate = useNavigate();
  const { collapsed, navigationLayout } = useSidebar();
  const profileHeaderWidthClassName = navigationLayout === "sidebar"
    ? collapsed
      ? "md:w-[calc(100dvw-5rem)]"
      : "md:w-[calc(100dvw-18rem)]"
    : "md:w-dvw";
  const { savedTournaments } =
    useTournament();

  const {
    profileId,
    playerId: linkedPlayerId,
    clubId: userClubId,
    isAdmin,
  } = useRole();

  const [player, setPlayer] =
    useState<Player | null>(null);

  const [players, setPlayers] =
    useState<Player[]>([]);

  const [club, setClub] =
    useState<Club | null>(null);

  const [matches, setMatches] =
    useState<Match[]>([]);

  const [events, setEvents] =
    useState<Event[]>([]);

  const [teamGames, setTeamGames] =
    useState<
      Awaited<ReturnType<typeof getTeamGames>>
    >([]);

  const [loading, setLoading] =
    useState(true);

  const [editing, setEditing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [
    recentMatchPage,
    setRecentMatchPage,
  ] = useState(0);

  const [editMobile, setEditMobile] =
    useState("");

  const [editEmail, setEditEmail] =
    useState("");

  const loadData = useCallback(async () => {

    if (!id) return;

    try {

      setLoading(true);
      setRecentMatchPage(0);

      const [

        playerData,
        playerList,
        clubList,
        matchList,
        eventList,
        teamGameList,

      ] = await Promise.all([

        getPlayer(id),
        getPlayers(),
        getClubs(),
        getPlayerMatches(id),
        getEvents(),
        getTeamGames(),

      ]);

      if (!playerData) {

        setPlayer(null);

        return;

      }

      setPlayer(playerData);

      setPlayers(playerList);

      setClub(

        clubList.find(

          c => c.id === playerData.clubId

        ) ?? null

      );

      setMatches(matchList);

      setEvents(eventList);

      setTeamGames(teamGameList);

    }

    catch (error) {

      console.error(error);

      notify.fault("Unable to load player.");

    }

    finally {

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

  const winPercentage = useMemo(() => {

    if (!player) return 0;

    if (player.matchesPlayed === 0) {

      return 0;

    }

    return (

      (player.wins / player.matchesPlayed) * 100

    ).toFixed(1);

  }, [player]);

  const isOwnPlayer =
    Boolean(player && profileId) &&
    (
      player?.profileId === profileId ||
      player?.id === linkedPlayerId
    );

  const canViewContact =
    Boolean(player) &&
    (
      isAdmin ||
      isOwnPlayer ||
      (
        Boolean(userClubId) &&
        userClubId === player?.clubId
      )
    );

  const canViewMobile =
    Boolean(player) &&
    (
      isAdmin ||
      isOwnPlayer ||
      (
        canViewContact &&
        Boolean(player?.mobilePublicToClub)
      )
    );

  const canViewEmail =
    Boolean(player) &&
    (
      isAdmin ||
      isOwnPlayer ||
      (
        canViewContact &&
        Boolean(player?.emailPublicToClub)
      )
    );

  const clubTopPlayers = useMemo(() => {
    if (!player) {
      return [];
    }

    return players
      .filter(
        (item) =>
          item.clubId === player.clubId &&
          item.isActive
      )
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);
  }, [players, player]);

  const clubRank = useMemo(() => {
    if (!player) {
      return "-";
    }

    const clubPlayers = players
      .filter(
        (item) =>
          item.clubId === player.clubId &&
          item.isActive
      )
      .sort((a, b) => b.rating - a.rating);

    const rank =
      clubPlayers.findIndex(
        (item) => item.id === player.id
      ) + 1;

    return rank > 0
      ? `#${rank}`
      : "-";
  }, [players, player]);

  const nationalRank = useMemo(() => {
    if (!player || !player.isActive) {
      return "-";
    }

    const rank = players
      .filter((item) => item.isActive)
      .sort((a, b) => b.rating - a.rating)
      .findIndex((item) => item.id === player.id) + 1;

    return rank > 0
      ? `#${rank}`
      : "-";
  }, [players, player]);

  const linkedPlayer = useMemo(() => {
    if (!linkedPlayerId) {
      return null;
    }

    return players.find(
      (item) => item.id === linkedPlayerId
    ) ?? null;
  }, [
    linkedPlayerId,
    players,
  ]);

  const headToHead = useMemo(() => {
    if (
      !player ||
      !linkedPlayerId ||
      player.id === linkedPlayerId
    ) {
      return null;
    }

    const sharedMatches = matches.filter(
      (match) =>
        (
          match.player1Id === player.id &&
          match.player2Id === linkedPlayerId
        ) ||
        (
          match.player2Id === player.id &&
          match.player1Id === linkedPlayerId
        )
    );

    if (sharedMatches.length === 0) {
      return {
        played: 0,
        linkedWins: 0,
        viewedWins: 0,
      };
    }

    return {
      played: sharedMatches.length,
      linkedWins: sharedMatches.filter(
        (match) =>
          match.winnerId === linkedPlayerId
      ).length,
      viewedWins: sharedMatches.filter(
        (match) =>
          match.winnerId === player.id
      ).length,
    };
  }, [
    linkedPlayerId,
    matches,
    player,
  ]);

  const showHeadToHead =
    Boolean(headToHead && linkedPlayer);

  const recentMatchPageSize = 5;
  const recentMatchPageCount = Math.max(
    1,
    Math.ceil(
      matches.length / recentMatchPageSize
    )
  );
  const recentMatchStart =
    (recentMatchPage % recentMatchPageCount) *
    recentMatchPageSize;
  const visibleRecentMatches = matches.slice(
    recentMatchStart,
    recentMatchStart + recentMatchPageSize
  );
  const recentMatchEnd = Math.min(
    recentMatchStart + recentMatchPageSize,
    matches.length
  );

  function cycleRecentMatches() {
    setRecentMatchPage(
      (page) => (page + 1) % recentMatchPageCount
    );
  }

  function openEdit() {
    if (!player || !isOwnPlayer) {
      return;
    }

    setEditMobile(player.mobile);
    setEditEmail(player.email);
    setEditing(true);
  }

  function closeEdit() {
    setEditing(false);
    setEditMobile("");
    setEditEmail("");
  }

  function handleAvatarUploaded(avatarUrl: string) {
    if (!player) {
      return;
    }

    setPlayer(current => current ? { ...current, avatarUrl } : current);
    setPlayers(current => current.map(item =>
      item.id === player.id ? { ...item, avatarUrl } : item
    ));
  }

  async function handleSave() {
    if (!player || !isOwnPlayer) {
      notify.fault(
        "You can only edit your own linked player profile."
      );
      return;
    }

    setSaving(true);

    try {
      const updatedPlayer: Player = {
        ...player,
        mobile: editMobile.trim(),
        email: editEmail.trim(),
      };

      await updateOwnPlayerContact({
        mobile: updatedPlayer.mobile,
        email: updatedPlayer.email,
        mobilePublicToClub: updatedPlayer.mobilePublicToClub,
        emailPublicToClub: updatedPlayer.emailPublicToClub,
      });
      setPlayer(updatedPlayer);
      setPlayers((current) =>
        current.map((item) =>
          item.id === updatedPlayer.id
            ? updatedPlayer
            : item
        )
      );

      notify.playerUpdated(
        `${updatedPlayer.firstName} ${updatedPlayer.lastName}`
      );

      closeEdit();
    } catch (error) {
      console.error(error);
      notify.fault("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingScreen label="Loading player..." />;
  }

  if (!player) {

    return (

      <div className="max-w-7xl mx-auto space-y-8">

        <h1 className="text-5xl font-normal">

          Player Not Found

        </h1>

        <Link
          to="/rankings"
          className="
            inline-flex
            items-center
            gap-2

            text-slate-500

            hover:text-blue-700
          "
        >

          <ArrowLeft className="w-4 h-4" />

          Back to Rankings

        </Link>

      </div>

    );

  }
return (

  <div className="mx-auto max-w-7xl space-y-8">

    <section className={`relative left-1/2 -mt-4 w-dvw -translate-x-1/2 bg-gradient-to-b from-slate-200 to-slate-100 py-5 md:-mt-8 md:py-10 ${profileHeaderWidthClassName}`}>

    <div className="mx-auto w-full max-w-7xl px-4 md:px-8">

    <div className="flex items-center justify-between gap-4">

      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 rounded-xl border border-white bg-white px-4 py-2.5 font-semibold text-slate-950 shadow-sm transition duration-200 hover:scale-105 hover:bg-slate-50 focus-visible:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 active:scale-95"
      >

        <ArrowLeft className="h-4 w-4" />

        Back

      </button>

      {isOwnPlayer && (
        <button
          type="button"
          onClick={openEdit}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-900"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </button>
      )}

    </div>

    {/* Hero */}

    <div className="mt-5 md:mt-8">

      <div>

        <div className="flex items-center justify-between gap-3 md:gap-5">

          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-[30px]">

            <PlayerAvatar
              firstName={player.firstName}
              lastName={player.lastName}
              imageUrl={player.avatarUrl}
              size="profileResponsive"
            />

            <div className="player-profile-header min-w-0">

              <h1 className="truncate text-2xl font-normal tracking-tight sm:text-4xl">

                {player.firstName} {player.lastName}

              </h1>

              <div
                data-mobile-subheading-always-visible="true"
                className="mt-1 flex min-w-0 items-center gap-2 truncate text-sm text-slate-500 sm:mt-2 sm:text-base"
              >

                <Building2 className="hidden h-4 w-4 sm:block" />

                {club?.name ?? "No Club"}

              </div>

              <div className="mt-3 hidden flex-wrap gap-2 sm:flex">

                <div
                  className={`
                    inline-flex
                    items-center
                    gap-2

                    text-sm
                    font-semibold

                    ${
                      player.isActive
                        ? "text-green-700"
                        : "text-red-700"
                    }
                  `}
                >

                  <BadgeCheck className="h-4 w-4" />

                  {player.isActive
                    ? "Active"
                    : "Inactive"}

                </div>

              </div>

            </div>

          </div>

          <div className="grid shrink-0 grid-cols-1 items-center text-right sm:grid-cols-2 xl:min-w-52">

            <div className="border-b border-slate-300 pb-1.5 sm:border-b-0 sm:border-r sm:border-slate-200 sm:pb-0 sm:pr-5">

              <p className="text-[11px] leading-tight text-slate-500 sm:text-sm">

                NZ Ranking

              </p>

              <h2 className="text-2xl font-bold leading-tight tracking-tight sm:text-4xl">

                {nationalRank}

              </h2>

            </div>

            <div className="pt-1.5 sm:pl-5 sm:pt-0">

            <p className="text-[11px] leading-tight text-slate-500 sm:text-sm">

              Current Rating

            </p>

            <h2 className="text-2xl font-bold leading-tight tracking-tight sm:text-4xl">

              {player.rating}

            </h2>

            </div>

          </div>

        </div>

      </div>

    </div>

    </div>

    </section>

    {/* Contact */}

    <section className="border-b border-slate-200 pb-5 md:pb-8">

      <div className="flex items-center gap-4 overflow-x-auto whitespace-nowrap">

        <div className="flex shrink-0 items-center gap-2 md:gap-3">

          <Phone className="h-5 w-5 text-blue-700" />

          <h2 className="text-lg font-bold">
            Contact
          </h2>

        </div>

        {canViewMobile || canViewEmail ? (

          <div className="ml-auto flex shrink-0 items-center gap-4 text-sm md:gap-6">

            {canViewMobile && <div className="flex items-center gap-2">
              <span className="flex items-center gap-2 text-slate-500">
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline">Mobile</span>
              </span>
              <span className="font-semibold">
                {player.mobile || "-"}
              </span>
            </div>}

            {canViewEmail && <div className="flex items-center gap-2">
              <span className="flex items-center gap-2 text-slate-500">
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">Email</span>
              </span>
              <span className="font-semibold">
                {player.email || "-"}
              </span>
            </div>}

          </div>

        ) : (

          <div className="text-sm text-slate-500">
            This player has kept their contact details private.
          </div>

        )}

      </div>

    </section>

    {/* Stat Cards */}

    <ProfileStatRow
      itemCount={3 + (showHeadToHead && headToHead && linkedPlayer ? 1 : 0)}
    >

      <div className="flex w-36 shrink-0 snap-start items-center justify-center gap-3 border-r border-slate-200 px-4 py-1 text-left last:border-r-0 sm:w-auto">

        <TrendingUp className="h-7 w-7 shrink-0 text-blue-700" />

        <div className="min-w-0">

          <p className="text-[10px] font-semibold uppercase leading-tight tracking-wide text-slate-500 sm:text-xs sm:leading-normal">

            Current Rating

          </p>

          <h3 className="text-xl font-bold sm:text-2xl">

            {player.rating}

          </h3>

        </div>

      </div>

      <div className="flex w-36 shrink-0 snap-start items-center justify-center gap-3 border-r border-slate-200 px-4 py-1 text-left last:border-r-0 sm:w-auto">

        <Trophy className="h-7 w-7 shrink-0 text-amber-500" />

        <div className="min-w-0">

          <p className="text-[10px] font-semibold uppercase leading-tight tracking-wide text-slate-500 sm:text-xs sm:leading-normal">

            Highest Rating

          </p>

          <h3 className="text-xl font-bold sm:text-2xl">

            {player.highestRating}

          </h3>

        </div>

      </div>

      <div className="flex w-36 shrink-0 snap-start items-center justify-center gap-3 border-r border-slate-200 px-4 py-1 text-left last:border-r-0 sm:w-auto">

        <Users className="h-7 w-7 shrink-0 text-indigo-600" />

        <div className="min-w-0">

          <p className="text-[10px] font-semibold uppercase leading-tight tracking-wide text-slate-500 sm:text-xs sm:leading-normal">

            Club Rank

          </p>

          <h3 className="text-xl font-bold sm:text-2xl">

            {clubRank}

          </h3>

        </div>

      </div>

      {showHeadToHead && headToHead && linkedPlayer && (

      <div className="flex w-36 shrink-0 snap-start items-center justify-center gap-3 border-r border-slate-200 px-4 py-1 text-left last:border-r-0 sm:w-auto">

        <Users className="h-7 w-7 shrink-0 text-blue-700" />

        <div className="min-w-0">

          <p className="text-[10px] font-semibold uppercase leading-tight tracking-wide text-blue-700 sm:text-xs sm:leading-normal">

            Head to Head

          </p>

          <h3 className="text-xl font-bold sm:text-2xl">

            {headToHead.linkedWins}-{headToHead.viewedWins}

          </h3>

          <p className="truncate text-[10px] text-blue-900/70 sm:text-xs">
            You vs {player.firstName}
            {" "}· {headToHead.played} played
          </p>

        </div>

      </div>

      )}

    </ProfileStatRow>

    {/* Rating Graph */}

    <div className="kiwittr-solid-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      <div className="border-b px-8 py-5">

        <div className="flex items-center gap-3">

          <TrendingUp className="h-6 w-6 text-blue-700" />

          <h2 className="text-2xl font-bold">

            Rating History

          </h2>

        </div>

      </div>

      <div className="p-8">

        <RatingGraph
          playerId={player.id}
          currentRating={player.rating}
          initialRating={player.initialRating ?? player.rating}
          initialRatingAt={player.createdAt}
        />

      </div>

    </div>

    {/* Club Ranking and Recent Matches */}

    <div className="grid gap-6 xl:grid-cols-2">

      <div className="kiwittr-solid-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b px-6 py-4">

          <div className="flex items-center gap-3">

            <Trophy className="h-6 w-6 text-amber-500" />

            <h2 className="text-xl font-bold">
              {club?.name ?? "Club"} Top 5
            </h2>

          </div>

        </div>

        <div className="p-5">

          {clubTopPlayers.length === 0 ? (

            <p className="text-slate-500">
              No active club players yet.
            </p>

          ) : (

            <div className="divide-y divide-slate-100">

              {clubTopPlayers.map((clubPlayer, index) => (

                <Link
                  key={clubPlayer.id}
                  to={`/players/${clubPlayer.id}`}
                  className={`
                    flex
                    items-center
                    justify-between
                    gap-4
                    py-3
                    transition
                    hover:bg-slate-50
                    ${
                      clubPlayer.id === player.id
                        ? "text-blue-800"
                        : "text-slate-900"
                    }
                  `}
                >

                  <div className="flex min-w-0 items-center gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">
                      {index + 1}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {clubPlayer.firstName} {clubPlayer.lastName}
                      </p>
                      <p className="text-sm text-slate-500">
                        {clubPlayer.matchesPlayed} matches
                      </p>
                    </div>

                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {clubPlayer.rating}
                    </p>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      TTR
                    </p>
                  </div>

                </Link>

              ))}

            </div>

          )}

        </div>

      </div>

      <div className="kiwittr-solid-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b px-6 py-4">

          <div className="flex flex-wrap items-center justify-between gap-3">

            <div className="flex items-center gap-3">

              <Trophy className="h-6 w-6 text-amber-500" />

              <h2 className="text-xl font-bold">

                Recent Matches

              </h2>

            </div>

            {matches.length > recentMatchPageSize && (

              <button
                type="button"
                onClick={cycleRecentMatches}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:border-blue-200 hover:bg-blue-50"
              >
                {recentMatchStart + 1}-{recentMatchEnd} of{" "}
                {matches.length}
                <span className="inline-flex items-center gap-1">
                  Next 5
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>

            )}

          </div>

        </div>

        <div className="p-5">

          {matches.length === 0 ? (

            <div className="py-10 text-center">

              <Trophy className="mx-auto h-10 w-10 text-slate-300" />

              <p className="mt-4 text-slate-500">

                No matches have been played yet.

              </p>

            </div>

          ) : (

            <div className="space-y-4">

              {visibleRecentMatches.map((match) => {

                const opponentId =
                  match.player1Id === player.id
                    ? match.player2Id
                    : match.player1Id;

                const opponent =
                  players.find(
                    (p) => p.id === opponentId
                  );

                const event =
                  events.find(
                    (e) => e.id === match.eventId
                  );

                const tournament =
                  savedTournaments.find(
                    (item) =>
                      item.id === match.eventId
                  );

                const teamGame =
                  teamGames.find(
                    (item) =>
                      item.id === match.eventId
                  );

                const eventHref = tournament
                  ? `/tournaments/${tournament.id}/viewer`
                  : teamGame
                    ? `/team-games/${teamGame.id}/live`
                    : event
                      ? `/events/${event.id}`
                      : undefined;

                return (

                  <RecentMatchCard
                    key={match.id}
                    match={match}
                    player={player}
                    opponent={opponent}
                    event={event}
                    eventHref={eventHref}
                  />

                );

              })}

            </div>

          )}

        </div>

      </div>

    </div>

      {/* Career Statistics */}

      <div className="kiwittr-solid-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b px-8 py-5">

          <div className="flex items-center gap-3">

            <Users className="h-6 w-6 text-blue-700" />

            <h2 className="text-2xl font-bold">

              Career Statistics

            </h2>

          </div>

        </div>

        <div className="grid gap-6 p-8 md:grid-cols-2">

          <div className="space-y-5">

            <div className="flex items-center justify-between">

              <span className="text-slate-500">

                Wins

              </span>

              <span className="text-xl font-bold">

                {player.wins}

              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-slate-500">

                Losses

              </span>

              <span className="text-xl font-bold">

                {player.losses}

              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-slate-500">

                Win Percentage

              </span>

              <span className="text-xl font-bold">

                {winPercentage}%

              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-slate-500">

                Matches Played

              </span>

              <span className="text-xl font-bold">

                {player.matchesPlayed}

              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-slate-500">

                Current Rating

              </span>

              <span className="text-xl font-bold">

                {player.rating}

              </span>

            </div>

          </div>

          <div className="space-y-5">

            <div className="flex items-center justify-between">

              <span className="text-slate-500">

                Highest Rating

              </span>

              <span className="text-xl font-bold">

                {player.highestRating}

              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-slate-500">

                Provisional Matches

              </span>

              <span className="text-xl font-bold">

                {player.provisionalMatchesRemaining === 0
                  ? "Established"
                  : player.provisionalMatchesRemaining}

              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-slate-500">

                Status

              </span>

              <span
                className={`font-semibold ${
                  player.isActive
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >

                {player.isActive
                  ? "Active"
                  : "Inactive"}

              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-slate-500">

                Member Since

              </span>

              <span className="font-semibold">

                {new Date(
                  player.createdAt
                ).toLocaleDateString()}

              </span>

            </div>

          </div>

        </div>

      </div>

      {editing && (

        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4">

          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">

            <div className="border-b px-6 py-5">

              <h2 className="text-2xl font-bold">
                Edit Profile
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Update the contact details connected to your player profile. Your name and TTR are managed by administrators and match results.
              </p>

            </div>

            <div className="space-y-4 p-6">

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <PlayerAvatarUploader
                  firstName={player.firstName}
                  lastName={player.lastName}
                  avatarUrl={player.avatarUrl}
                  onUploaded={handleAvatarUploaded}
                  compact
                />
                <p className="mt-3 text-xs text-slate-500">
                  Images are centre-cropped and compressed to a 512 × 512 WebP.
                </p>
              </div>

              <input
                value={editMobile}
                onChange={(e) =>
                  setEditMobile(e.target.value)
                }
                placeholder="Mobile"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
              />

              <input
                type="email"
                value={editEmail}
                onChange={(e) =>
                  setEditEmail(e.target.value)
                }
                placeholder="Email"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
              />

              <div className="grid grid-cols-2 gap-4">

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">
                    Current TTR
                  </p>
                  <p className="text-2xl font-bold">
                    {player.rating}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">
                    Highest TTR
                  </p>
                  <p className="text-2xl font-bold">
                    {player.highestRating}
                  </p>
                </div>

              </div>

              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={closeEdit}
                  className="rounded-xl bg-slate-100 px-4 py-2 font-medium text-slate-900 transition hover:bg-slate-200"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-xl bg-blue-900 px-4 py-2 font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}
