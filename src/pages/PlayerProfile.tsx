import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  ShieldCheck,
  Star,
  Target,
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

import { notify } from "../services/notificationService";

export default function PlayerProfile() {

  const { id } = useParams();

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

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    void loadData();

  }, [id]);

  async function loadData() {

    if (!id) return;

    try {

      setLoading(true);

      const [

        playerData,
        playerList,
        clubList,
        matchList,
        eventList,

      ] = await Promise.all([

        getPlayer(id),
        getPlayers(),
        getClubs(),
        getPlayerMatches(id),
        getEvents(),

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

    }

    catch (error) {

      console.error(error);

      notify.fault("Unable to load player.");

    }

    finally {

      setLoading(false);

    }

  }

  const winPercentage = useMemo(() => {

    if (!player) return 0;

    if (player.matchesPlayed === 0) {

      return 0;

    }

    return (

      (player.wins / player.matchesPlayed) * 100

    ).toFixed(1);

  }, [player]);

  if (loading) {

    return (

      <div className="max-w-7xl mx-auto">

        <h1 className="text-4xl font-bold">

          Loading...

        </h1>

      </div>

    );

  }

  if (!player) {

    return (

      <div className="max-w-7xl mx-auto space-y-8">

        <h1 className="text-5xl font-black">

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

    <Link
      to="/rankings"
      className="
        inline-flex
        items-center
        gap-2

        text-sm
        font-medium

        text-slate-500

        hover:text-blue-700

        transition
      "
    >

      <ArrowLeft className="h-4 w-4" />

      Back to Rankings

    </Link>

    {/* Hero */}

    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

      <div className="h-2 bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-500" />

      <div className="p-8">

        <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">

          <div className="flex items-center gap-6">

            <div
              className="
                flex
                h-24
                w-24
                items-center
                justify-center

                rounded-full

                bg-blue-900

                text-3xl
                font-black
                text-white
              "
            >

              {player.firstName.charAt(0)}
              {player.lastName.charAt(0)}

            </div>

            <div>

              <h1 className="text-5xl font-black tracking-tight">

                {player.firstName} {player.lastName}

              </h1>

              <div className="mt-3 flex items-center gap-2 text-slate-500">

                <Building2 className="h-4 w-4" />

                {club?.name ?? "No Club"}

              </div>

              <div className="mt-5 flex flex-wrap gap-3">

                <div
                  className={`
                    inline-flex
                    items-center
                    gap-2

                    rounded-full

                    px-3
                    py-1.5

                    text-sm
                    font-semibold

                    ${
                      player.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }
                  `}
                >

                  <BadgeCheck className="h-4 w-4" />

                  {player.isActive
                    ? "Active"
                    : "Inactive"}

                </div>

                <div
                  className="
                    inline-flex
                    items-center
                    gap-2

                    rounded-full

                    bg-blue-100

                    px-3
                    py-1.5

                    text-sm
                    font-semibold

                    text-blue-800
                  "
                >

                  <ShieldCheck className="h-4 w-4" />

                  Reliability {player.ratingReliability}

                </div>

              </div>

            </div>

          </div>

          <div className="text-center">

            <Star className="mx-auto h-8 w-8 fill-amber-400 text-amber-400" />

            <p className="mt-3 text-slate-500">

              Current Rating

            </p>

            <h2 className="mt-1 text-7xl font-black tracking-tight">

              {player.rating}

            </h2>

          </div>

        </div>

      </div>

    </div>

    {/* Stat Cards */}

    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <TrendingUp className="h-8 w-8 text-blue-700" />

        <p className="mt-6 text-sm uppercase tracking-wider text-slate-500">

          Current Rating

        </p>

        <h3 className="mt-2 text-5xl font-black">

          {player.rating}

        </h3>

      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <Trophy className="h-8 w-8 text-amber-500" />

        <p className="mt-6 text-sm uppercase tracking-wider text-slate-500">

          Highest Rating

        </p>

        <h3 className="mt-2 text-5xl font-black">

          {player.highestRating}

        </h3>

      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <Users className="h-8 w-8 text-indigo-600" />

        <p className="mt-6 text-sm uppercase tracking-wider text-slate-500">

          Matches Played

        </p>

        <h3 className="mt-2 text-5xl font-black">

          {player.matchesPlayed}

        </h3>

      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <Target className="h-8 w-8 text-emerald-600" />

        <p className="mt-6 text-sm uppercase tracking-wider text-slate-500">

          Win Percentage

        </p>

        <h3 className="mt-2 text-5xl font-black">

          {winPercentage}%

        </h3>

      </div>

    </div>

    {/* Rating Graph */}

    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

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
        />

      </div>

    </div>

      {/* Recent Matches */}{/* Recent Matches */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b px-8 py-5">

          <div className="flex items-center gap-3">

            <Trophy className="h-6 w-6 text-amber-500" />

            <h2 className="text-2xl font-bold">

              Recent Matches

            </h2>

          </div>

        </div>

        <div className="p-8">

          {matches.length === 0 ? (

            <div className="py-12 text-center">

              <Trophy className="mx-auto h-12 w-12 text-slate-300" />

              <p className="mt-4 text-slate-500">

                No matches have been played yet.

              </p>

            </div>

          ) : (

            <div className="space-y-4">

              {matches.map((match) => {

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

                return (

                  <RecentMatchCard
                    key={match.id}
                    match={match}
                    player={player}
                    opponent={opponent}
                    event={event}
                  />

                );

              })}

            </div>

          )}

        </div>

      </div>

      {/* Career Statistics */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

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

                Rating Reliability

              </span>

              <span className="text-xl font-bold">

                {player.ratingReliability}

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

    </div>

  );

}