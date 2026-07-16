import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Edit3,
  Eye,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Trophy,
  UserPlus,
  XCircle,
} from "lucide-react";

import useRole from "../hooks/useRole";
import { useTournament } from "../context/TournamentContext";
import type { Club } from "../types/club";
import type { SavedTournament } from "../types/tournament";
import { getClubs } from "../services/supabase/clubService";
import { notify } from "../services/notificationService";
import { formatStartTime } from "../utils/tournamentTime";
import { getNewZealandDate } from "../utils/newZealandDate";

type EditForm = {
  name: string;
  eventDescription: string;
  clubId: string;
  date: string;
  startTime: string;
  allowSignUp: boolean;
  signUpClosesAt: string;
  playerLimitEnabled: boolean;
  playerCount: string;
  seedByTTR: boolean;
  socialPlay: boolean;
  ttrLimitEnabled: boolean;
  ttrLimit: string;
};

type TournamentFilter =
  | "all"
  | "live"
  | "upcoming"
  | "past";

type TournamentFormatFilter =
  | "all"
  | SavedTournament["settings"]["format"];

const TOURNAMENTS_PER_PAGE = 10;

export default function TournamentCentre() {
  const navigate = useNavigate();

  const {
    isAdmin,
    isClubLeader,
    clubId: userClubId,
    playerId: linkedPlayerId,
  } = useRole();

  const canCreateTournament =
    isAdmin || isClubLeader;

  const {
    savedTournaments,
    loadTournament,
    signUpForTournament,
    updateTournamentDetails,
    cancelTournament,
    deleteTournament,
  } =
    useTournament();

  const [clubs, setClubs] =
    useState<Club[]>([]);

  const [search, setSearch] =
    useState("");

  const [clubFilter, setClubFilter] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<TournamentFilter>("upcoming");

  const [formatFilter, setFormatFilter] =
    useState<TournamentFormatFilter>("all");

  const [page, setPage] =
    useState(0);

  const tournamentListRef =
    useRef<HTMLDivElement | null>(null);

  const [
    signingUpTournamentId,
    setSigningUpTournamentId,
  ] = useState<string | null>(null);

  const [
    loadingTournamentId,
    setLoadingTournamentId,
  ] = useState<string | null>(null);

  const [
    editingTournament,
    setEditingTournament,
  ] = useState<SavedTournament | null>(null);

  const [editForm, setEditForm] =
    useState<EditForm | null>(null);

  const [
    savingEdit,
    setSavingEdit,
  ] = useState(false);

  const [
    managingTournamentId,
    setManagingTournamentId,
  ] = useState<string | null>(null);

  const [
    expandedTournamentId,
    setExpandedTournamentId,
  ] = useState<string | null>(null);

  useEffect(() => {
    async function loadClubs() {
      try {
        setClubs(await getClubs());
      } catch (error) {
        console.error(error);
        notify.fault("Unable to load club filters.");
      }
    }

    void loadClubs();
  }, []);

  const clubNameById = useMemo(() => {
    return new Map(
      clubs.map(club => [
        club.id,
        club.name,
      ])
    );
  }, [clubs]);

  const filteredTournaments = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return savedTournaments.filter(tournament => {
      if (
        clubFilter &&
        tournament.settings.clubId !== clubFilter
      ) {
        return false;
      }

      if (
        formatFilter !== "all" &&
        tournament.settings.format !== formatFilter
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      const clubName =
        clubNameById.get(
          tournament.settings.clubId
        ) ?? "";

      const formatLabel =
        tournament.settings.format === "pools"
          ? "pools knockout"
          : tournament.settings.format === "pool-ratings"
            ? "pool only ratings round robin"
          : tournament.settings.format === "doubles"
            ? "doubles knockout"
            : tournament.settings.format === "double-knockout"
              ? "double knockout double elimination"
            : "straight knockout";

      return [
        tournament.settings.name,
        clubName,
        tournament.settings.date,
        formatLabel,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [
    clubFilter,
    clubNameById,
    formatFilter,
    savedTournaments,
    search,
  ]);

  async function handleSignUp(
    tournamentId: string
  ) {
    if (!linkedPlayerId) {
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
      notify.fault("Unable to sign up.");
    } finally {
      setSigningUpTournamentId(null);
    }
  }

  async function continueSetup(
    tournamentId: string
  ) {
    setLoadingTournamentId(tournamentId);

    try {
      const saved =
        await loadTournament(tournamentId);

      if (!saved) {
        notify.timeout(
          "Tournament could not be loaded."
        );
        return;
      }

      navigate("/tournaments/players");
    } catch (error) {
      console.error(error);
      notify.fault(
        "Unable to continue tournament setup."
      );
    } finally {
      setLoadingTournamentId(null);
    }
  }

  function openEditTournament(
    tournament: SavedTournament
  ) {
    setEditingTournament(tournament);
    setEditForm({
      name: tournament.settings.name,
      eventDescription:
        tournament.settings.eventDescription,
      clubId: tournament.settings.clubId,
      date: tournament.settings.date,
      startTime: tournament.settings.startTime,
      allowSignUp:
        tournament.settings.allowSignUp,
      signUpClosesAt:
        tournament.settings.signUpClosesAt ?? "",
      playerLimitEnabled:
        tournament.settings.playerLimitEnabled,
      playerCount:
        String(tournament.settings.playerCount),
      seedByTTR:
        tournament.settings.seedByTTR,
      socialPlay:
        tournament.settings.socialPlay,
      ttrLimitEnabled:
        tournament.settings.ttrLimitEnabled,
      ttrLimit:
        String(tournament.settings.ttrLimit),
    });
  }

  async function saveEditTournament() {
    if (!editingTournament || !editForm) {
      return;
    }

    const playerCount =
      editForm.playerLimitEnabled
        ? Number(editForm.playerCount)
        : editingTournament.settings.playerCount;
    const ttrLimit =
      editForm.ttrLimitEnabled
        ? Number(editForm.ttrLimit)
        : editingTournament.settings.ttrLimit;

    if (!editForm.name.trim()) {
      notify.timeout(
        "Please enter a tournament name."
      );
      return;
    }

    if (
      !editForm.clubId ||
      !editForm.date ||
      !editForm.startTime
    ) {
      notify.timeout(
        "Please choose a club, date and start time."
      );
      return;
    }

    if (
      editForm.playerLimitEnabled &&
      (
        !Number.isInteger(playerCount) ||
        playerCount < 2 ||
        playerCount > 256
      )
    ) {
      notify.timeout(
        "Please enter a whole number of players between 2 and 256."
      );
      return;
    }

    if (
      editForm.ttrLimitEnabled &&
      (
        !Number.isInteger(ttrLimit) ||
        ttrLimit < 0
      )
    ) {
      notify.timeout(
        "Please enter a valid whole-number TTR limit."
      );
      return;
    }

    setSavingEdit(true);

    try {
      await updateTournamentDetails({
        ...editingTournament,
        settings: {
          ...editingTournament.settings,
          name: editForm.name.trim(),
          eventDescription:
            editForm.eventDescription.trim(),
          clubId: editForm.clubId,
          date: editForm.date,
          startTime: editForm.startTime,
          allowSignUp: editForm.allowSignUp,
          signUpClosesAt:
            editForm.allowSignUp &&
            editForm.signUpClosesAt
              ? editForm.signUpClosesAt
              : null,
          playerLimitEnabled:
            editForm.playerLimitEnabled,
          playerCount,
          seedByTTR:
            editForm.socialPlay
              ? false
              : editForm.seedByTTR,
          socialPlay: editForm.socialPlay,
          ttrLimitEnabled:
            editForm.ttrLimitEnabled,
          ttrLimit,
        },
      });

      notify.edgeBall(
        "Tournament details updated."
      );
      setEditingTournament(null);
      setEditForm(null);
    } catch (error) {
      console.error(error);
      notify.fault(
        error instanceof Error
          ? error.message
          : "Unable to update tournament."
      );
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleCancelTournament(
    tournament: SavedTournament
  ) {
    if (
      !window.confirm(
        `Cancel ${tournament.settings.name}?`
      )
    ) {
      return;
    }

    setManagingTournamentId(tournament.id);

    try {
      await cancelTournament(tournament.id);
      notify.edgeBall("Tournament cancelled.");
    } catch (error) {
      console.error(error);
      notify.fault("Unable to cancel tournament.");
    } finally {
      setManagingTournamentId(null);
    }
  }

  async function handleDeleteTournament(
    tournament: SavedTournament
  ) {
    if (
      !window.confirm(
        `Delete ${tournament.settings.name}? This cannot be undone.`
      )
    ) {
      return;
    }

    setManagingTournamentId(tournament.id);

    try {
      await deleteTournament(tournament.id);
      notify.edgeBall("Tournament deleted.");
    } catch (error) {
      console.error(error);
      notify.fault("Unable to delete tournament.");
    } finally {
      setManagingTournamentId(null);
    }
  }

  const today = getNewZealandDate();

  function tournamentFormatLabel(
    tournament: SavedTournament
  ) {
    return tournament.settings.format === "pools"
      ? "Pools -> Knockout"
      : tournament.settings.format === "pool-ratings"
        ? "Pool Only Ratings"
      : tournament.settings.format === "doubles"
        ? "Doubles Knockout"
        : tournament.settings.format === "double-knockout"
          ? "Double Knockout"
        : "Straight Knockout";
  }

  function tournamentMatchStats(
    tournament: SavedTournament
  ) {
    const total =
      tournament.matches.length +
      tournament.knockout.length;
    const completed = [
      ...tournament.matches,
      ...tournament.knockout,
    ].filter(match => match.completed).length;

    return {
      total,
      completed,
      live:
        tournament.knockout.filter(
          match =>
            !match.completed &&
            match.playerOne &&
            match.playerTwo
        ).length,
    };
  }

  function tournamentState(
    tournament: SavedTournament
  ) {
    const stats =
      tournamentMatchStats(tournament);
    const isFinished =
      tournament.status === "completed";
    const isCancelled =
      tournament.status === "cancelled";
    const drawBuilt = stats.total > 0;
    const isLive =
      !isFinished &&
      !isCancelled &&
      tournament.status === "active" &&
      drawBuilt &&
      stats.completed < stats.total;
    const isUpcoming =
      !isLive &&
      !isFinished &&
      !isCancelled &&
      tournament.settings.date >= today;
    const signupClosedByDate =
      Boolean(
        tournament.settings.signUpClosesAt
      ) &&
      new Date(
        tournament.settings.signUpClosesAt ?? ""
      ) <
        new Date(today);

    return {
      stats,
      isFinished,
      isCancelled,
      drawBuilt,
      isLive,
      isUpcoming,
      signupClosedByDate,
      signUpsOpen:
        tournament.settings.allowSignUp &&
        tournament.status === "draft" &&
        !signupClosedByDate,
    };
  }

  const statusFilteredTournaments =
    filteredTournaments
      .filter(tournament => {
        const state =
          tournamentState(tournament);

        if (statusFilter === "all") {
          return true;
        }

        if (statusFilter === "live") {
          return state.isLive;
        }

        if (statusFilter === "upcoming") {
          return state.isUpcoming;
        }

        return !state.isLive && !state.isUpcoming;
      })
      .sort((a, b) => {
        const todayTime = Date.parse(
          `${today}T00:00:00Z`
        );
        const aDistance = Math.abs(
          Date.parse(
            `${a.settings.date}T00:00:00Z`
          ) - todayTime
        );
        const bDistance = Math.abs(
          Date.parse(
            `${b.settings.date}T00:00:00Z`
          ) - todayTime
        );

        return (
          aDistance - bDistance ||
          a.settings.date.localeCompare(
            b.settings.date
          ) ||
          a.settings.name.localeCompare(
            b.settings.name
          )
        );
      });

  const pageCount = Math.max(
    1,
    Math.ceil(
      statusFilteredTournaments.length /
        TOURNAMENTS_PER_PAGE
    )
  );
  const currentPage = Math.min(
    page,
    pageCount - 1
  );
  const paginatedTournaments =
    statusFilteredTournaments.slice(
      currentPage * TOURNAMENTS_PER_PAGE,
      currentPage * TOURNAMENTS_PER_PAGE +
        TOURNAMENTS_PER_PAGE
    );
  const liveTournamentCount =
    savedTournaments.filter(
      tournament => tournamentState(tournament).isLive
    ).length;
  const upcomingTournamentCount =
    savedTournaments.filter(
      tournament =>
        tournamentState(tournament).isUpcoming
    ).length;

  function changeTournamentPage(nextPage: number) {
    setPage(nextPage);
    setExpandedTournamentId(null);

    window.setTimeout(() => {
      tournamentListRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }

  function changeStatusFilter(
    nextStatus: TournamentFilter
  ) {
    setStatusFilter(nextStatus);
    setPage(0);
    setExpandedTournamentId(null);
  }

  function renderTournamentSection(
    tournaments: SavedTournament[],
    emptyText: string
  ) {
    return (
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden grid-cols-[minmax(0,2fr)_minmax(8rem,1fr)_minmax(8rem,1fr)_minmax(7rem,1fr)] items-center gap-x-5 border-b bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:grid">
          <span>Tournament</span>
          <span className="text-center">Date</span>
          <span className="text-center">Format</span>
          <span className="text-center">Status</span>
        </div>

        {tournaments.length === 0 ? (
          <div className="px-5 py-8 text-sm text-slate-500">
            {emptyText}
          </div>
        ) : (
          <>
            <div className="divide-y">
              {tournaments.map(tournament => {
              const state =
                tournamentState(tournament);
              const expanded =
                expandedTournamentId ===
                tournament.id;
              const signedUp =
                Boolean(linkedPlayerId) &&
                tournament.players.some(
                  player =>
                    player.id === linkedPlayerId
                );
              const isFull =
                tournament.settings.playerLimitEnabled &&
                tournament.players.length >=
                  tournament.settings.playerCount;
              const canHostTournament =
                isAdmin ||
                (
                  isClubLeader &&
                  userClubId ===
                    tournament.settings.clubId
                );
              const canSignUp =
                state.signUpsOpen &&
                Boolean(linkedPlayerId) &&
                !signedUp &&
                !isFull;

              return (
                <div key={tournament.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedTournamentId(
                        expanded
                          ? null
                          : tournament.id
                      )
                    }
                    className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 px-4 py-2 text-left transition hover:bg-slate-50 md:grid-cols-[minmax(0,2fr)_minmax(8rem,1fr)_minmax(8rem,1fr)_minmax(7rem,1fr)] md:gap-x-5"
                  >
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <h3 className="min-w-0 truncate text-base font-medium">
                          {tournament.settings.name}
                        </h3>
                        {expanded ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                        )}
                      </div>
                      <p className="truncate text-xs text-slate-500 sm:text-sm">
                        {clubNameById.get(
                          tournament.settings.clubId
                        ) ?? "Club"}
                      </p>
                    </div>

                    <div className="col-start-1 row-start-2 mt-1 text-xs text-slate-500 md:col-start-auto md:row-start-auto md:mt-0 md:text-center md:text-sm">
                      <div className="font-medium text-slate-700">
                        {new Date(
                          tournament.settings.date
                        ).toLocaleDateString()}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {tournament.settings.startTime
                          ? formatStartTime(
                              tournament.settings.startTime
                            )
                          : "Time not set"}
                      </div>
                    </div>

                    <div className="col-start-2 row-start-2 mt-1 flex justify-end md:col-start-auto md:row-start-auto md:mt-0 md:justify-center">
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                        {tournamentFormatLabel(tournament)}
                      </span>
                    </div>

                    <div className="col-span-2 mt-1 flex justify-start md:col-span-1 md:mt-0 md:justify-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          state.isLive
                            ? "bg-green-100 text-green-700"
                            : state.isUpcoming
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {state.isFinished
                          ? "Finished"
                          : state.isCancelled
                            ? "Cancelled"
                            : state.isLive
                              ? "Live"
                              : state.isUpcoming
                                ? "Upcoming"
                                : "Past"}
                      </span>
                    </div>
                  </button>

                  {expanded && (
                    <div className="space-y-3 bg-slate-50 px-4 py-3">
                      {tournament.settings.eventDescription && (
                        <p className="whitespace-pre-line rounded-xl border bg-white px-3 py-2 text-sm text-slate-700">
                          {tournament.settings.eventDescription}
                        </p>
                      )}

                      <div className="grid gap-2 md:grid-cols-3">
                        <DetailItem
                          label="Date"
                          value={new Date(
                            tournament.settings.date
                          ).toLocaleDateString()}
                        />
                        <DetailItem
                          label="Start Time"
                          value={formatStartTime(
                            tournament.settings.startTime
                          )}
                        />
                        <DetailItem
                          label="Club"
                          value={
                            clubNameById.get(
                              tournament.settings.clubId
                            ) ?? "Club"
                          }
                        />
                        <DetailItem
                          label="Format"
                          value={tournamentFormatLabel(
                            tournament
                          )}
                        />
                        <DetailItem
                          label="Player Limit"
                          value={
                            tournament.settings
                              .playerLimitEnabled
                              ? tournament.settings
                                  .playerCount
                              : "Dynamic"
                          }
                        />
                        <DetailItem
                          label="Sign Ups"
                          value={
                            state.signUpsOpen
                              ? "Open"
                              : tournament.settings
                                    .allowSignUp
                                ? "Closed"
                                : "Off"
                          }
                        />
                        <DetailItem
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
                        <DetailItem
                          label="TTR Limit"
                          value={
                            tournament.settings
                              .ttrLimitEnabled
                              ? `Max ${tournament.settings.ttrLimit}`
                              : "Off"
                          }
                        />
                        <DetailItem
                          label="Seeding"
                          value={
                            tournament.settings.seedByTTR
                              ? "KiwiTTR Rating"
                              : "Random"
                          }
                        />
                        <DetailItem
                          label="Status"
                          value={
                            state.isFinished
                              ? "Finished"
                              : state.isCancelled
                                ? "Cancelled"
                                : state.isLive
                                  ? "Live"
                                  : "Upcoming"
                          }
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          to={`/tournaments/${tournament.id}/viewer`}
                          className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                        >
                          <Eye className="h-4 w-4" />
                          Viewer
                        </Link>

                        {signedUp && (
                          <button
                            type="button"
                            disabled
                            className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-800"
                          >
                            <Check className="h-4 w-4" />
                            Signed Up
                          </button>
                        )}

                        {canSignUp && (
                          <button
                            type="button"
                            disabled={
                              signingUpTournamentId ===
                              tournament.id
                            }
                            onClick={() =>
                              void handleSignUp(
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

                        {state.signUpsOpen &&
                          linkedPlayerId &&
                          !signedUp &&
                          isFull && (
                            <button
                              type="button"
                              disabled
                              className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-slate-500"
                            >
                              Full
                            </button>
                          )}

                        {canHostTournament &&
                          tournament.status === "draft" &&
                          !state.isFinished &&
                          !state.isCancelled && (
                            <button
                              type="button"
                              disabled={
                                loadingTournamentId ===
                                tournament.id
                              }
                              onClick={() =>
                                void continueSetup(
                                  tournament.id
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <ArrowRight className="h-4 w-4" />
                              {loadingTournamentId ===
                              tournament.id
                                ? "Loading"
                                : "Build Draw"}
                            </button>
                          )}

                        {canHostTournament &&
                          tournament.status === "draft" &&
                          !state.isFinished &&
                          !state.isCancelled && (
                            <button
                              type="button"
                              onClick={() =>
                                openEditTournament(
                                  tournament
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                            >
                              <Edit3 className="h-4 w-4" />
                              Edit Details
                            </button>
                          )}

                        {canHostTournament &&
                          !state.isFinished &&
                          !state.isCancelled && (
                            <button
                              type="button"
                              disabled={
                                managingTournamentId ===
                                tournament.id
                              }
                              onClick={() =>
                                void handleCancelTournament(
                                  tournament
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <XCircle className="h-4 w-4" />
                              Cancel
                            </button>
                          )}

                        {canHostTournament &&
                          !state.isFinished && (
                            <button
                              type="button"
                              disabled={
                                managingTournamentId ===
                                tournament.id
                              }
                              onClick={() =>
                                void handleDeleteTournament(
                                  tournament
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          )}

                        {canHostTournament && (
                          <Link
                            to={`/tournaments/${tournament.id}/live`}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                          >
                            <Pencil className="h-4 w-4" />
                            Match Centre
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
              })}
            </div>

            <div className="flex flex-col gap-3 border-t bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing{" "}
                {currentPage * TOURNAMENTS_PER_PAGE + 1}
                –
                {Math.min(
                  (currentPage + 1) *
                    TOURNAMENTS_PER_PAGE,
                  statusFilteredTournaments.length
                )}{" "}
                of {statusFilteredTournaments.length}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={currentPage === 0}
                  onClick={() =>
                    changeTournamentPage(currentPage - 1)
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous 10
                </button>
                <button
                  type="button"
                  disabled={currentPage >= pageCount - 1}
                  onClick={() =>
                    changeTournamentPage(currentPage + 1)
                  }
                  className="rounded-lg bg-blue-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  View Next 10
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    );
  }

  return (

    <div className="max-w-7xl mx-auto space-y-8">

      {/* Header */}

      <div className="tournament-page-header flex flex-wrap items-start justify-between gap-4 border-b border-slate-300 pb-6 md:items-end">
        <div className="tournament-page-header-copy">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
            <Trophy className="h-4 w-4" />
            Tournament Centre
          </div>

          <h1 className="mt-4 text-5xl font-normal tracking-tight text-slate-900">
            Tournaments
          </h1>

          <p className="mt-3 text-lg text-slate-500">
            Create, manage and run KiwiTTR tournaments.
          </p>
        </div>

        {canCreateTournament && (
          <Link
            to="/tournaments/new"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            <Plus className="h-5 w-5" />
            Create Tournament
          </Link>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <button
          type="button"
          aria-pressed={statusFilter === "all"}
          onClick={() => changeStatusFilter("all")}
          className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 text-left shadow-sm transition hover:border-slate-400 hover:bg-slate-50 ${
            statusFilter === "all"
              ? "border-slate-500 ring-2 ring-slate-200"
              : "border-slate-200"
          }`}
        >
          <Trophy className="h-5 w-5 text-blue-700" />
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              Tournaments
            </p>
            <p className="text-xl font-black">
              {savedTournaments.length}
            </p>
          </div>
        </button>

        <button
          type="button"
          aria-pressed={statusFilter === "live"}
          onClick={() => changeStatusFilter("live")}
          className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 text-left shadow-sm transition hover:border-green-400 hover:bg-green-50 ${
            statusFilter === "live"
              ? "border-green-500 ring-2 ring-green-100"
              : "border-slate-200"
          }`}
        >
          <Eye className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              Live
            </p>
            <p className="text-xl font-black">
              {liveTournamentCount}
            </p>
          </div>
        </button>

        <button
          type="button"
          aria-pressed={statusFilter === "upcoming"}
          onClick={() => changeStatusFilter("upcoming")}
          className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 text-left shadow-sm transition hover:border-amber-400 hover:bg-amber-50 ${
            statusFilter === "upcoming"
              ? "border-amber-500 ring-2 ring-amber-100"
              : "border-slate-200"
          }`}
        >
          <CalendarDays className="h-5 w-5 text-amber-600" />
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              Upcoming
            </p>
            <p className="text-xl font-black">
              {upcomingTournamentCount}
            </p>
          </div>
        </button>
      </div>

      <div
        ref={tournamentListRef}
        className="scroll-mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="relative">

          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
              setExpandedTournamentId(null);
            }}
            placeholder="Search tournaments by name, club or date"
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
                setPage(0);
                setExpandedTournamentId(null);
              }}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">
                All Clubs
              </option>

              {clubs.map(club => (
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
                changeStatusFilter(
                  event.target.value as TournamentFilter
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
              Format
            </span>
            <select
              value={formatFilter}
              onChange={(event) => {
                setFormatFilter(
                  event.target
                    .value as TournamentFormatFilter
                );
                setPage(0);
                setExpandedTournamentId(null);
              }}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
            >
              <option value="all">
                All Formats
              </option>
              <option value="knockout">
                Straight Knockout
              </option>
              <option value="double-knockout">
                Double Knockout
              </option>
              <option value="doubles">
                Doubles Knockout
              </option>
              <option value="pools">
                Pools to Knockout
              </option>
              <option value="pool-ratings">
                Pool Only Ratings
              </option>
            </select>
          </label>
        </div>
      </div>

      {savedTournaments.length === 0 ? (

        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">

          <CalendarDays className="mx-auto h-12 w-12 text-slate-300" />

          <h3 className="mt-5 text-xl font-semibold">

            No tournaments yet

          </h3>

          <p className="mt-2 text-slate-500">

            Create your first tournament to get started.

          </p>

        </div>

      ) : filteredTournaments.length === 0 ? (

          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">

            <CalendarDays className="mx-auto h-12 w-12 text-slate-300" />

            <h3 className="mt-5 text-xl font-semibold">

              No matching tournaments

            </h3>

            <p className="mt-2 text-slate-500">

              Try another search or filter.

            </p>

          </div>

      ) : (
        renderTournamentSection(
          paginatedTournaments,
          `No ${statusFilter} tournaments match your filters.`
        )
      )}

      {editingTournament && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">
                  Edit Tournament
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Finished tournaments are locked.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingTournament(null);
                  setEditForm(null);
                }}
                className="rounded-xl border px-3 py-2 font-semibold hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="font-medium">
                  Tournament Name
                </span>
                <input
                  value={editForm.name}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      name: event.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl border p-3"
                />
              </label>

              <label className="md:col-span-2">
                <span className="font-medium">
                  Event Description
                </span>
                <textarea
                  value={editForm.eventDescription}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      eventDescription:
                        event.target.value,
                    })
                  }
                  rows={3}
                  className="mt-2 w-full resize-none rounded-xl border p-3"
                />
              </label>

              <label>
                <span className="font-medium">
                  Club
                </span>
                {isAdmin ? (
                  <select
                    value={editForm.clubId}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        clubId: event.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-xl border p-3"
                  >
                    {clubs.map(club => (
                      <option
                        key={club.id}
                        value={club.id}
                      >
                        {club.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="mt-2 rounded-xl border bg-slate-50 p-3 font-medium">
                    {clubNameById.get(editForm.clubId) ??
                      "Club"}
                  </div>
                )}
              </label>

              <label>
                <span className="font-medium">
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
                  className="mt-2 w-full rounded-xl border p-3"
                />
              </label>

              <label>
                <span className="font-medium">
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
                  className="mt-2 w-full rounded-xl border p-3"
                />
              </label>

              <label className="flex items-center gap-3 rounded-xl border bg-slate-50 p-3 md:col-span-2">
                <input
                  type="checkbox"
                  checked={editForm.allowSignUp}
                  onChange={() =>
                    setEditForm({
                      ...editForm,
                      allowSignUp:
                        !editForm.allowSignUp,
                    })
                  }
                />
                <span className="font-medium">
                  Allow Sign Up
                </span>
              </label>

              {editForm.allowSignUp && (
                <label>
                  <span className="font-medium">
                    Sign Up Close Date
                  </span>
                  <input
                    type="date"
                    value={editForm.signUpClosesAt}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        signUpClosesAt:
                          event.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-xl border p-3"
                  />
                </label>
              )}

              <label className="flex items-center gap-3 rounded-xl border bg-slate-50 p-3 md:col-span-2">
                <input
                  type="checkbox"
                  checked={
                    editForm.playerLimitEnabled
                  }
                  onChange={() =>
                    setEditForm({
                      ...editForm,
                      playerLimitEnabled:
                        !editForm.playerLimitEnabled,
                    })
                  }
                />
                <span className="font-medium">
                  Set Player Limit
                </span>
              </label>

              {editForm.playerLimitEnabled && (
                <label>
                  <span className="font-medium">
                    Number of Players
                  </span>
                  <input
                    type="number"
                    min={2}
                    max={256}
                    value={editForm.playerCount}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        playerCount: event.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-xl border p-3"
                  />
                </label>
              )}

              <label className="flex items-center gap-3 rounded-xl border bg-slate-50 p-3">
                <input
                  type="checkbox"
                  checked={editForm.socialPlay}
                  onChange={() =>
                    setEditForm({
                      ...editForm,
                      socialPlay:
                        !editForm.socialPlay,
                    })
                  }
                />
                <span className="font-medium">
                  Social Play
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-xl border bg-slate-50 p-3">
                <input
                  type="checkbox"
                  checked={
                    !editForm.socialPlay &&
                    editForm.seedByTTR
                  }
                  disabled={editForm.socialPlay}
                  onChange={() =>
                    setEditForm({
                      ...editForm,
                      seedByTTR:
                        !editForm.seedByTTR,
                    })
                  }
                />
                <span className="font-medium">
                  Seed by TTR
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-xl border bg-slate-50 p-3 md:col-span-2">
                <input
                  type="checkbox"
                  checked={editForm.ttrLimitEnabled}
                  onChange={() =>
                    setEditForm({
                      ...editForm,
                      ttrLimitEnabled:
                        !editForm.ttrLimitEnabled,
                    })
                  }
                />
                <span className="font-medium">
                  Set TTR Limit
                </span>
              </label>

              {editForm.ttrLimitEnabled && (
                <label>
                  <span className="font-medium">
                    Maximum TTR
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={editForm.ttrLimit}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        ttrLimit: event.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-xl border p-3"
                  />
                </label>
              )}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditingTournament(null);
                  setEditForm(null);
                }}
                className="rounded-xl border px-5 py-3 font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingEdit}
                onClick={() =>
                  void saveEditTournament()
                }
                className="rounded-xl bg-blue-900 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {savingEdit
                  ? "Saving"
                  : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>

  );

}

function DetailItem({
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
