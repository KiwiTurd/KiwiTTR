import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Edit3,
  Eye,
  Pencil,
  Plus,
  Search,
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

type EditForm = {
  name: string;
  eventDescription: string;
  clubId: string;
  date: string;
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
  | "live"
  | "upcoming"
  | "past";

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
    saveTournament,
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

  const [page, setPage] =
    useState(0);

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

  useEffect(() => {
    setPage(0);
    setExpandedTournamentId(null);
  }, [
    search,
    clubFilter,
    statusFilter,
  ]);

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
          : tournament.settings.format === "doubles"
            ? "doubles knockout"
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

      if (saved.settings.allowSignUp) {
        await saveTournament({
          ...saved,
          settings: {
            ...saved.settings,
            allowSignUp: false,
          },
        });
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

    if (!editForm.clubId || !editForm.date) {
      notify.timeout(
        "Please choose a club and date."
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

  const today = new Date()
    .toISOString()
    .slice(0, 10);

  function tournamentFormatLabel(
    tournament: SavedTournament
  ) {
    return tournament.settings.format === "pools"
      ? "Pools -> Knockout"
      : tournament.settings.format === "doubles"
        ? "Doubles Knockout"
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
        !drawBuilt &&
        !isFinished &&
        !isCancelled &&
        !signupClosedByDate,
    };
  }

  const statusFilteredTournaments =
    filteredTournaments
      .filter(tournament => {
        const state =
          tournamentState(tournament);

        if (statusFilter === "live") {
          return state.isLive;
        }

        if (statusFilter === "upcoming") {
          return state.isUpcoming;
        }

        return !state.isLive && !state.isUpcoming;
      })
      .sort((a, b) => {
        const aDate =
          new Date(a.settings.date).getTime();
        const bDate =
          new Date(b.settings.date).getTime();

        return statusFilter === "past"
          ? bDate - aDate
          : aDate - bDate;
      });

  const pageSize = 10;
  const pageCount = Math.ceil(
    statusFilteredTournaments.length / pageSize
  );
  const paginatedTournaments =
    statusFilteredTournaments.slice(
      page * pageSize,
      page * pageSize + pageSize
    );
  const filterTitle =
    statusFilter === "live"
      ? "Live Tournaments"
      : statusFilter === "past"
        ? "Past Tournaments"
        : "Upcoming Tournaments";
  const liveTournamentCount =
    savedTournaments.filter(
      tournament => tournamentState(tournament).isLive
    ).length;
  const upcomingTournamentCount =
    savedTournaments.filter(
      tournament =>
        tournamentState(tournament).isUpcoming
    ).length;

  function renderTournamentSection(
    title: string,
    tournaments: SavedTournament[],
    emptyText: string,
    totalCount = tournaments.length
  ) {
    return (
      <section className="rounded-3xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-xl font-bold">
            {title}
          </h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
            {totalCount}
          </span>
        </div>

        {tournaments.length === 0 ? (
          <div className="px-5 py-8 text-sm text-slate-500">
            {emptyText}
          </div>
        ) : (
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
                    className="flex w-full items-center justify-between gap-4 px-5 py-3 text-left transition hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-medium">
                          {tournament.settings.name}
                        </h3>
                        {(state.isFinished ||
                          state.isCancelled) && (
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                            {state.isFinished
                              ? "Finished"
                              : "Cancelled"}
                          </span>
                        )}
                        {state.isLive && (
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                            Live
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">
                        {new Date(
                          tournament.settings.date
                        ).toLocaleDateString()}
                        {" "}·{" "}
                        {clubNameById.get(
                          tournament.settings.clubId
                        ) ?? "Club"}
                        {" "}·{" "}
                        {tournamentFormatLabel(
                          tournament
                        )}
                      </p>
                    </div>
                    {expanded ? (
                      <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
                    )}
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

                        {state.signUpsOpen && signedUp && (
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
                            Edit Draws
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  return (

    <div className="max-w-7xl mx-auto space-y-8">

      {/* Header */}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
            <Trophy className="h-4 w-4" />
            Tournament Centre
          </div>

          <h1 className="mt-4 text-5xl font-black tracking-tight">
            Tournaments
          </h1>

          <p className="mt-3 text-lg text-slate-500">
            Create, manage and run KiwiTTR tournaments.
          </p>
        </div>

        {canCreateTournament && (
          <Link
            to="/tournaments/new"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-800"
          >
            <Plus className="h-5 w-5" />
            Create Tournament
          </Link>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Trophy className="h-5 w-5 text-blue-700" />
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              Tournaments
            </p>
            <p className="text-xl font-black">
              {savedTournaments.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Eye className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              Live
            </p>
            <p className="text-xl font-black">
              {liveTournamentCount}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <CalendarDays className="h-5 w-5 text-amber-600" />
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              Upcoming
            </p>
            <p className="text-xl font-black">
              {upcomingTournamentCount}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">

        <div>
          <h2 className="text-2xl font-bold">
            Tournament Lists
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Choose a tournament to expand its details.
          </p>
        </div>

        <div className="grid w-full gap-3 md:w-auto md:grid-cols-[280px_220px_180px]">

          <div className="relative">

            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search tournaments"
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
            />

          </div>

          <select
            value={clubFilter}
            onChange={(event) =>
              setClubFilter(event.target.value)
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
          >

            <option value="">
              All clubs
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

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as TournamentFilter
              )
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
          >
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

              Try another search or club filter.

            </p>

          </div>

      ) : (
        <div className="space-y-6">
          {renderTournamentSection(
            filterTitle,
            paginatedTournaments,
            `No ${statusFilter} tournaments match your filters.`,
            statusFilteredTournaments.length
          )}

          {statusFilteredTournaments.length > pageSize && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-medium text-slate-500">
                Page {page + 1} of {pageCount}
              </div>
              <div className="flex gap-3">
                {page > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setPage(current =>
                        Math.max(0, current - 1)
                      )
                    }
                    className="rounded-xl border bg-white px-4 py-3 font-semibold hover:bg-slate-50"
                  >
                    Previous Page
                  </button>
                )}

                {page < pageCount - 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setPage(current =>
                        current + 1
                      )
                    }
                    className="rounded-xl bg-blue-900 px-4 py-3 font-semibold text-white hover:bg-blue-800"
                  >
                    Next Page
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
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
