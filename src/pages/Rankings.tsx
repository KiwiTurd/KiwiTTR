import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  ChevronRight,
  Medal,
  Search,
  Trophy,
  Award,
} from "lucide-react";

import type { Player } from "../types/player";
import type { Club } from "../types/club";

import { getPlayers } from "../services/supabase/playerService";
import { getClubs } from "../services/supabase/clubService";

import { notify } from "../services/notificationService";

export default function Rankings() {

  const [players, setPlayers] =
    useState<Player[]>([]);

  const [clubs, setClubs] =
    useState<Club[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [clubFilter, setClubFilter] =
    useState("");

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {

    try {

      setLoading(true);

      const [
        playerData,
        clubData,
      ] = await Promise.all([
        getPlayers(),
        getClubs(),
      ]);

      setPlayers(playerData);
      setClubs(clubData);

    } catch (error) {

      console.error(error);

      notify.fault(
        "Failed to load rankings."
      );

    } finally {

      setLoading(false);

    }

  }

  const rankings = useMemo(() => {

    return players

      .filter(
        (player) => player.isActive
      )

      .filter((player) =>

        !clubFilter

          ? true

          : player.clubId ===
            clubFilter

      )

      .filter((player) =>

        `${player.firstName} ${player.lastName}`

          .toLowerCase()

          .includes(
            search.toLowerCase()
          )

      )

      .sort(
        (a, b) =>
          b.rating - a.rating
      );

  }, [
    players,
    search,
    clubFilter,
  ]);

  function getClubName(
    clubId: string
  ) {

    return (
      clubs.find(
        (club) =>
          club.id === clubId
      )?.name ?? "-"
    );

  }

function getRankBadge(rank: number) {

  if (rank === 1) {

    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-400 text-white">
        <Trophy className="h-4 w-4 fill-current" />
      </div>
    );

  }

  if (rank === 2) {

    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-400 text-white">
        <Medal className="h-4 w-4" />
      </div>
    );

  }

  if (rank === 3) {

    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-700 text-white">
        <Award className="h-4 w-4" />
      </div>
    );

  }

  return (

    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-900">

      {rank}

    </div>

  );

}
  
return (

    <div className="max-w-7xl mx-auto space-y-8">

      {/* Header */}

      <div>

        <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">

          <Trophy className="h-4 w-4" />

          National Rankings

        </div>

        <h1 className="mt-4 text-5xl font-black tracking-tight">

          Rankings

        </h1>

        <p className="mt-3 text-lg text-slate-500">

          Live KiwiTTR rankings across New Zealand.

        </p>

      </div>

      {/* Filters */}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="grid gap-4 lg:grid-cols-[1fr_260px]">

          <div className="relative">

            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              placeholder="Search players..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="
                w-full
                rounded-xl
                border
                border-slate-300
                py-3
                pl-12
                pr-4

                outline-none

                transition

                focus:border-blue-700
                focus:ring-4
                focus:ring-blue-100
              "
            />

          </div>

          <select
            value={clubFilter}
            onChange={(e) =>
              setClubFilter(e.target.value)
            }
            className="
              rounded-xl
              border
              border-slate-300

              px-4
              py-3

              outline-none

              transition

              focus:border-blue-700
              focus:ring-4
              focus:ring-blue-100
            "
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

        </div>

      </div>

      {/* Rankings */}

      <div className="space-y-3">

        {loading ? (

          <div className="rounded-3xl border bg-white p-12 text-center text-slate-500">

            Loading rankings...

          </div>

        ) : rankings.length === 0 ? (

          <div className="rounded-3xl border bg-white p-12 text-center text-slate-500">

            No players found.

          </div>

        ) : (

          rankings.map((player, index) => {

            return (

              <Link
  key={player.id}
  to={`/players/${player.id}`}
  className="
    group
    block

    rounded-2xl
    border
    border-slate-200

    bg-white

    px-6
    py-2.5

    shadow-sm

    transition-all
    duration-200

    hover:-translate-y-0.5
    hover:border-blue-200
    hover:shadow-md
  "
>

  <div className="flex items-center">

    {/* Rank */}

    <div className="shrink-0">

      {getRankBadge(index + 1)}

    </div>

    {/* Space between rank and player */}

    <div className="w-8" />

    {/* Player */}

    <div className="min-w-0 flex-1">

      <h2 className="truncate text-lg font-semibold tracking-tight text-slate-900">

        {player.firstName} {player.lastName}

      </h2>

      <p className="mt-0.5 truncate text-sm text-slate-500">

        {getClubName(player.clubId)}

      </p>

    </div>

    {/* Rating */}

    <div className="mr-5 hidden md:block">

      <div
        className="
          rounded-full

          bg-blue-100

          px-3
          py-1

          text-base
          font-semibold

          text-blue-900
        "
      >

        {player.rating} TTR

      </div>

    </div>

    {/* Arrow */}

    <ChevronRight
      className="
        h-5
        w-5

        shrink-0

        text-slate-400

        transition-transform

        group-hover:translate-x-1
      "
    />

  </div>

</Link>

            );

          })

        )}

      </div>

      <div className="text-center text-sm text-slate-500">

        Showing{" "}
        <span className="font-semibold">

          {rankings.length}

        </span>{" "}

        ranked player{rankings.length === 1 ? "" : "s"}.

      </div>

    </div>

  );

}