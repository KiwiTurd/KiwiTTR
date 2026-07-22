import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";

import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Edit3,
  Eye,
  LockKeyhole,
  Plus,
  Search,
  SlidersHorizontal,
  Swords,
  Trophy,
  Tv,
  UserPlus,
  UsersRound,
} from "lucide-react";

import type { Event } from "../types/event";
import type { Club } from "../types/club";
import type { SavedTournament } from "../types/tournament";
import SlateImagePageHeader from "../components/shared/SlateImagePageHeader";

import {
  addEvent,
  getEvents,
  updateEvent,
} from "../services/supabase/eventService";

import {
  getClubs,
} from "../services/supabase/clubService";

import useRole from "../hooks/useRole";
import useFormDraftState from "../hooks/useFormDraftState";
import { notify } from "../services/notificationService";
import { useTournament } from "../context/TournamentContext";
import {
  teamGameFormatLabel,
  type TeamGameStatus,
} from "../services/teams/teamEngine";
import { getTeamGames } from "../services/teams/teamGameService";
import LoadingScreen from "../components/shared/LoadingScreen";
import ExpandableDescription from "../components/shared/ExpandableDescription";
import { formatStartTime } from "../utils/tournamentTime";
import { getNewZealandDate } from "../utils/newZealandDate";
import {
  getPlayer,
  getOwnPlayerPrivateDetails,
  type PlayerPrivateDetails,
} from "../services/supabase/playerService";
import {
  getEligibilityReasons,
  hasEligibilityRestrictions,
} from "../utils/tournamentEligibility";

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
  sourceId: string;
  name: string;
  date: string;
  startTime?: string;
  club: Club | undefined;
  clubName?: string;
  type: Exclude<EventTypeFilter, "all">;
  status: Exclude<EventStatusFilter, "all">;
  to: string;
  meta: string;
};

type EventEditForm = {
  itemId: string;
  sourceId: string;
  type: "match" | "tournament";
  name: string;
  date: string;
  startTime: string;
  eventDescription: string;
  allowSignUp: boolean;
  signUpClosesAt: string;
};

const EVENTS_PER_PAGE = 10;

export default function Events() {
  const {
    savedTournaments,
    signUpForTournament,
    updateTournamentDetails,
  } = useTournament();

  const {
    isAdmin,
    isClubLeader,
    clubId: userClubId,
    playerId: linkedPlayerId,
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
    useFormDraftState("events.new.name", "");

  const [clubId, setClubId] =
    useFormDraftState("events.new.clubId", "");

  const [eventDate, setEventDate] =
    useFormDraftState("events.new.date", "");

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

  const [eventPage, setEventPage] =
    useState(0);

  const eventListRef =
    useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [expandedEventId, setExpandedEventId] =
    useState<string | null>(null);

  const [signingUpTournamentId, setSigningUpTournamentId] =
    useState<string | null>(null);

  const [privateDetails, setPrivateDetails] =
    useState<PlayerPrivateDetails | null>(null);

  const [privateDetailsPlayerId, setPrivateDetailsPlayerId] =
    useState<string | null>(null);

  const [linkedPlayerRating, setLinkedPlayerRating] =
    useState<number | null>(null);

  const privateDetailsLoading = Boolean(
    linkedPlayerId &&
    privateDetailsPlayerId !== linkedPlayerId
  );

  const [editForm, setEditForm] =
    useState<EventEditForm | null>(null);

  const [savingEdit, setSavingEdit] =
    useState(false);

  useEffect(() => {
    let active = true;

    if (!linkedPlayerId) {
      return;
    }

    void Promise.all([
      getOwnPlayerPrivateDetails(),
      getPlayer(linkedPlayerId),
    ])
      .then(([details, linkedPlayer]) => {
        if (active) {
          setPrivateDetails(details);
          setLinkedPlayerRating(
            linkedPlayer?.rating ?? null
          );
          setPrivateDetailsPlayerId(linkedPlayerId);
        }
      })
      .catch(error => {
        console.error(error);
        if (active) {
          setPrivateDetails(null);
          setLinkedPlayerRating(null);
          setPrivateDetailsPlayerId(linkedPlayerId);
        }
      });

    return () => {
      active = false;
    };
  }, [linkedPlayerId]);

  const [
    standardEventOpen,
    setStandardEventOpen,
  ] = useState(false);

  const [focusedCreateOption, setFocusedCreateOption] =
    useState<number | null>(null);

  function createOptionFocusClass(index: number) {
    if (focusedCreateOption === index) {
      const activeColour = [
        "border-2 border-amber-400 shadow-amber-100/40",
        "border-2 border-blue-400 shadow-blue-100/40",
        "border-2 border-emerald-400 shadow-emerald-100/40",
      ][index];

      return `relative z-10 scale-[1.015] opacity-100 shadow-lg ${activeColour}`;
    }

    if (focusedCreateOption !== null) {
      return "scale-[0.99] opacity-55 blur-[1px] grayscale-[0.1]";
    }

    return "";
  }

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
    setClubId,
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

  const today = getNewZealandDate();

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

  const tournamentStatus = useCallback((
    tournament: SavedTournament
  ): EventFeedItem["status"] => {
    const finished =
      tournament.status === "completed" ||
      tournament.status === "cancelled";
    const live =
      !finished &&
      tournament.status === "active";

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
  }, [today]);

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

  const eventFeedItems = useMemo(() => {
    const clubEventIds = new Set(
      savedTournaments
        .filter(
          (tournament) =>
            tournament.settings.eventType === "club-round-robin"
        )
        .map((tournament) => tournament.id)
    );

    const matchItems: EventFeedItem[] =
      events
        .filter((event) => !clubEventIds.has(event.id))
        .map((event) => {
          const club = clubs.find(
            (c) => c.id === event.clubId
          );

          return {
            id: `match-${event.id}`,
            sourceId: event.id,
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
      savedTournaments
        .filter(
          (tournament) =>
            tournament.settings.eventType !== "club-round-robin"
        )
        .map((tournament) => {
          const club = clubs.find(
            (c) =>
              c.id === tournament.settings.clubId
          );
          return {
            id: `tournament-${tournament.id}`,
            sourceId: tournament.id,
            name:
              tournament.settings.name ||
              "Untitled Tournament",
            date: tournament.settings.date,
            startTime: tournament.settings.startTime,
            club,
            clubName: club?.name,
            type: "tournament",
            status: tournamentStatus(tournament),
            to: `/tournaments/${tournament.id}/viewer`,
            meta: "Tournament",
          };
        });

    const teamItems: EventFeedItem[] =
      teamGames.map((game) => ({
        id: `team-${game.id}`,
        sourceId: game.id,
        name: game.name,
        date: game.date,
        startTime: game.startTime ?? undefined,
        club: undefined,
        clubName: game.clubName,
        type: "team",
        status: teamEventStatus(game.status),
        to: `/team-games/${game.id}/live`,
        meta: "Teams Event",
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
        const todayTime = Date.parse(
          `${today}T00:00:00Z`
        );
        const aDistance = Math.abs(
          Date.parse(`${a.date}T00:00:00Z`) -
            todayTime
        );
        const bDistance = Math.abs(
          Date.parse(`${b.date}T00:00:00Z`) -
            todayTime
        );

        return (
          aDistance - bDistance ||
          a.date.localeCompare(b.date) ||
          a.name.localeCompare(b.name)
        );
      });
  }, [
    clubFilter,
    eventFeedItems,
    search,
    statusFilter,
    today,
    typeFilter,
  ]);

  const eventPageCount = Math.max(
    1,
    Math.ceil(
      filteredEventItems.length / EVENTS_PER_PAGE
    )
  );
  const currentEventPage = Math.min(
    eventPage,
    eventPageCount - 1
  );
  const paginatedEventItems = useMemo(() => {
    const start =
      currentEventPage * EVENTS_PER_PAGE;

    return filteredEventItems.slice(
      start,
      start + EVENTS_PER_PAGE
    );
  }, [currentEventPage, filteredEventItems]);

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
    setEventPage(0);

    window.setTimeout(() => {
      eventListRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }, []);

  function changeEventPage(nextPage: number) {
    setEventPage(nextPage);
    setExpandedEventId(null);
    setEditForm(null);

    window.setTimeout(() => {
      eventListRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }

  function tournamentFormatLabel(
    tournament: SavedTournament
  ) {
    return tournament.settings.format === "pools"
      ? "Pools → Knockout"
      : tournament.settings.format === "pool-ratings"
        ? "Pool Only Ratings"
        : tournament.settings.format === "doubles"
          ? "Doubles Knockout"
          : tournament.settings.format === "doubles-double-knockout"
            ? "Doubles Double Knockout"
          : tournament.settings.format === "double-knockout"
            ? "Double Knockout"
            : "Straight Knockout";
  }

  function canManageItem(item: EventFeedItem) {
    if (isAdmin) {
      return true;
    }

    if (!isClubLeader || !userClubId) {
      return false;
    }

    if (item.type === "team") {
      const game = teamGames.find(
        (candidate) => candidate.id === item.sourceId
      );

      return Boolean(
        game &&
        [
          game.homeClubId,
          game.awayClubId,
          game.locationClubId,
        ].includes(userClubId)
      );
    }

    return item.club?.id === userClubId;
  }

  function openEdit(item: EventFeedItem) {
    if (!canManageItem(item) || item.type === "team") {
      return;
    }

    if (item.type === "match") {
      const event = events.find(
        (candidate) => candidate.id === item.sourceId
      );

      if (!event) {
        return;
      }

      setEditForm({
        itemId: item.id,
        sourceId: event.id,
        type: "match",
        name: event.name,
        date: event.date,
        startTime: "",
        eventDescription: "",
        allowSignUp: false,
        signUpClosesAt: "",
      });
      return;
    }

    const tournament = savedTournaments.find(
      (candidate) => candidate.id === item.sourceId
    );

    if (!tournament) {
      return;
    }

    setEditForm({
      itemId: item.id,
      sourceId: tournament.id,
      type: "tournament",
      name: tournament.settings.name,
      date: tournament.settings.date,
      startTime: tournament.settings.startTime,
      eventDescription:
        tournament.settings.eventDescription,
      allowSignUp:
        tournament.settings.allowSignUp,
      signUpClosesAt:
        tournament.settings.signUpClosesAt ?? "",
    });
  }

  async function saveEventEdit() {
    if (!editForm) {
      return;
    }

    if (
      !editForm.name.trim() ||
      !editForm.date ||
      (
        editForm.type === "tournament" &&
        !editForm.startTime
      )
    ) {
      notify.timeout(
        editForm.type === "tournament"
          ? "Please enter a name, date and start time."
          : "Please enter a name and date."
      );
      return;
    }

    setSavingEdit(true);

    try {
      if (editForm.type === "match") {
        const event = events.find(
          (candidate) => candidate.id === editForm.sourceId
        );

        if (!event) {
          throw new Error("Event could not be found.");
        }

        await updateEvent({
          ...event,
          name: editForm.name.trim(),
          date: editForm.date,
        });
        await loadData();
      } else {
        const tournament = savedTournaments.find(
          (candidate) => candidate.id === editForm.sourceId
        );

        if (!tournament) {
          throw new Error("Tournament could not be found.");
        }

        await updateTournamentDetails({
          ...tournament,
          settings: {
            ...tournament.settings,
            name: editForm.name.trim(),
            date: editForm.date,
            startTime: editForm.startTime,
            eventDescription:
              editForm.eventDescription.trim(),
            allowSignUp: editForm.allowSignUp,
            signUpClosesAt:
              editForm.allowSignUp &&
              editForm.signUpClosesAt
                ? editForm.signUpClosesAt
                : null,
          },
        });
      }

      notify.edgeBall("Event details updated.");
      setEditForm(null);
    } catch (error) {
      console.error(error);
      notify.fault(
        error instanceof Error
          ? error.message
          : "Unable to update event."
      );
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleTournamentSignUp(
    tournamentId: string
  ) {
    if (!linkedPlayerId) {
      notify.timeout(
        "Link your account to a player profile before signing up."
      );
      return;
    }

    setSigningUpTournamentId(tournamentId);

    try {
      await signUpForTournament(
        tournamentId,
        linkedPlayerId
      );
      notify.edgeBall(
        "You are signed up for this tournament."
      );
    } catch (error) {
      console.error(error);
      notify.fault(
        error instanceof Error
          ? error.message
          : "Unable to sign up."
      );
    } finally {
      setSigningUpTournamentId(null);
    }
  }

  return (
      <div className="mx-auto max-w-7xl space-y-8">

      <SlateImagePageHeader pageKey="events" title="Events" subtitle="Browse tournaments, club nights and match activity." />

      {canCreateStandardEvent && (

        <div className="space-y-4">

          <div
            className="grid gap-3 md:grid-cols-3"
            onMouseLeave={() => setFocusedCreateOption(null)}
          >

            <Link
              to="/tournaments"
              onMouseEnter={() => setFocusedCreateOption(0)}
              onFocus={() => setFocusedCreateOption(0)}
              onBlur={() => setFocusedCreateOption(null)}
              className={`group flex min-h-32 flex-col justify-between rounded-xl border border-amber-200 bg-white p-5 shadow-sm outline-none transition-[transform,opacity,filter,border-color,box-shadow] duration-300 ease-out hover:border-amber-400 hover:bg-amber-50/50 ${createOptionFocusClass(0)}`}
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
              onMouseEnter={() => setFocusedCreateOption(1)}
              onFocus={() => setFocusedCreateOption(1)}
              onBlur={() => setFocusedCreateOption(null)}
              className={`group flex min-h-32 flex-col justify-between rounded-xl border bg-white p-5 text-left shadow-sm outline-none transition-[transform,opacity,filter,border-color,box-shadow] duration-300 ease-out ${
                standardEventOpen
                  ? "border-blue-400 bg-blue-50/60"
                  : "border-blue-200 hover:border-blue-400 hover:bg-blue-50/50"
              } ${createOptionFocusClass(1)}`}
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
              onMouseEnter={() => setFocusedCreateOption(2)}
              onFocus={() => setFocusedCreateOption(2)}
              onBlur={() => setFocusedCreateOption(null)}
              className={`group flex min-h-32 flex-col justify-between rounded-xl border border-emerald-200 bg-white p-5 shadow-sm outline-none transition-[transform,opacity,filter,border-color,box-shadow] duration-300 ease-out hover:border-emerald-400 hover:bg-emerald-50/50 ${createOptionFocusClass(2)}`}
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
            onChange={(e) => {
              setSearch(e.target.value);
              setEventPage(0);
            }}
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
              onChange={(event) => {
                setClubFilter(event.target.value);
                setEventPage(0);
              }}
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
              onChange={(event) => {
                setStatusFilter(
                  event.target
                    .value as EventStatusFilter
                );
                setEventPage(0);
              }}
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
              onChange={(event) => {
                setTypeFilter(
                  event.target
                    .value as EventTypeFilter
                );
                setEventPage(0);
              }}
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
        <LoadingScreen label="Loading events..." />

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

          <div className="hidden grid-cols-[minmax(0,2fr)_minmax(8rem,1fr)_minmax(7rem,1fr)_minmax(7rem,1fr)] items-center gap-x-5 border-b bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:grid">
            <span>Event</span>
            <span className="text-center">Date</span>
            <span className="text-center">Event Type</span>
            <span className="text-center">Status</span>
          </div>

          <div className="divide-y">

            {paginatedEventItems.map((item) => {
              const expanded =
                expandedEventId === item.id;
              const tournament =
                item.type === "tournament"
                  ? savedTournaments.find(
                      (candidate) =>
                        candidate.id === item.sourceId
                    )
                  : undefined;
              const teamGame =
                item.type === "team"
                  ? teamGames.find(
                      (candidate) =>
                        candidate.id === item.sourceId
                    )
                  : undefined;
              const canManage = canManageItem(item);
              const signupClosedByDate = Boolean(
                tournament?.settings.signUpClosesAt &&
                tournament.settings.signUpClosesAt < today
              );
              const signUpsOpen = Boolean(
                tournament?.settings.allowSignUp &&
                tournament.status === "draft" &&
                !signupClosedByDate
              );
              const signedUp = Boolean(
                tournament &&
                linkedPlayerId &&
                tournament.players.some(
                  (player) => player.id === linkedPlayerId
                )
              );
              const tournamentFull = Boolean(
                tournament?.settings.playerLimitEnabled &&
                tournament.players.length >=
                  tournament.settings.playerCount
              );
              const eligibilityReasons = tournament
                  ? getEligibilityReasons(
                      tournament,
                      privateDetails,
                      linkedPlayerRating
                    )
                : [];
              const checkingEligibility = Boolean(
                tournament &&
                privateDetailsLoading &&
                hasEligibilityRestrictions(tournament)
              );
              const unavailableForEligibility = Boolean(
                tournament &&
                signUpsOpen &&
                !signedUp &&
                !tournamentFull &&
                (checkingEligibility ||
                  eligibilityReasons.length > 0)
              );
              const editing = editForm?.itemId === item.id;

              return (
                <div key={item.id}>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => {
                      setExpandedEventId(
                        expanded ? null : item.id
                      );

                      if (expanded && editing) {
                        setEditForm(null);
                      }
                    }}
                    className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 px-4 py-2 text-left transition hover:bg-slate-50 md:grid-cols-[minmax(0,2fr)_minmax(8rem,1fr)_minmax(7rem,1fr)_minmax(7rem,1fr)] md:gap-x-5"
                  >
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <h2 className="min-w-0 truncate text-base font-medium">
                          {item.name}
                        </h2>
                        {expanded ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                        )}
                      </div>

                      <p className="truncate text-xs text-slate-500 sm:text-sm">
                        {item.clubName ?? "-"}
                      </p>
                    </div>

                    <div className="col-start-1 row-start-2 mt-1 text-xs text-slate-500 md:col-start-auto md:row-start-auto md:mt-0 md:text-center md:text-sm">
                      <div className="font-medium text-slate-700">
                        {new Date(item.date).toLocaleDateString()}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {item.startTime
                          ? formatStartTime(item.startTime)
                          : "Time not set"}
                      </div>
                    </div>

                    <div className="col-start-2 row-start-2 mt-1 flex justify-end md:col-start-auto md:row-start-auto md:mt-0 md:justify-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          item.type === "tournament"
                            ? "bg-amber-100 text-amber-700"
                            : item.type === "team"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {item.meta}
                      </span>
                    </div>

                    <div className="col-span-2 mt-1 flex justify-start md:col-span-1 md:mt-0 md:justify-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
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

                  </button>

                  {expanded && (
                    <div className="space-y-3 bg-slate-50 px-4 py-3">
                      {(tournament?.settings.eventDescription ||
                        teamGame?.description) && (
                        <ExpandableDescription
                          description={
                            tournament?.settings.eventDescription ||
                            teamGame?.description ||
                            ""
                          }
                        />
                      )}

                      <div className="grid gap-2 md:grid-cols-3">
                        <EventDetail
                          label="Date"
                          value={new Date(
                            item.date
                          ).toLocaleDateString()}
                        />
                        {tournament && (
                          <EventDetail
                            label="Start Time"
                            value={formatStartTime(
                              tournament.settings.startTime
                            )}
                          />
                        )}
                        <EventDetail
                          label="Club"
                          value={item.clubName ?? "-"}
                        />
                        <EventDetail
                          label="Type"
                          value={item.meta}
                        />
                        <EventDetail
                          label="Status"
                          value={
                            item.status === "live"
                              ? "Live"
                              : item.status === "upcoming"
                                ? "Upcoming"
                                : "Past"
                          }
                        />

                        {tournament && (
                          <>
                            <EventDetail
                              label="Format"
                              value={tournamentFormatLabel(
                                tournament
                              )}
                            />
                            <EventDetail
                              label="Players"
                              value={
                                tournament.settings
                                  .playerLimitEnabled
                                  ? `${tournament.players.length}/${tournament.settings.playerCount}`
                                  : tournament.players.length
                              }
                            />
                            <EventDetail
                              label="Sign Ups"
                              value={
                                signUpsOpen
                                  ? "Open"
                                  : tournament.settings.allowSignUp
                                    ? "Closed"
                                    : "Off"
                              }
                            />
                            <EventDetail
                              label="Close Date"
                              value={
                                tournament.settings
                                  .signUpClosesAt
                                  ? new Date(
                                      tournament.settings.signUpClosesAt
                                    ).toLocaleDateString()
                                  : "None"
                              }
                            />
                            <EventDetail
                              label="Age"
                              value={
                                tournament.settings.ageMinimum ||
                                tournament.settings.ageLimit
                                  ? [
                                      tournament.settings.ageMinimum
                                        ? `O${tournament.settings.ageMinimum}`
                                        : null,
                                      tournament.settings.ageLimit
                                        ? `U${tournament.settings.ageLimit}`
                                        : null,
                                    ].filter(Boolean).join(" · ")
                                  : "Open"
                              }
                            />
                            <EventDetail
                              label="Gender"
                              value={
                                tournament.settings.gender === "open"
                                  ? "Open"
                                  : tournament.settings.gender === "female"
                                    ? "Female"
                                    : "Male"
                              }
                            />
                          </>
                        )}

                        {teamGame && (
                          <>
                            <EventDetail
                              label="Format"
                              value={teamGameFormatLabel(
                                teamGame.format ?? "classic-6"
                              )}
                            />
                            <EventDetail
                              label="Matches"
                              value={`${teamGame.matchesPlayed}/${teamGame.totalMatches}`}
                            />
                            <EventDetail
                              label="Start Time"
                              value={teamGame.startTime || "Not set"}
                            />
                          </>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          to={item.to}
                          className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                        >
                          <Eye className="h-4 w-4" />
                          {item.type === "team"
                            ? "Live Viewer"
                            : "View"}
                        </Link>

                        {tournament && signUpsOpen && signedUp && (
                          <span className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-800">
                            <Check className="h-4 w-4" />
                            Signed Up
                          </span>
                        )}

                        {tournament &&
                          signUpsOpen &&
                          !signedUp &&
                          !tournamentFull &&
                          !checkingEligibility &&
                          eligibilityReasons.length === 0 && (
                            <button
                              type="button"
                              disabled={
                                signingUpTournamentId ===
                                tournament.id
                              }
                              onClick={() =>
                                void handleTournamentSignUp(
                                  tournament.id
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <UserPlus className="h-4 w-4" />
                              {signingUpTournamentId ===
                              tournament.id
                                ? "Signing Up"
                                : "Sign Up"}
                            </button>
                          )}

                        {unavailableForEligibility && (
                          <button
                            type="button"
                            disabled
                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
                          >
                            Unavailable
                          </button>
                        )}

                        {tournament &&
                          signUpsOpen &&
                          !signedUp &&
                          tournamentFull && (
                            <span className="inline-flex items-center rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-slate-500">
                              Full
                            </span>
                          )}

                        {canManage &&
                          item.type !== "team" &&
                          (!tournament ||
                            tournament.status === "draft") && (
                            <button
                              type="button"
                              onClick={() =>
                                editing
                                  ? setEditForm(null)
                                  : openEdit(item)
                              }
                              className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                            >
                              <Edit3 className="h-4 w-4" />
                              {editing
                                ? "Close Edit"
                                : "Edit Details"}
                            </button>
                          )}

                        {canManage && tournament && (
                          <Link
                            to={`/tournaments/${tournament.id}/live`}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                          >
                            <Edit3 className="h-4 w-4" />
                            Match Centre
                          </Link>
                        )}

                        {canManage && teamGame && (
                          <>
                            {(teamGame.status === "draft" ||
                              isAdmin) && (
                              <Link
                                to={`/team-games/new/${teamGame.format ?? "classic-6"}?edit=${teamGame.id}`}
                                className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                              >
                                <Edit3 className="h-4 w-4" />
                                Edit Setup
                              </Link>
                            )}
                            <Link
                              to={`/team-games/${teamGame.id}/manage`}
                              className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                            >
                              <Edit3 className="h-4 w-4" />
                              Manage
                            </Link>
                          </>
                        )}
                      </div>

                      {unavailableForEligibility && (
                        <div className="space-y-1 text-sm text-red-700">
                          {checkingEligibility ? (
                            <p>Checking your profile eligibility…</p>
                          ) : (
                            eligibilityReasons.map(reason => (
                              <p key={reason}>{reason}</p>
                            ))
                          )}
                          {eligibilityReasons.some(reason =>
                            reason.includes("Settings")
                          ) && (
                            <Link
                              to="/settings"
                              className="inline-flex font-semibold underline underline-offset-2"
                            >
                              Update Profile Settings
                            </Link>
                          )}
                        </div>
                      )}

                      {editing && editForm && (
                        <div className="rounded-xl border bg-white p-4">
                          <div className="grid gap-3 md:grid-cols-2">
                            <label>
                              <span className="text-sm font-semibold">
                                Name
                              </span>
                              <input
                                value={editForm.name}
                                onChange={(event) =>
                                  setEditForm({
                                    ...editForm,
                                    name: event.target.value,
                                  })
                                }
                                className="mt-1 w-full rounded-lg border px-3 py-2"
                              />
                            </label>
                            <label>
                              <span className="text-sm font-semibold">
                                Date
                              </span>
                              <input
                                type="date"
                                value={editForm.date}
                                onChange={(event) =>
                                  setEditForm({
                                    ...editForm,
                                    date: event.target.value,
                                  })
                                }
                                className="mt-1 w-full rounded-lg border px-3 py-2"
                              />
                            </label>

                            {editForm.type === "tournament" && (
                              <>
                                <label>
                                  <span className="text-sm font-semibold">
                                    Start Time
                                  </span>
                                  <input
                                    type="time"
                                    value={editForm.startTime}
                                    onChange={(event) =>
                                      setEditForm({
                                        ...editForm,
                                        startTime: event.target.value,
                                      })
                                    }
                                    className="mt-1 w-full rounded-lg border px-3 py-2"
                                  />
                                </label>
                                <label className="md:col-span-2">
                                  <span className="text-sm font-semibold">
                                    Description
                                  </span>
                                  <textarea
                                    rows={3}
                                    value={
                                      editForm.eventDescription
                                    }
                                    onChange={(event) =>
                                      setEditForm({
                                        ...editForm,
                                        eventDescription:
                                          event.target.value,
                                      })
                                    }
                                    className="mt-1 w-full rounded-lg border px-3 py-2"
                                  />
                                </label>
                                <label className="flex items-center gap-3 rounded-lg border bg-slate-50 p-3">
                                  <input
                                    type="checkbox"
                                    checked={
                                      editForm.allowSignUp
                                    }
                                    onChange={() =>
                                      setEditForm({
                                        ...editForm,
                                        allowSignUp:
                                          !editForm.allowSignUp,
                                      })
                                    }
                                  />
                                  <span className="text-sm font-semibold">
                                    Allow Sign Up
                                  </span>
                                </label>
                                {editForm.allowSignUp && (
                                  <label>
                                    <span className="text-sm font-semibold">
                                      Sign Up Close Date
                                    </span>
                                    <input
                                      type="date"
                                      value={
                                        editForm.signUpClosesAt
                                      }
                                      onChange={(event) =>
                                        setEditForm({
                                          ...editForm,
                                          signUpClosesAt:
                                            event.target.value,
                                        })
                                      }
                                      className="mt-1 w-full rounded-lg border px-3 py-2"
                                    />
                                  </label>
                                )}
                              </>
                            )}
                          </div>

                          <div className="mt-4 flex gap-2">
                            <button
                              type="button"
                              disabled={savingEdit}
                              onClick={() =>
                                void saveEventEdit()
                              }
                              className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                            >
                              {savingEdit
                                ? "Saving"
                                : "Save Changes"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditForm(null)}
                              className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

          </div>

          <div className="flex flex-col gap-3 border-t bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing{" "}
              {currentEventPage * EVENTS_PER_PAGE + 1}
              –
              {Math.min(
                (currentEventPage + 1) * EVENTS_PER_PAGE,
                filteredEventItems.length
              )}{" "}
              of {filteredEventItems.length}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentEventPage === 0}
                onClick={() =>
                  changeEventPage(currentEventPage - 1)
                }
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous 10
              </button>
              <button
                type="button"
                disabled={
                  currentEventPage >= eventPageCount - 1
                }
                onClick={() =>
                  changeEventPage(currentEventPage + 1)
                }
                className="rounded-lg bg-blue-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                View Next 10
              </button>
            </div>
          </div>

        </div>

      )}

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

    </div>
  );
}

function EventDetail({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-white px-3 py-2">
      <div className="text-[11px] font-semibold uppercase text-slate-400">
        {label}
      </div>
      <div className="text-sm font-semibold text-slate-900">
        {value}
      </div>
    </div>
  );
}
