import { Link, useParams } from "react-router-dom";

import { getPlayer } from "../services/playerService";
import { getClubs } from "../services/clubService";
import { getMatches } from "../services/matchService";
import { getEvents } from "../services/eventService";

import {
  getClubRank,
  getNationalRank,
  getWinPercentage,
} from "../services/statisticsService";

import RecentMatchCard from "../components/player/RecentMatchCard";
import RatingGraph from "../components/player/RatingGraph";

export default function PlayerProfile() {
  const { id } = useParams();

  const player = id ? getPlayer(id) : undefined;

  if (!player) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">
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

  const clubs = getClubs();
  const events = getEvents();

  const club = clubs.find(
    (c) => c.id === player.clubId
  );

  const matches = getMatches()
    .filter(
      (m) =>
        m.player1Id === player.id ||
        m.player2Id === player.id
    )
    .sort(
      (a, b) =>
        new Date(b.playedAt).getTime() -
        new Date(a.playedAt).getTime()
    );

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      <Link
        to="/rankings"
        className="text-blue-700 hover:underline"
      >
        ← Back to Rankings
      </Link>

      <div className="bg-white rounded-xl shadow p-8">

        <h1 className="text-4xl font-bold">
          {player.firstName} {player.lastName}
        </h1>

        <p className="text-slate-500 text-lg mt-2">
          {club?.name ?? "-"}
        </p>

      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

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
            NZ Rank
          </p>

          <p className="text-4xl font-bold mt-2">
            #{getNationalRank(player.id)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6 text-center">
          <p className="text-slate-500">
            Club Rank
          </p>

          <p className="text-4xl font-bold mt-2">
            #{getClubRank(player.id)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6 text-center">
          <p className="text-slate-500">
            Win %
          </p>

          <p className="text-4xl font-bold mt-2">
            {getWinPercentage(player.id)}%
          </p>
        </div>

      </div>

      <div className="bg-white rounded-xl shadow p-8">

        <h2 className="text-2xl font-bold mb-6">
          Career Statistics
        </h2>

        <div className="grid md:grid-cols-2 gap-y-4">

          <p>Highest Rating</p>
          <p className="font-semibold">
            {player.highestRating}
          </p>

          <p>Matches Played</p>
          <p className="font-semibold">
            {player.matchesPlayed}
          </p>

          <p>Wins</p>
          <p className="font-semibold">
            {player.wins}
          </p>

          <p>Losses</p>
          <p className="font-semibold">
            {player.losses}
          </p>

        </div>

      </div>

      <RatingGraph playerId={player.id} />

      <div className="bg-white rounded-xl shadow p-8">

        <div className="flex justify-between items-center mb-6">

          <h2 className="text-2xl font-bold">
            Recent Matches
          </h2>

          <span className="text-slate-500">
            {matches.length} Matches
          </span>

        </div>

        {matches.length === 0 ? (

          <p className="text-slate-500">
            No matches recorded.
          </p>

        ) : (

          <div className="space-y-4">

            {matches.map((match) => {

              const opponentId =
                match.player1Id === player.id
                  ? match.player2Id
                  : match.player1Id;

              const opponent = getPlayer(opponentId);

              const event = events.find(
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
  );
}