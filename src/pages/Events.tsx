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
  Monitor,
  LockKeyhole,
  Plus,
  Search,
  SlidersHorizontal,
  Swords,
  Trophy,
  Tv,
  UsersRound,
} from "lucide-react";

import type { Event } from "../types/event";
import type { Club } from "../types/club";
import type { SavedTournament } from "../types/tournament";

import {
  addEvent,
  getEvents,
} from "../services/supabase/eventService";

import {
  getClubs,
} from "../services/supabase/clubService";

import useRole from "../hooks/useRole";
import { notify } from "../services/notificationService";
import { useTournament } from "../context/TournamentContext";
import {
  type TeamGameStatus,
} from "../services/teams/teamEngine";
import { getTeamGames } from "../services/teams/teamGameService";

type EventStatusFilter =
  | "all"
  | "past"
  | "live"
  | "upcoming";

type EventTypeFilter =
  | "all"
  | "match"
  | "tournament"
  | "team";

type EventFeedItem = {
  id: string;
  name: string;
  date: string;
  club: Club | undefined;
  clubName?: string;
  type: Exclude<EventTypeFilter, "all">;
  status: Exclude<EventStatusFilter, "all">;
  to: string;
  meta: string;
  countLabel?: string;
  countValue?: number;
};

export default function Events() {
  const { savedTournaments } =
    useTournament();

  const {
    isAdmin,
    isClubLeader,
    clubId: userClubId,
  } = useRole();

  const [events, setEvents] =
    useState<Event[]>([]);

  const [clubs, setClubs] =
    useState<Club[]>([]);
  const [teamGames, setTeamGames] =
    useState<
      Awaited<ReturnType<typeof getTeamGames>>
    >([]);

  const [name, setName] =
    useState("");

  const [clubId, setClubId] =
    useState("");

  const [eventDate, setEventDate] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [clubFilter, setClubFilter] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<EventStatusFilter>("all");

  const [typeFilter, setTypeFilter] =
    useState<EventTypeFilter>("all");

  const eventListRef =
    useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    standardEventOpen,
    setStandardEventOpen,
  ] = useState(false);

  const canCreateStandardEvent =
    isAdmin ||
    (isClubLeader && Boolean(userClubId));

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [
        eventData,
        clubData,
        teamGameData,
      ] =
        await Promise.all([
          getEvents(),
          getClubs(),
          getTeamGames(),
        ]);

      setTeamGames(teamGameData);

      if (isAdmin) {
        setEvents(eventData);
        setClubs(clubData);
        return;
      }

      if (isClubLeader && userClubId) {
        setEvents(
          eventData.filter(
            (event) =>
              event.clubId === userClubId
          )
        );

        setClubs(
          clubData.filter(
            (club) => club.id === userClubId
          )
        );

        setClubId(userClubId);
        return;
      }

      setEvents(eventData);
      setClubs(clubData);
    } catch (error) {
      console.error(error);
      notify.fault("Failed to load events.");
    } finally {
      setLoading(false);
    }
  }, [
    isAdmin,
    isClubLeader,
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

  async function handleAddEvent() {
    const assignedClubId = isAdmin
      ? clubId
      : userClubId;

    if (
      !name.trim() ||
      !assignedClubId ||
      !eventDate
    ) {
      notify.timeout("Please complete all fields.");
      return;
    }

    setSaving(true);

    try {
      const event: Event = {
        id: crypto.randomUUID(),
        clubId: assignedClubId,
        name: name.trim(),
        date: eventDate,
      };

      await addEvent(event);
      await loadData();

      notify.eventCreated(event.name);

      setName("");
      setEventDate("");

      if (isAdmin) {
        setClubId("");
      }
    } catch (error) {
      console.error(error);
      notify.fault("Failed to create event.");
    } finally {
      setSaving(false);
    }
  }

  function getClubName(eventClubId: string) {
    return (
      clubs.find((club) => club.id === eventClubId)
        ?.name ?? "-"
    );
  }

  const today =
    new Date().toISOString().slice(0, 10);

  const dateStatus = useCallback((
    date: string
  ): EventFeedItem["status"] => {
    if (date < today) {
      return "past";
    }

    if (date === today) {
      return "live";
    }

    return "upcoming";
  }, [today]);

  const tournamentMatchStats = useCallback((
    tournament: SavedTournament
  ) => {
    const matches = [
      ...tournament.matches,
      ...tournament.knockout,
    ];
    const total = matches.length;
    const completed =
      matches.filter((match) => match.completed)
        .length;

    return {
      total,
      completed,
      live:
        tournament.knockout.filter(
          (match) =>
            !match.completed &&
            match.playerOne &&
            match.playerTwo
        ).length,
    };
  }, []);

  const tournamentStatus = useCallback((
    tournament: SavedTournament
  ): EventFeedItem["status"] => {
    const stats =
      tournamentMatchStats(tournament);
    const finished =
      tournament.status === "completed" ||
      tournament.status === "cancelled";
    const live =
      !finished &&
      stats.total > 0 &&
      stats.completed < stats.total;

    if (live) {
      return "live";
    }

    if (
      finished ||
      tournament.settings.date < today
    ) {
      return "past";
    }

    return "upcoming";
  }, [today, tournamentMatchStats]);

  const teamEventStatus = useCallback((
    status: TeamGameStatus
  ): EventFeedItem["status"] => {
    if (status === "live") {
      return "live";
    }

    if (status === "completed") {
      return "past";
    }

    return "upcoming";
  }, []);

  const tournamentCards = useMemo(() => {
    return savedTournaments
      .map((tournament) => {
        const stats =
          tournamentMatchStats(tournament);

        return {
          tournament,
          club: clubs.find(
            (club) =>
              club.id === tournament.settings.clubId
          ),
          liveMatches: stats.live,
          totalMatches: stats.total,
        };
      })
      .filter(({ tournament, totalMatches }) => {
        return (
          tournament.settings.date === today &&
          totalMatches > 0 &&
          tournament.status !== "completed" &&
          tournament.status !== "cancelled"
        );
      });
  }, [
    clubs,
    savedTournaments,
    today,
    tournamentMatchStats,
  ]);

  const eventFeedItems = useMemo(() => {
    const matchItems: EventFeedItem[] =
      events.map((event) => {
        const club = clubs.find(
          (c) => c.id === event.clubId
        );

        return {
          id: `match-${event.id}`,
          name: event.name,
          date: event.date,
          club,
          clubName: club?.name,
          type: "match",
          status: dateStatus(event.date),
          to: `/events/${event.id}`,
          meta: "Match Event",
        };
      });

    const tournamentItems: EventFeedItem[] =
      savedTournaments.map((tournament) => {
        const club = clubs.find(
          (c) =>
            c.id === tournament.settings.clubId
        );
        const stats =
          tournamentMatchStats(tournament);

        return {
          id: `tournament-${tournament.id}`,
          name:
            tournament.settings.name ||
            "Untitled Tournament",
          date: tournament.settings.date,
          club,
          clubName: club?.name,
          type: "tournament",
          status: tournamentStatus(tournament),
          to: `/tournaments/${tournament.id}/viewer`,
          meta: "Tournament",
          countLabel:
            stats.total > 0
              ? "Matches"
              : "Players",
          countValue:
            stats.total > 0
              ? stats.total
              : tournament.players.length,
        };
      });

    const teamItems: EventFeedItem[] =
      teamGames.map((game) => ({
        id: `team-${game.id}`,
        name: game.name,
        date: game.date,
        club: undefined,
        clubName: game.clubName,
        type: "team",
        status: teamEventStatus(game.status),
        to: `/team-games/${game.id}/live`,
        meta: "Teams Event",
        countLabel: "Matches",
        countValue: game.totalMatches,
      }));

    return [
      ...matchItems,
      ...tournamentItems,
      ...teamItems,
    ];
  }, [
    clubs,
    events,
    savedTournaments,
    teamGames,
    dateStatus,
    teamEventStatus,
    tournamentMatchStats,
    tournamentStatus,
  ]);

  const filteredEventItems = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return eventFeedItems
      .filter((item) => {
        if (
          clubFilter &&
          item.club?.id !== clubFilter
        ) {
          return false;
        }

        if (
          statusFilter !== "all" &&
          item.status !== statusFilter
        ) {
          return false;
        }

        if (
          typeFilter !== "all" &&
          item.type !== typeFilter
        ) {
          return false;
        }

        if (!query) {
          return true;
        }

        const searchable = [
          item.name,
          item.date,
          item.meta,
          item.status,
          item.clubName,
          item.club?.shortName,
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      })
      .sort((a, b) => {
        const aTime =
          new Date(a.date).getTime();
        const bTime =
          new Date(b.date).getTime();

        if (statusFilter === "past") {
          return bTime - aTime;
        }

        return aTime - bTime;
      });
  }, [
    clubFilter,
    eventFeedItems,
    search,
    statusFilter,
    typeFilter,
  ]);

  const upcomingEvents = useMemo(() => {
    return eventFeedItems.filter(
      (item) => item.status === "upcoming"
    ).length;
  }, [eventFeedItems]);

  const liveViewerEvents = useMemo(() => {
    return eventFeedItems.filter(
      (item) => item.status === "live"
    ).length;
  }, [eventFeedItems]);

  const applyStatusShortcut = useCallback((
    nextStatus: EventStatusFilter
  ) => {
    setSearch("");
    setClubFilter("");
    setStatusFilter(nextStatus);
    setTypeFilter("all");

    window.setTimeout(() => {
      eventListRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }, []);

  return (
      <div className="mx-auto max-w-7xl space-y-8">

      <div>

        <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
          KiwiTTR
        </p>

        <h1 className="mt-2 text-5xl font-black tracking-tight">
          Events
        </h1>

        <p className="mt-3 text-lg text-slate-500">
          Browse tournaments, club nights and match activity.
        </p>

      </div>

      <div className="grid gap-3 md:grid-cols-3">

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <CalendarDays className="h-5 w-5 text-blue-700" />
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              Events
            </p>
            <p className="text-xl font-black">
              {eventFeedItems.length}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            applyStatusShortcut("live")
          }
          className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-amber-300 hover:bg-amber-50/40 focus:outline-none focus:ring-4 focus:ring-amber-100"
        >
          <Tv className="h-5 w-5 text-amber-500" />
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              Live Viewers
            </p>
            <p className="text-xl font-black">
              {liveViewerEvents}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            applyStatusShortcut("upcoming")
          }
          className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50/40 focus:outline-none focus:ring-4 focus:ring-indigo-100"
        >
          <ArrowRight className="h-5 w-5 text-indigo-600" />
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              Upcoming
            </p>
            <p className="text-xl font-black">
              {upcomingEvents}
            </p>
          </div>
        </button>

      </div>

      {tournamentCards.length > 0 && (

        <div className="space-y-4">

          <div className="flex items-center gap-3">
            <Tv className="h-6 w-6 text-green-600" />
            <h2 className="text-2xl font-bold">
              Tournament Viewers
            </h2>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">

            {tournamentCards.map(({
              tournament,
              club,
              liveMatches,
            }) => (

              <Link
                key={tournament.id}
                to={`/tournaments/${tournament.id}/viewer`}
                className="group block rounded-xl border border-green-200 bg-white px-4 py-3 shadow-sm transition hover:border-green-400 hover:bg-green-50/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Live Viewer
                    </div>

                    <h3 className="mt-2 truncate text-base font-medium">
                      {tournament.settings.name}
                    </h3>

                    <p className="text-sm text-slate-500">
                      {club?.name ?? "-"} ·{" "}
                      {new Date(
                        tournament.settings.date
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-500">
                      Live Matches
                    </div>
                    <div className="text-xl font-black text-green-700">
                      {liveMatches}
                    </div>
                    <div className="mt-1 flex items-center justify-end gap-2 text-sm font-semibold text-blue-700">
                      Open
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>

            ))}

          </div>

        </div>

      )}

      {canCreateStandardEvent && (

        <div className="space-y-4">

          <div className="flex items-center gap-3">
            <Monitor className="h-6 w-6 text-blue-700" />
            <h2 className="text-xl font-bold">
              Event Types
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-3">

            <Link
              to="/tournaments"
              className="group flex min-h-32 flex-col justify-between rounded-xl border border-amber-200 bg-white p-5 shadow-sm transition hover:border-amber-400 hover:bg-amber-50/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-amber-600">
                    Tournament
                  </p>
                  <h3 className="mt-2 text-lg font-black">
                    Tournament
                  </h3>
                </div>
                <Trophy className="h-6 w-6 text-amber-500" />
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-700">
                Open tournaments
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>

            <button
              type="button"
              onClick={() =>
                setStandardEventOpen((open) => !open)
              }
              className={`group flex min-h-32 flex-col justify-between rounded-xl border bg-white p-5 text-left shadow-sm transition ${
                standardEventOpen
                  ? "border-blue-400 bg-blue-50/60"
                  : "border-blue-200 hover:border-blue-400 hover:bg-blue-50/50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-blue-700">
                    Match Event
                  </p>
                  <h3 className="mt-2 text-lg font-black">
                    Standard Match Event
                  </h3>
                </div>
                <Swords className="h-6 w-6 text-blue-700" />
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-700">
                {standardEventOpen
                  ? "Hide creator"
                  : "Create event"}
                <ArrowRight className={`h-4 w-4 transition ${
                  standardEventOpen
                    ? "rotate-90"
                    : "group-hover:translate-x-1"
                }`} />
              </div>
            </button>

            <Link
              to="/team-games"
              className="group flex min-h-32 flex-col justify-between rounded-xl border border-emerald-200 bg-white p-5 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-emerald-700">
                    Teams
                  </p>
                  <h3 className="mt-2 text-lg font-black">
                    Team Game
                  </h3>
                </div>
                <UsersRound className="h-6 w-6 text-emerald-600" />
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-700">
                Open team games
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>

          </div>

          {standardEventOpen && (

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

              <div className="flex items-center gap-3 border-b px-5 py-4">
                <Plus className="h-5 w-5 text-blue-700" />
                <h2 className="text-xl font-bold">
                  Standard Match Event
                </h2>
              </div>

              <div className="p-5">
                <div
                  className={`grid gap-4 ${
                    isAdmin
                      ? "md:grid-cols-3"
                      : "md:grid-cols-2"
                  }`}
                >
                  <input
                    placeholder="Event Name"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                  />

                  {isAdmin ? (
                    <select
                      value={clubId}
                      onChange={(e) =>
                        setClubId(e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="">
                        Select Club
                      </option>

                      {clubs.map((club) => (
                        <option
                          key={club.id}
                          value={club.id}
                        >
                          {club.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-sm text-slate-500">
                        Locked Club
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <LockKeyhole className="h-4 w-4 text-slate-400" />
                        <p className="font-semibold">
                          {userClubId
                            ? getClubName(userClubId)
                            : "-"}
                        </p>
                      </div>
                    </div>
                  )}

                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) =>
                      setEventDate(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <button
                  onClick={handleAddEvent}
                  disabled={saving}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-900 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  <Plus className="h-5 w-5" />
                  {saving ? "Creating..." : "Create Event"}
                </button>
              </div>

            </div>

          )}

        </div>

      )}

      <div
        ref={eventListRef}
        className="scroll-mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >

        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

          <input
            type="search"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search events by name, club or date"
            className="w-full rounded-xl border border-slate-300 py-3 pl-12 pr-4 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="block">
            <span className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
              <Building2 className="h-4 w-4" />
              Club
            </span>
            <select
              value={clubFilter}
              onChange={(event) =>
                setClubFilter(event.target.value)
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">
                All Clubs
              </option>

              {clubs.map((club) => (
                <option
                  key={club.id}
                  value={club.id}
                >
                  {club.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
              <CalendarDays className="h-4 w-4" />
              Status
            </span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target
                    .value as EventStatusFilter
                )
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
            >
              <option value="all">
                Past, Live, or Upcoming
              </option>
              <option value="upcoming">
                Upcoming
              </option>
              <option value="live">
                Live
              </option>
              <option value="past">
                Past
              </option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
              <SlidersHorizontal className="h-4 w-4" />
              Event Type
            </span>
            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(
                  event.target
                    .value as EventTypeFilter
                )
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
            >
              <option value="all">
                All Event Types
              </option>
              <option value="match">
                Match Event
              </option>
              <option value="tournament">
                Tournaments
              </option>
              <option value="team">
                Teams Event
              </option>
            </select>
          </label>
        </div>

      </div>

      {loading ? (

        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          Loading events...
        </div>

      ) : eventFeedItems.length === 0 ? (

        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          No events yet.
        </div>

      ) : filteredEventItems.length === 0 ? (

        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          No events match your filters.
        </div>

      ) : (

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="divide-y">

            {filteredEventItems.map((item) => (

              <Link
                key={item.id}
                to={item.to}
                className="group flex items-center justify-between gap-4 px-5 py-3 transition hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.type === "tournament"
                          ? "bg-amber-100 text-amber-700"
                          : item.type === "team"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {item.meta}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.status === "live"
                          ? "bg-green-100 text-green-700"
                          : item.status === "upcoming"
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.status === "live"
                        ? "Live"
                        : item.status === "upcoming"
                          ? "Upcoming"
                          : "Past"}
                    </span>
                  </div>

                  <h2 className="truncate text-base font-medium">
                    {item.name}
                  </h2>

                  <p className="text-sm text-slate-500">
                    {item.clubName ?? "-"} ·{" "}
                    {new Date(item.date).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  {item.countLabel && (
                    <div className="hidden text-right sm:block">
                      <div className="text-xs font-semibold text-slate-500">
                        {item.countLabel}
                      </div>
                      <div className="text-lg font-black text-slate-800">
                        {item.countValue}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                    Open
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>

            ))}

          </div>

        </div>

      )}

    </div>
  );
}
