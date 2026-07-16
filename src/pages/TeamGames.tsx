import {
  Building2,
  CalendarDays,
  ChevronRight,
  Plus,
  Search,
  Shield,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";
import {
  Link,
} from "react-router-dom";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { notify } from "../services/notificationService";
import { getTeamGames } from "../services/teams/teamGameService";
import {
  teamGameFormatLabel,
  teamGameStatusLabel,
  type TeamGameStatus,
} from "../services/teams/teamEngine";
import type { TeamGameFormat } from "../services/teams/teamEngine";
import LoadingScreen from "../components/shared/LoadingScreen";
import { formatStartTime } from "../utils/tournamentTime";
import { getNewZealandDate } from "../utils/newZealandDate";

type StatusFilter =
  | "all"
  | TeamGameStatus;

const TEAM_GAMES_PER_PAGE = 10;

export default function TeamGames() {
  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<StatusFilter>("all");

  const [formatFilter, setFormatFilter] =
    useState("all");
  const [clubFilter, setClubFilter] =
    useState("all");
  const [teamGamePage, setTeamGamePage] =
    useState(0);
  const teamGameListRef =
    useRef<HTMLDivElement | null>(null);
  const [teamGames, setTeamGames] =
    useState<
      Array<{
        id: string;
        name: string;
        clubName: string;
        date: string;
        startTime: string | null;
        status: TeamGameStatus;
        format: TeamGameFormat | undefined;
        matchesPlayed: number;
        totalMatches: number;
      }>
    >([]);
  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadGames() {
      try {
        const games = await getTeamGames();

        if (!cancelled) {
          setTeamGames(games);
        }
      } catch (error) {
        console.error(error);
        notify.fault(
          "Unable to load team games."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadGames();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredGames = useMemo(() => {
    const query =
      search.trim().toLowerCase();
    const today = getNewZealandDate();
    const todayTime = Date.parse(
      `${today}T00:00:00Z`
    );

    return teamGames
      .filter((game) => {
        if (
          clubFilter !== "all" &&
          game.clubName !== clubFilter
        ) {
          return false;
        }

        if (
          statusFilter !== "all" &&
          game.status !== statusFilter
        ) {
          return false;
        }

        if (
          formatFilter !== "all" &&
          game.format !== formatFilter
        ) {
          return false;
        }

        if (!query) {
          return true;
        }

        return [
          game.name,
          game.clubName,
          game.date,
          game.status,
          game.format,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
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
    formatFilter,
    search,
    statusFilter,
    teamGames,
  ]);

  const clubs = useMemo(
    () =>
      Array.from(
        new Set(
          teamGames
            .map((game) => game.clubName)
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [teamGames]
  );

  const teamGamePageCount = Math.max(
    1,
    Math.ceil(
      filteredGames.length / TEAM_GAMES_PER_PAGE
    )
  );
  const currentTeamGamePage = Math.min(
    teamGamePage,
    teamGamePageCount - 1
  );
  const paginatedGames = useMemo(() => {
    const start =
      currentTeamGamePage * TEAM_GAMES_PER_PAGE;

    return filteredGames.slice(
      start,
      start + TEAM_GAMES_PER_PAGE
    );
  }, [currentTeamGamePage, filteredGames]);

  function changeTeamGamePage(nextPage: number) {
    setTeamGamePage(nextPage);

    window.setTimeout(() => {
      teamGameListRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }

  const liveGames = teamGames.filter(
    (game) => game.status === "live"
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-8">

      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-300 pb-6 md:items-end">
        <div className="team-games-page-header-copy">
          <h1 className="mt-2 text-5xl font-normal tracking-tight text-slate-900">
            Team Games
          </h1>

          <p className="mt-3 text-lg text-slate-500">
            View team game formats, live team fixtures and upcoming team events.
          </p>
        </div>

        <Link
          to="/team-games/new"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-slate-700"
        >
          <Plus className="h-5 w-5" />
          Create Event
        </Link>
      </div>

      <section className="space-y-8">
        <div
          ref={teamGameListRef}
          className="scroll-mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setTeamGamePage(0);
              }}
              placeholder="Search team games by name, club, status or date"
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
                  setTeamGamePage(0);
                }}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
              >
                <option value="all">
                  All Clubs
                </option>
                {clubs.map((club) => (
                  <option key={club} value={club}>
                    {club}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                <Shield className="h-4 w-4" />
                Status
              </span>
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(
                    event.target
                      .value as StatusFilter
                  );
                  setTeamGamePage(0);
                }}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
              >
                <option value="all">
                  All Statuses
                </option>
                <option value="upcoming">
                  Upcoming
                </option>
                <option value="live">
                  Live
                </option>
                <option value="completed">
                  Completed
                </option>
                <option value="draft">
                  Draft
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
                  setFormatFilter(event.target.value);
                  setTeamGamePage(0);
                }}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
              >
                <option value="all">
                  All Formats
                </option>
                <option value="classic-6">
                  Classic 6
                </option>
                <option value="classic-3">
                  Classic 3
                </option>
                <option value="abc-123">
                  ABC v 123
                </option>
                <option value="custom">
                  Custom
                </option>
                <option value="teams">
                  Teams
                </option>
                <option value="round-robin">
                  Round Robin
                </option>
                <option value="relay">
                  Relay
                </option>
              </select>
            </label>
          </div>
        </div>

        {loading ? (
          <LoadingScreen label="Loading team games..." />
        ) : filteredGames.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
            No team games match your filters.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="hidden grid-cols-[minmax(0,2fr)_minmax(8rem,1fr)_minmax(7rem,1fr)_minmax(7rem,1fr)_minmax(5rem,0.65fr)] items-center gap-x-5 border-b bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:grid">
              <span>Team Game</span>
              <span className="text-center">Date</span>
              <span className="text-center">Format</span>
              <span className="text-center">Status</span>
              <span className="text-center">Matches</span>
            </div>

            <div className="divide-y">
              {paginatedGames.map((game) => (
                <Link
                  key={game.id}
                  to={`/team-games/${game.id}/live`}
                  className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 px-4 py-2 transition hover:bg-slate-50 md:grid-cols-[minmax(0,2fr)_minmax(8rem,1fr)_minmax(7rem,1fr)_minmax(7rem,1fr)_minmax(5rem,0.65fr)] md:gap-x-5"
                >
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <h2 className="min-w-0 truncate text-base font-medium">
                        {game.name}
                      </h2>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-1" />
                    </div>
                    <p className="truncate text-xs text-slate-500 sm:text-sm">
                      {game.clubName || "-"}
                    </p>
                  </div>

                  <div className="col-start-1 row-start-2 mt-1 text-xs text-slate-500 md:col-start-auto md:row-start-auto md:mt-0 md:text-center md:text-sm">
                    <div className="font-medium text-slate-700">
                      {new Date(game.date).toLocaleDateString()}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {game.startTime
                        ? formatStartTime(game.startTime)
                        : "Time not set"}
                    </div>
                  </div>

                  <div className="col-start-2 row-start-2 mt-1 flex justify-end md:col-start-auto md:row-start-auto md:mt-0 md:justify-center">
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      {teamGameFormatLabel(
                        game.format ?? "classic-6"
                      )}
                    </span>
                  </div>

                  <div className="col-span-2 mt-1 flex justify-start md:col-span-1 md:mt-0 md:justify-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        game.status === "live"
                          ? "bg-green-100 text-green-700"
                          : game.status === "upcoming"
                            ? "bg-indigo-100 text-indigo-700"
                            : game.status === "draft"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {teamGameStatusLabel(game.status)}
                    </span>
                  </div>

                  <div className="col-start-2 row-start-1 text-right text-sm font-bold text-slate-700 md:col-start-auto md:row-start-auto md:text-center">
                    {game.matchesPlayed}/{game.totalMatches}
                  </div>
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-3 border-t bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing{" "}
                {currentTeamGamePage * TEAM_GAMES_PER_PAGE + 1}
                –
                {Math.min(
                  (currentTeamGamePage + 1) *
                    TEAM_GAMES_PER_PAGE,
                  filteredGames.length
                )}{" "}
                of {filteredGames.length}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={currentTeamGamePage === 0}
                  onClick={() =>
                    changeTeamGamePage(
                      currentTeamGamePage - 1
                    )
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous 10
                </button>
                <button
                  type="button"
                  disabled={
                    currentTeamGamePage >=
                    teamGamePageCount - 1
                  }
                  onClick={() =>
                    changeTeamGamePage(
                      currentTeamGamePage + 1
                    )
                  }
                  className="rounded-lg bg-blue-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  View Next 10
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <UsersRound className="h-5 w-5 text-emerald-600" />
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              Team Games
            </p>
            <p className="text-xl font-black">
              {teamGames.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Shield className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              Live
            </p>
            <p className="text-xl font-black">
              {liveGames}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <CalendarDays className="h-5 w-5 text-blue-700" />
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              Upcoming
            </p>
            <p className="text-xl font-black">
              {
                teamGames.filter(
                  (game) =>
                    game.status === "upcoming"
                ).length
              }
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
