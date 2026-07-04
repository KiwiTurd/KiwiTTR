import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

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

  const [player, setPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [club, setClub] = useState<Club | null>(null);

  const [matches, setMatches] = useState<Match[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  const [loading, setLoading] = useState(true);

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
          (c) => c.id === playerData.clubId
        ) ?? null
      );

      setMatches(matchList);

      setEvents(eventList);

    } catch (error) {
      console.error(error);
      notify.fault("Unable to load player.");
    } finally {
      setLoading(false);
    }
  }

  const winPercentage = useMemo(() => {

    if (!player) return 0;

    if (player.matchesPlayed === 0) {
      return 0;
    }

    return (
      (player.wins / player.matchesPlayed) *
      100
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
      <div className="max-w-7xl mx-auto space-y-6">

        <h1 className="text-4xl font-bold">
          Player Not Found
        </h1>

        <Link
          to="/rankings"
          className="text-blue-700 hover:underline"
        >
          ← Back to Rankings
        </Link>

      </div>
    );

  }

  return (

    <div className="max-w-7xl mx-auto space-y-8">

      <Link
        to="/rankings"
        className="text-blue-700 hover:underline"
      >
        ← Back to Rankings
      </Link>

      <div className="bg-white rounded-xl shadow p-8">

        <div className="flex justify-between items-start">

          <div>

            <h1 className="text-4xl font-bold">

              {player.firstName} {player.lastName}

            </h1>

            <p className="text-slate-500 text-lg mt-2">

              {club?.name ?? "-"}

            </p>

          </div>

          <span
            className={`px-4 py-2 rounded-full font-semibold ${
              player.isActive
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {player.isActive
              ? "Active"
              : "Inactive"}
          </span>

        </div>

      </div>

      <div className="grid md:grid-cols-4 gap-4">

        <div className="bg-white rounded-xl shadow p-6 text-center">

          <p className="text-slate-500">
            Rating
          </p>

          <p className="text-4xl font-bold mt-2">
            {player.rating}
          </p>

        </div>

        <div className="bg-white rounded-xl shadow p-6 text-center">

          <p className="text-slate-500">
            Highest Rating
          </p>

          <p className="text-4xl font-bold mt-2">
            {player.highestRating}
          </p>

        </div>

        <div className="bg-white rounded-xl shadow p-6 text-center">

          <p className="text-slate-500">
            Matches
          </p>

          <p className="text-4xl font-bold mt-2">
            {player.matchesPlayed}
          </p>

        </div>

        <div className="bg-white rounded-xl shadow p-6 text-center">

          <p className="text-slate-500">
            Win %
          </p>

          <p className="text-4xl font-bold mt-2">

            {winPercentage}%

          </p>

        </div>

      </div>

      <RatingGraph
        playerId={player.id}
      />

      <div className="bg-white rounded-xl shadow p-8">

        <h2 className="text-2xl font-bold mb-6">

          Recent Matches

        </h2>

        <div className="space-y-4">

          {matches.length === 0 ? (

            <p className="text-slate-500">

              No matches played.

            </p>

          ) : (

            matches.map((match) => {

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

            })

          )}

        </div>

      </div>

      <div className="bg-white rounded-xl shadow p-8">

        <h2 className="text-2xl font-bold mb-6">
          Career Statistics
        </h2>

        <div className="grid md:grid-cols-2 gap-y-4">

          <p>Wins</p>
          <p className="font-semibold">{player.wins}</p>

          <p>Losses</p>
          <p className="font-semibold">{player.losses}</p>

          <p>Win Percentage</p>
          <p className="font-semibold">{winPercentage}%</p>

          <p>Matches Played</p>
          <p className="font-semibold">{player.matchesPlayed}</p>

          <p>Highest Rating</p>
          <p className="font-semibold">{player.highestRating}</p>

          <p>Current Rating</p>
          <p className="font-semibold">{player.rating}</p>

          <p>Rating Reliability</p>
          <p className="font-semibold">{player.ratingReliability}</p>

          <p>Provisional Matches Remaining</p>
          <p className="font-semibold">
            {player.provisionalMatchesRemaining === 0
              ? "Established"
              : player.provisionalMatchesRemaining}
          </p>

          <p>Status</p>
          <p className="font-semibold">
            {player.isActive
              ? "Active"
              : "Inactive"}
          </p>

          <p>Member Since</p>
          <p className="font-semibold">
            {new Date(
              player.createdAt
            ).toLocaleDateString()}
          </p>

        </div>

      </div>

    </div>

  );

}