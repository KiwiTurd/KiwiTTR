import {
  ArrowRight,
  CalendarDays,
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

type StatusFilter =
  | "all"
  | TeamGameStatus;

export default function TeamGames() {
  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<StatusFilter>("all");

  const [formatFilter, setFormatFilter] =
    useState("all");
  const [teamGames, setTeamGames] =
    useState<
      Array<{
        id: string;
        name: string;
        clubName: string;
        date: string;
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

    return teamGames.filter((game) => {
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
    });
  }, [
    formatFilter,
    search,
    statusFilter,
    teamGames,
  ]);

  const liveGames = teamGames.filter(
    (game) => game.status === "live"
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-8">

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
            KiwiTTR
          </p>

          <h1 className="mt-2 text-5xl font-black tracking-tight">
            Team Games
          </h1>

          <p className="mt-3 text-lg text-slate-500">
            View team game formats, live team fixtures and upcoming team events.
          </p>
        </div>

        <Link
          to="/team-games/new"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-600"
        >
          <Plus className="h-5 w-5" />
          Create Event
        </Link>
      </div>

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

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="text-xl font-bold">
            Team Game Info
          </h2>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-semibold">
              Team Fixtures
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Build teams, lineups and fixture rounds for club nights or interclub events.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-semibold">
              Live Viewing
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Share a live team scoreboard once a team game is underway.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-semibold">
              Match Tracking
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Track team scores, completed matches and remaining fixtures.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">
            Games
          </h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search team games by name, club, status or date"
              className="w-full rounded-xl border border-slate-300 py-3 pl-12 pr-4 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                <Shield className="h-4 w-4" />
                Status
              </span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target
                      .value as StatusFilter
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
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
                onChange={(event) =>
                  setFormatFilter(event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
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
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
            Loading team games...
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
            No team games match your filters.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="divide-y">
              {filteredGames.map((game) => (
                <Link
                  key={game.id}
                  to={`/team-games/${game.id}/live`}
                  className="group flex items-center justify-between gap-4 px-5 py-3 transition hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        {teamGameFormatLabel(
                          game.format ?? "classic-6"
                        )}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {teamGameStatusLabel(game.status)}
                      </span>
                    </div>

                    <h3 className="truncate text-base font-medium">
                      {game.name}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {game.clubName} ·{" "}
                      {new Date(game.date).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-4">
                    <div className="hidden text-right sm:block">
                      <div className="text-xs font-semibold text-slate-500">
                        Matches
                      </div>
                      <div className="text-lg font-black text-slate-800">
                        {game.matchesPlayed}/{game.totalMatches}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                      View
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

    </div>
  );
}
