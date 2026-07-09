import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Link,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  Circle,
  Crown,
  Trophy,
} from "lucide-react";

import { useTournament } from "../context/TournamentContext";
import type {
  KnockoutMatch,
  TournamentMatch,
} from "../types/tournament";
import { calculatePoolStandings } from "../services/tournament/standings";
import { arePoolsComplete } from "../services/tournament/matchProgression";

function playerName(
  player: { firstName: string; lastName: string } | null
) {
  return player
    ? `${player.firstName} ${player.lastName}`
    : "TBD";
}

function roundTitle(
  round: number,
  maxRound: number
) {
  if (round === maxRound) {
    return "Final";
  }

  if (round === maxRound - 1) {
    return "Semi Finals";
  }

  if (round === maxRound - 2) {
    return "Quarter Finals";
  }

  return `Round ${round}`;
}

function getWinnerName(
  match: KnockoutMatch | undefined
) {
  if (!match?.winnerId) {
    return null;
  }

  if (match.playerOne?.id === match.winnerId) {
    return playerName(match.playerOne);
  }

  if (match.playerTwo?.id === match.winnerId) {
    return playerName(match.playerTwo);
  }

  return null;
}

export default function TournamentViewer() {
  const {
    tournament,
    loadTournament,
  } = useTournament();
  const { id } = useParams();
  const viewportRef =
    useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] =
    useState(0);
  const [activeTab, setActiveTab] = useState<
    "pools" | "knockout"
  >("pools");

  useEffect(() => {
    if (
      id &&
      tournament.id !== id
    ) {
      void loadTournament(id);
    }
  }, [
    id,
    loadTournament,
    tournament.id,
  ]);

  const rounds = useMemo(() => {
    const grouped =
      new Map<number, KnockoutMatch[]>();

    tournament.knockout.forEach((match) => {
      grouped.set(
        match.round,
        [
          ...(grouped.get(match.round) ?? []),
          match,
        ].sort(
          (a, b) => a.position - b.position
        )
      );
    });

    return [...grouped.entries()].sort(
      ([roundA], [roundB]) => roundA - roundB
    );
  }, [tournament.knockout]);

  const poolStageComplete = useMemo(() => {
    return (
      tournament.matches.length > 0 &&
      arePoolsComplete(tournament.matches)
    );
  }, [tournament.matches]);

  useEffect(() => {
    if (
      (
        tournament.pools.length === 0 ||
        poolStageComplete
      ) &&
      tournament.knockout.length > 0
    ) {
      setActiveTab("knockout");
    }
  }, [
    poolStageComplete,
    tournament.pools.length,
    tournament.knockout.length,
  ]);

  const maxRound = Math.max(
    0,
    ...tournament.knockout.map(
      match => match.round
    )
  );

  const finalMatch = tournament.knockout.find(
    match => match.round === maxRound
  );

  const championName =
    getWinnerName(finalMatch);

  const livePoolMatchCount =
    tournament.matches.filter(
      match => !match.completed
    ).length;

  const liveKnockoutMatchCount =
    tournament.knockout.filter(
      match =>
        !match.completed &&
        match.playerOne &&
        match.playerTwo
    ).length;

  const liveMatchCount =
    activeTab === "pools"
      ? livePoolMatchCount
      : liveKnockoutMatchCount;

  const scale =
    1 - scrollProgress * 0.24;

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    function handleScroll() {
      const currentViewport =
        viewportRef.current;

      if (!currentViewport) {
        return;
      }

      const maxScroll =
        currentViewport.scrollWidth -
        currentViewport.clientWidth;

      setScrollProgress(
        maxScroll > 0
          ? currentViewport.scrollLeft / maxScroll
          : 0
      );
    }

    handleScroll();

    viewport.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      }
    );

    return () => {
      viewport.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, [rounds.length]);

  if (
    tournament.pools.length === 0 &&
    tournament.knockout.length === 0
  ) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          to="/events"
          className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-3 font-semibold hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Events
        </Link>

        <div className="rounded-3xl border bg-white p-10 text-center shadow-sm">
          <Trophy className="mx-auto h-12 w-12 text-slate-300" />
          <h1 className="mt-5 text-3xl font-black">
            No live tournament draw yet
          </h1>
          <p className="mt-3 text-slate-500">
            Create a tournament and generate the draw to view it here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-3 font-semibold hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Events
          </Link>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
            <Circle className="h-3 w-3 fill-current" />
            Live Tournament Viewer
          </div>

          <h1 className="mt-4 text-5xl font-black">
            {tournament.settings.name || "Tournament"}
          </h1>

          <p className="mt-3 text-lg text-slate-500">
            Follow pool play, then switch into the knockout draw.
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 text-right shadow-sm">
          <div className="text-sm font-semibold text-slate-500">
            Live Matches
          </div>
          <div className="mt-2 flex items-center justify-end gap-2 text-3xl font-black">
            <span className="h-3 w-3 rounded-full bg-green-500" />
            {liveMatchCount}
          </div>
        </div>
      </div>

      {championName && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <div className="flex items-center gap-3 text-amber-800">
            <Crown className="h-6 w-6" />
            <span className="text-sm font-bold uppercase tracking-wide">
              Champion
            </span>
          </div>
          <div className="mt-2 text-3xl font-black text-amber-950">
            {championName}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {tournament.pools.length > 0 && (
          <ViewerTab
            active={activeTab === "pools"}
            onClick={() => setActiveTab("pools")}
          >
            Pools
          </ViewerTab>
        )}

        {tournament.knockout.length > 0 && (
          <ViewerTab
            active={activeTab === "knockout"}
            onClick={() => setActiveTab("knockout")}
          >
            Knockout
          </ViewerTab>
        )}
      </div>

      {activeTab === "pools" && (
        <PoolViewer
          pools={tournament.pools}
          matches={tournament.matches}
        />
      )}

      {activeTab === "knockout" && (
      <div className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">
              Knockout Tree
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              The bracket scales down as you move toward the champion match.
            </p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
            {Math.round(scale * 100)}%
          </div>
        </div>

        <div
          ref={viewportRef}
          className="overflow-x-auto pb-4"
        >
          <div
            className="flex min-h-[560px] min-w-max items-center gap-10 pr-20 transition-transform duration-150"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "left center",
              width: `${100 / scale}%`,
            }}
          >
            {rounds.map(([round, matches]) => (
              <div
                key={round}
                className="flex min-w-[280px] flex-col justify-center gap-6"
              >
                <div className="sticky left-0 rounded-2xl bg-slate-950 px-4 py-3 text-white shadow-sm">
                  <div className="text-sm font-semibold text-slate-300">
                    {matches.length} match{matches.length === 1 ? "" : "es"}
                  </div>
                  <h3 className="text-xl font-black">
                    {roundTitle(round, maxRound)}
                  </h3>
                </div>

                <div className="space-y-5">
                  {matches.map((match) => (
                    <BracketMatch
                      key={match.id}
                      match={match}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

function ViewerTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-5 py-3 font-semibold transition ${
        active
          ? "bg-blue-900 text-white"
          : "border bg-white hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function PoolViewer({
  pools,
  matches,
}: {
  pools: ReturnType<typeof useTournament>["tournament"]["pools"];
  matches: TournamentMatch[];
}) {
  return (
    <div className="space-y-6">
      {pools.map(pool => {
        const standings = calculatePoolStandings(
          pool,
          matches
        );
        const poolMatches = matches.filter(
          match => match.poolId === pool.id
        );

        return (
          <div
            key={pool.id}
            className="rounded-3xl border bg-white shadow-sm"
          >
            <div className="border-b px-6 py-5">
              <h2 className="text-2xl font-bold">
                {pool.name}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {poolMatches.filter(match => match.completed).length}
                {" "}of {poolMatches.length} matches complete
              </p>
            </div>

            <div className="grid gap-0 lg:grid-cols-[1fr_1.2fr]">
              <div className="border-b lg:border-b-0 lg:border-r">
                <div className="border-b px-6 py-3 text-sm font-bold uppercase text-slate-500">
                  Standings
                </div>
                {standings.map(standing => (
                  <div
                    key={standing.player.id}
                    className="flex items-center justify-between border-b px-6 py-4 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-900">
                        {standing.position}
                      </div>
                      <div>
                        <div className="font-semibold">
                          {playerName(standing.player)}
                        </div>
                        <div className="text-sm text-slate-500">
                          {standing.gamesWon}-{standing.gamesLost} games
                        </div>
                      </div>
                    </div>
                    <div className="font-bold">
                      {standing.wins}-{standing.losses}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <div className="border-b px-6 py-3 text-sm font-bold uppercase text-slate-500">
                  Matches
                </div>
                {poolMatches.map(match => (
                  <PoolMatchRow
                    key={match.id}
                    match={match}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PoolMatchRow({
  match,
}: {
  match: TournamentMatch;
}) {
  const winnerName =
    match.winnerId === match.playerOne.id
      ? playerName(match.playerOne)
      : match.winnerId === match.playerTwo.id
        ? playerName(match.playerTwo)
        : null;

  return (
    <div className="border-b px-6 py-4 last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-semibold">
            {playerName(match.playerOne)}
            {" "}
            <span className="text-slate-400">vs</span>
            {" "}
            {playerName(match.playerTwo)}
          </div>
          {match.games.length > 0 && (
            <div className="mt-1 text-sm text-slate-500">
              {match.games.join(", ")}
            </div>
          )}
        </div>

        {match.completed ? (
          <div className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">
            {winnerName} won
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Live
          </div>
        )}
      </div>
    </div>
  );
}

function BracketMatch({
  match,
}: {
  match: KnockoutMatch;
}) {
  const isLive =
    !match.completed &&
    match.playerOne &&
    match.playerTwo;

  return (
    <div
      className={`relative rounded-2xl border bg-white p-4 shadow-sm ${
        isLive
          ? "border-green-300 ring-4 ring-green-100"
          : "border-slate-200"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-500">
          Match {match.position}
        </span>

        {isLive ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Live
          </span>
        ) : match.completed ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            Complete
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
            Waiting
          </span>
        )}
      </div>

      <BracketPlayer
        name={playerName(match.playerOne)}
        winner={
          match.winnerId === match.playerOne?.id
        }
      />

      <div className="py-2 text-center text-xs font-semibold uppercase text-slate-400">
        vs
      </div>

      <BracketPlayer
        name={playerName(match.playerTwo)}
        winner={
          match.winnerId === match.playerTwo?.id
        }
      />
    </div>
  );
}

function BracketPlayer({
  name,
  winner,
}: {
  name: string;
  winner: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 font-semibold ${
        winner
          ? "border-green-300 bg-green-50 text-green-800"
          : "border-slate-200 bg-slate-50 text-slate-800"
      }`}
    >
      {name}
    </div>
  );
}
