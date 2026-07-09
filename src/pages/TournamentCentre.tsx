import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";

import {
  CalendarDays,
  Eye,
  Pencil,
  Plus,
  Search,
  Trophy,
} from "lucide-react";

import useRole from "../hooks/useRole";
import { useTournament } from "../context/TournamentContext";
import type { Club } from "../types/club";
import { getClubs } from "../services/supabase/clubService";
import { notify } from "../services/notificationService";

export default function TournamentCentre() {
  const {
    isAdmin,
    isClubLeader,
  } = useRole();

  const canCreateTournament =
    isAdmin || isClubLeader;

  const { savedTournaments } =
    useTournament();

  const [clubs, setClubs] =
    useState<Club[]>([]);

  const [search, setSearch] =
    useState("");

  const [clubFilter, setClubFilter] =
    useState("");

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

  return (

    <div className="max-w-7xl mx-auto space-y-8">

      {/* Header */}

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

      {/* New Tournament */}

      {canCreateTournament && (
        <Link
          to="/tournaments/new"
          className="
            group
            flex
            items-center
            justify-center
            gap-4

            rounded-3xl

            border-2
            border-dashed
            border-blue-300

            bg-white

            py-16

            shadow-sm

            transition

            hover:border-blue-700
            hover:bg-blue-50
          "
        >

          <Plus className="h-8 w-8 text-blue-800" />

          <span className="text-2xl font-bold text-blue-900">

            Create Tournament

          </span>

        </Link>
      )}

      {/* Recent tournaments */}

      <div>

        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">

        <h2 className="text-2xl font-bold">

          Recent Tournaments

        </h2>

        <div className="grid w-full gap-3 md:w-auto md:grid-cols-[280px_220px]">

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

          <div className="grid gap-5 lg:grid-cols-2">

            {filteredTournaments.map((tournament) => {
              const liveMatches =
                tournament.knockout.filter(
                  match =>
                    !match.completed &&
                    match.playerOne &&
                    match.playerTwo
                ).length;

              const formatLabel =
                tournament.settings.format === "pools"
                  ? "Pools → Knockout"
                  : tournament.settings.format === "doubles"
                    ? "Doubles Knockout"
                    : "Straight Knockout";

              return (
                <div
                  key={tournament.id}
                  className="rounded-3xl border bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
                        <Trophy className="h-4 w-4" />
                        {formatLabel}
                      </div>

                      <h3 className="mt-4 text-2xl font-black">
                        {tournament.settings.name}
                      </h3>

                      <p className="mt-2 text-slate-500">
                        {new Date(
                          tournament.settings.date
                        ).toLocaleDateString()}
                        {" "}·{" "}
                        {tournament.settings.playerCount} players
                        {" "}·{" "}
                        {clubNameById.get(
                          tournament.settings.clubId
                        ) ?? "Club"}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-500">
                        Live
                      </div>
                      <div className="text-3xl font-black text-green-700">
                        {liveMatches}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      to={`/tournaments/${tournament.id}/viewer`}
                      className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 font-semibold hover:bg-slate-50"
                    >
                      <Eye className="h-4 w-4" />
                      Viewer
                    </Link>

                    {isAdmin && (
                      <Link
                        to={`/tournaments/${tournament.id}/live`}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-4 py-3 font-semibold text-white hover:bg-blue-800"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit Draws
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}

          </div>

        )}

      </div>

    </div>

  );

}
