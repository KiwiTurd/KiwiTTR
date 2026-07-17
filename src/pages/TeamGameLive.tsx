import {
  useEffect,
  useState,
} from "react";
import {
  ArrowLeft,
  ClipboardPen,
  Download,
  Trophy,
  UsersRound,
} from "lucide-react";
import {
  Link,
  useParams,
} from "react-router-dom";

import {
  calculateClassic6Score,
  classic6NextMatchId,
  classicTeamFormatLabel,
  classicTeamTargetScore,
  getClassic6DemoGame,
  type Classic6Game,
  type Classic6Match,
  type Classic6Team,
} from "../services/teams/teamEngine";
import { getTeamGame } from "../services/teams/teamGameService";
import useRole from "../hooks/useRole";
import LoadingScreen from "../components/shared/LoadingScreen";
import { downloadTeamGameSheet } from "../utils/playCard";

function namesFor(
  team: Classic6Team,
  ids: string[],
  winner: boolean
) {
  return ids.map((id) => {
    const player =
      team.players.find(
        (teamPlayer) => teamPlayer.id === id
      );

    return (
      <span
        key={id}
        className="inline"
      >
        {ids.indexOf(id) > 0 && " / "}
        {winner && (
          <Trophy className="mr-1 inline h-4 w-4 text-amber-500" />
        )}
        {player ? (
          <Link
            to={`/players/${player.id}`}
            className={`transition hover:text-blue-700 hover:underline ${
              winner ? "font-black" : ""
            }`}
          >
            {player.name}
          </Link>
        ) : (
          "TBC"
        )}
      </span>
    );
  });
}

function setLine(match: Classic6Match) {
  if (match.sets.length === 0) {
    return "No sets";
  }

  return match.sets
    .map((set) => `${set.home}-${set.away}`)
    .join(", ");
}

function plainNamesFor(team: Classic6Team, ids: string[]) {
  return ids
    .map(
      (id) =>
        team.players.find((player) => player.id === id)?.name ?? "TBC"
    )
    .join(" / ");
}

export default function TeamGameLive() {
  const { id } = useParams();
  const [savedGame, setSavedGame] =
    useState<Classic6Game | null>(null);
  const [loading, setLoading] =
    useState(Boolean(id));
  const {
    isAdmin,
    isClubLeader,
    clubId,
  } = useRole();

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const gameId = id;
    let cancelled = false;

    async function loadGame() {
      try {
        const game = await getTeamGame(gameId);

        if (!cancelled) {
          setSavedGame(game);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadGame();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <LoadingScreen label="Loading team game..." />;
  }

  const game =
    savedGame ??
    getClassic6DemoGame(id ?? "team-game-demo-1");
  const score =
    calculateClassic6Score(
      game.matches,
      game.format ?? "classic-6",
      game.customSettings
    );
  const targetScore =
    classicTeamTargetScore(
      game.format ?? "classic-6",
      game.customSettings
    );
  const formatLabel =
    classicTeamFormatLabel(
      game.format ?? "classic-6"
    );
  const isPlayThrough =
    game.format === "abc-123" ||
    (game.format === "custom" &&
      game.customSettings?.matchMode ===
        "play-through");
  const allScoringMatchesComplete =
    game.matches
      .filter((match) => match.countsForTeamScore)
      .every(
        (match) =>
          match.status === "completed" &&
          Boolean(match.winner)
      );
  const winningTeam =
    isPlayThrough
      ? allScoringMatchesComplete &&
        score.home !== score.away
        ? score.home > score.away
          ? game.home
          : game.away
        : null
      : score.home >= targetScore
        ? game.home
        : score.away >= targetScore
          ? game.away
          : null;
  const nextMatchId =
    classic6NextMatchId(
      game.matches,
      game.format ?? "classic-6",
      game.customSettings
    );
  const canManage =
    Boolean(savedGame) &&
    (isAdmin ||
      (isClubLeader &&
        Boolean(clubId) &&
        (clubId === game.home.clubId ||
          clubId === game.away.clubId)));
  const eventDetailParts = [
    game.home.clubName,
    "v",
    game.away.clubName,
    "·",
    new Date(game.date).toLocaleDateString(),
    game.startTime ? `· ${game.startTime}` : "",
    game.locationClubName
      ? `· ${game.locationClubName}`
      : "",
  ].filter(Boolean);

  function downloadFullTeamGameSheet() {
    downloadTeamGameSheet({
      eventName: game.name,
      date: new Date(game.date).toLocaleDateString(),
      venue: game.locationClubName,
      home: {
        name: game.home.name,
        club: game.home.clubName,
        players: game.home.players.map((player) => ({
          name: player.name,
          club: player.clubName,
          ttr: player.rating,
        })),
      },
      away: {
        name: game.away.name,
        club: game.away.clubName,
        players: game.away.players.map((player) => ({
          name: player.name,
          club: player.clubName,
          ttr: player.rating,
        })),
      },
      matches: game.matches.map((match) => ({
        order: match.order,
        label: match.label,
        sideOne: plainNamesFor(game.home, match.homePlayerIds),
        sideTwo: plainNamesFor(game.away, match.awayPlayerIds),
        sets: match.sets.map((set) => ({
          sideOne: set.home,
          sideTwo: set.away,
        })),
        winner: match.winner,
        countsForTeamScore: match.countsForTeamScore,
      })),
    });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/team-games"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Team Games
          </Link>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadFullTeamGameSheet}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Download className="h-5 w-5" />
              Download Full Scoresheet
            </button>
            {canManage && id && (
              <Link
                to={`/team-games/${id}/manage`}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-800"
              >
                <ClipboardPen className="h-5 w-5" />
                Match Centre
              </Link>
            )}
          </div>
        </div>

        <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-emerald-700">
          Live {formatLabel} Viewer
        </p>

        <h1 className="mt-2 text-5xl font-normal tracking-tight">
          {game.name}
        </h1>

        <p className="mt-3 text-lg text-slate-500">
          {eventDetailParts.join(" ")}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <UsersRound className="h-5 w-5 text-emerald-600" />
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              Score
            </p>
            <p className="text-xl font-black">
              {score.home} - {score.away}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Trophy className="h-5 w-5 text-amber-500" />
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              Target
            </p>
            <p className="text-xl font-black">
              {isPlayThrough
                ? "Play-Through"
                : `First to ${targetScore}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <UsersRound className="h-5 w-5 text-blue-700" />
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              Mode
            </p>
            <p className="text-xl font-black">
              {formatLabel}
            </p>
          </div>
        </div>
      </div>

      {winningTeam && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 shadow-sm">
          <Trophy className="h-7 w-7 text-amber-500" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
              Winner
            </p>
            <p className="text-2xl font-black text-slate-900">
              {winningTeam.clubName}
            </p>
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="text-xl font-bold">
            Match Grid
          </h2>
        </div>

        <div className="divide-y">
          {game.matches.map((match) => {
            const isComplete =
              match.status === "completed";
            const isLive =
              match.status === "live";
            const isNext =
              match.id === nextMatchId;
            const isDoubles =
              match.phase === "doubles";
            const homeWon =
              match.winner === "home";
            const awayWon =
              match.winner === "away";

            return (
              <div
                key={match.id}
                className={`grid gap-2 px-4 md:grid-cols-[56px_1fr_120px] md:items-center ${
                  isComplete
                    ? "bg-slate-100 py-2 text-slate-500"
                    : isLive
                      ? "border-l-4 border-green-500 bg-green-50 py-4"
                      : isNext
                        ? "bg-yellow-50 py-2.5"
                        : isDoubles
                          ? "bg-purple-50 py-2 text-purple-950"
                          : "bg-white py-2"
                }`}
              >
                <div className={`font-black ${
                  isLive ? "text-lg" : "text-sm"
                }`}>
                  #{match.order}
                </div>

                <div>
                  <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold uppercase text-slate-600">
                      {match.label}
                    </span>
                    {isLive && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-green-700">
                        Live
                      </span>
                    )}
                    {isNext && !isLive && (
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-yellow-700">
                        Next
                      </span>
                    )}
                  </div>

                  <p className={`font-semibold ${
                    isLive ? "text-base" : "text-sm"
                  }`}>
                    {namesFor(
                      game.home,
                      match.homePlayerIds,
                      homeWon
                    )}{" "}
                    <span className="font-normal text-slate-400">
                      v
                    </span>{" "}
                    {namesFor(
                      game.away,
                      match.awayPlayerIds,
                      awayWon
                    )}
                  </p>
                </div>

                <div className={`font-semibold text-slate-600 ${
                  isLive ? "text-sm" : "text-xs"
                }`}>
                  {setLine(match)}
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
