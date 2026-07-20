import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import type { Player } from "../types/player";
import type { Club } from "../types/club";

import { getPlayers } from "../services/supabase/playerService";
import { getClubs } from "../services/supabase/clubService";

import { notify } from "../services/notificationService";
import LoadingScreen from "../components/shared/LoadingScreen";
import PlayerSelector from "../components/shared/PlayerSelector";

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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

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

  function getClubShortName(
    clubId: string
  ) {
    const club = clubs.find(
      (item) => item.id === clubId
    );

    return club?.shortName || club?.name || "-";
  }

function getRankBadge(rank: number) {
  return (
    <span
      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
        rank === 1
          ? "bg-amber-100 text-amber-700"
          : rank === 2
            ? "bg-slate-200 text-slate-700"
            : rank === 3
              ? "bg-orange-100 text-orange-700"
              : "bg-slate-100 text-slate-500"
      }`}
      aria-label={`Rank ${rank}`}
    >
      {rank}
    </span>
  );
}
  
return (

    <div className="max-w-7xl mx-auto space-y-8">

      {/* Header */}

      <div>

        <h1 className="text-5xl font-normal tracking-tight text-slate-900">

          New Zealand Rankings

        </h1>

        <p className="mt-3 text-lg text-slate-500">

          Live KiwiTTR rankings across New Zealand.

        </p>

      </div>

      {/* Filters */}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="grid gap-4 lg:grid-cols-[1fr_260px]">

          <PlayerSelector
            players={players
              .filter(
                (player) =>
                  !clubFilter || player.clubId === clubFilter
              )
              .map((player) => ({
                ...player,
                clubName:
                  clubs.find(
                    (club) => club.id === player.clubId
                  )?.name ?? "",
              }))}
            value={
              players.find(
                (player) =>
                  `${player.firstName} ${player.lastName}` === search
              ) ?? null
            }
            onChange={(player) =>
              setSearch(
                `${player.firstName} ${player.lastName}`
              )
            }
            onClear={() => setSearch("")}
            placeholder="Search players..."
          />

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

      <div>

        {loading ? (
          <LoadingScreen label="Loading rankings..." />

        ) : rankings.length === 0 ? (

          <div className="rounded-3xl border bg-white p-12 text-center text-slate-500">

            No players found.

          </div>

        ) : (

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="grid grid-cols-[4rem_minmax(0,1fr)_minmax(0,0.8fr)_4.5rem] items-center gap-3 border-b border-slate-300 bg-slate-50 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 sm:grid-cols-[5rem_minmax(0,1fr)_minmax(0,0.8fr)_4.5rem] sm:gap-4 sm:px-6">
              <span className="text-center">Rank</span>
              <span>Player</span>
              <span>Club</span>
              <span className="text-right">TTR</span>
            </div>

            <div className="divide-y divide-slate-300">
              {rankings.map((player, index) => (
                <Link
                  key={player.id}
                  to={`/players/${player.id}`}
                  className="grid grid-cols-[4rem_minmax(0,1fr)_minmax(0,0.8fr)_4.5rem] items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50 sm:grid-cols-[5rem_minmax(0,1fr)_minmax(0,0.8fr)_4.5rem] sm:gap-4 sm:px-6"
                >
                  <span className="justify-self-center">
                    {getRankBadge(index + 1)}
                  </span>

                  <p className="truncate font-semibold text-slate-900">
                    {player.firstName} {player.lastName}
                  </p>

                  <p className="min-w-0 truncate text-sm text-slate-600">
                    <span className="sm:hidden">
                      {getClubShortName(player.clubId)}
                    </span>
                    <span className="hidden sm:inline">
                      {getClubName(player.clubId)}
                    </span>
                  </p>

                  <p className="text-right text-lg font-black tabular-nums text-slate-950">
                    {player.rating}
                  </p>
                </Link>
              ))}
            </div>

          </div>

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
