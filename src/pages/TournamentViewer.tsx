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
  ClipboardPen,
  Crown,
  Maximize2,
  Minimize2,
  Trophy,
} from "lucide-react";

import { useTournament } from "../context/TournamentContext";
import useRole from "../hooks/useRole";
import type {
  KnockoutMatch,
  TournamentMatch,
} from "../types/tournament";
import { getDoubleKnockoutChampion } from "../services/tournament/doubleKnockout";
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
  const {
    isAdmin,
    isClubLeader,
    clubId: userClubId,
  } = useRole();
  const { id } = useParams();
  const canManageTournament =
    isAdmin ||
    (isClubLeader && userClubId === tournament.settings.clubId);
  const viewportRef =
    useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] =
    useState(0);
  const [activeTab, setActiveTab] = useState<
    "pools" | "knockout"
  >("pools");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.error(error);
    }
  }

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

  useEffect(() => {
    if (!id) return;

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadTournament(id, true);
      }
    }, 2000);

    return () => window.clearInterval(interval);
  }, [id, loadTournament]);

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
      const timer = window.setTimeout(
        () => setActiveTab("knockout"),
        0
      );

      return () => window.clearTimeout(timer);
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

  const doubleKnockoutChampion =
    tournament.settings.format === "double-knockout"
      ? getDoubleKnockoutChampion(
          tournament.players,
          tournament.knockout
        )
      : null;

  const championName = doubleKnockoutChampion
    ? playerName(doubleKnockoutChampion)
    : getWinnerName(finalMatch);

  useEffect(() => {
    if (!championName || !tournament.id) return;

    const celebrationKey = `tournament-celebrated:${tournament.id}`;
    if (window.sessionStorage.getItem(celebrationKey)) return;

    window.sessionStorage.setItem(celebrationKey, "true");
    setShowConfetti(true);
    const timer = window.setTimeout(() => setShowConfetti(false), 6000);
    return () => window.clearTimeout(timer);
  }, [championName, tournament.id]);

  const eliminatedPlayerIds = useMemo(() => {
    const eliminated = new Set<string>();

    tournament.knockout.forEach(match => {
      if (!match.completed || !match.winnerId) return;
      if (
        tournament.settings.format === "double-knockout" &&
        match.bracket === "winners"
      ) return;

      if (match.playerOne && match.playerOne.id !== match.winnerId) {
        eliminated.add(match.playerOne.id);
      }
      if (match.playerTwo && match.playerTwo.id !== match.winnerId) {
        eliminated.add(match.playerTwo.id);
      }
    });

    return eliminated;
  }, [tournament.knockout, tournament.settings.format]);

  const tournamentIsLive = tournament.status === "active";
  const tournamentCompleted = tournament.status === "completed";

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
          <h1 className="mt-5 text-3xl font-normal">
            No live tournament draw yet
          </h1>
          <p className="mt-3 text-slate-500">
            Create a tournament and generate the draw to view it here.
          </p>
        </div>
      </div>
    );
  }

  if (isFullscreen) {
    return (
      <TournamentDisplayBoard
        name={tournament.settings.name || "Tournament"}
        pools={tournament.pools}
        poolMatches={tournament.matches.filter(match => !match.completed)}
        knockoutMatches={tournament.knockout.filter(
          match => !match.completed && match.playerOne && match.playerTwo
        )}
        onExit={() => void toggleFullscreen()}
      />
    );
  }

  return (
    <div className="space-y-8">
      {showConfetti && <ConfettiCelebration />}
      <div className="flex flex-wrap items-start justify-between gap-5 border-b border-slate-300 pb-6 md:items-end">
        <div className="tournament-page-header-copy">
          <Link
            to="/events"
            className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-3 font-semibold hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Events
          </Link>

          <h1 className="mt-6 text-5xl font-normal">
            {tournament.settings.name || "Tournament"}
          </h1>

          {(tournamentIsLive || tournamentCompleted) && (
            <p className="mt-3 text-lg text-slate-500">
              {tournamentCompleted
                ? "Final draw, knockout results and pool standings."
                : "Follow pool play, set scores and the knockout draw as they update."}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-3">
        {tournamentIsLive && (
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Maximize2 className="h-4 w-4" />
            Full Screen
          </button>
        )}
        {canManageTournament && tournament.id && (
          <Link
            to={`/tournaments/${tournament.id}/live`}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
          >
            <ClipboardPen className="h-4 w-4" />
            Match Input
          </Link>
        )}
        </div>
      </div>

      {!tournamentIsLive && !tournamentCompleted && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center shadow-sm">
          <Trophy className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-5 text-2xl font-semibold text-slate-800">
            Tournament coverage will begin soon
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-500">
            Matches, scores, pools and knockout draws will appear here when the organiser takes the tournament live.
          </p>
        </div>
      )}

      {(tournamentIsLive || tournamentCompleted) && championName && (
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

      {tournamentIsLive && (
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
      )}

      {tournamentIsLive && activeTab === "pools" && (
        <PoolViewer
          pools={tournament.pools}
          matches={tournament.matches}
          tournamentIsLive={tournamentIsLive}
        />
      )}

      {tournament.knockout.length > 0 &&
        (tournamentCompleted || (tournamentIsLive && activeTab === "knockout")) && (
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
                <div className="sticky left-0 rounded-2xl bg-slate-700 px-4 py-3 text-white shadow-sm">
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
                      tournamentIsLive={tournamentIsLive}
                      hasNextRound={round < maxRound}
                      eliminatedPlayerIds={eliminatedPlayerIds}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {tournamentCompleted && tournament.pools.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Pool Results</h2>
            <p className="mt-1 text-sm text-slate-500">
              Final standings and every pool match result.
            </p>
          </div>
          <PoolViewer
            pools={tournament.pools}
            matches={tournament.matches}
            tournamentIsLive={false}
          />
        </section>
      )}
    </div>
  );
}

function ConfettiCelebration() {
  const colours = ["#10b981", "#2563eb", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="pointer-events-none fixed inset-0 z-[120] overflow-hidden" aria-hidden="true">
      {Array.from({ length: 70 }, (_, index) => (
        <span
          key={index}
          className="tournament-confetti absolute -top-6 block h-3 w-2 rounded-sm"
          style={{
            left: `${(index * 37) % 100}%`,
            backgroundColor: colours[index % colours.length],
            animationDelay: `${(index % 14) * 0.09}s`,
            animationDuration: `${3.2 + (index % 7) * 0.35}s`,
            transform: `rotate(${index * 29}deg)`,
          }}
        />
      ))}
    </div>
  );
}

function TournamentDisplayBoard({
  name,
  pools,
  poolMatches,
  knockoutMatches,
  onExit,
}: {
  name: string;
  pools: ReturnType<typeof useTournament>["tournament"]["pools"];
  poolMatches: TournamentMatch[];
  knockoutMatches: KnockoutMatch[];
  onExit: () => void;
}) {
  const matchCount = poolMatches.length + knockoutMatches.length;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950 p-5 text-white md:p-8">
      <div className="mx-auto max-w-[1800px]">
        <div className="flex items-start justify-between gap-6 border-b border-slate-700 pb-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-emerald-400">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
              Live matches
            </div>
            <h1 className="mt-2 text-3xl font-normal tracking-tight text-white md:text-5xl">
              {name}
            </h1>
            <p className="mt-2 text-slate-300">
              {matchCount} match{matchCount === 1 ? "" : "es"} currently on display
            </p>
          </div>
          <button
            type="button"
            onClick={onExit}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            <Minimize2 className="h-5 w-5" />
            Exit Full Screen
          </button>
        </div>

        {matchCount === 0 ? (
          <div className="py-24 text-center">
            <Trophy className="mx-auto h-12 w-12 text-slate-600" />
            <h2 className="mt-5 text-2xl font-semibold">No live matches right now</h2>
            <p className="mt-2 text-slate-400">New matches will appear here automatically.</p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {poolMatches.map(match => (
              <DisplayMatchCard
                key={`pool-${match.id}`}
                label={`${
                  pools.find(pool => pool.id === match.poolId)?.name ?? "Pool"
                }${match.table ? ` · Table ${match.table}` : ""}`}
                playerOne={playerName(match.playerOne)}
                playerTwo={playerName(match.playerTwo)}
                games={match.games}
              />
            ))}
            {knockoutMatches.map(match => (
              <DisplayMatchCard
                key={`knockout-${match.id}`}
                label={`${match.bracket === "grand-final" ? "Grand Final" : `Knockout · Round ${match.round}`}${match.table ? ` · Table ${match.table}` : ""}`}
                playerOne={playerName(match.playerOne)}
                playerTwo={playerName(match.playerTwo)}
                games={match.games}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DisplayMatchCard({
  label,
  playerOne,
  playerTwo,
  games,
}: {
  label: string;
  playerOne: string;
  playerTwo: string;
  games: string[];
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-lg">
      <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wide text-slate-400">
        <span>{label}</span>
        <span className="inline-flex items-center gap-1.5 text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Live
        </span>
      </div>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_30px_minmax(0,1fr)] items-center gap-2 text-lg font-semibold">
        <span className="truncate">{playerOne}</span>
        <span className="text-center text-xs font-bold uppercase text-slate-500">vs</span>
        <span className="truncate text-right">{playerTwo}</span>
      </div>
      <div className="mt-3 min-h-5 text-sm font-medium text-slate-300">
        {games.length > 0 ? games.join("  ·  ") : "Awaiting first set"}
      </div>
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
  tournamentIsLive,
}: {
  pools: ReturnType<typeof useTournament>["tournament"]["pools"];
  matches: TournamentMatch[];
  tournamentIsLive: boolean;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
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
            <div className="flex items-center justify-between gap-4 border-b px-4 py-2.5">
              <h2 className="text-lg font-bold">{pool.name}</h2>
              <p className="text-xs font-semibold text-slate-500">
                {poolMatches.filter(match => match.completed).length}/{poolMatches.length} complete
              </p>
            </div>

            <div>
              <div className="border-b">
                <div className="border-b px-4 py-2 text-xs font-bold uppercase text-slate-500">
                  Standings
                </div>
                {standings.map(standing => (
                  <div
                    key={standing.player.id}
                    className="flex items-center justify-between border-b px-4 py-2 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-900">
                        {standing.position}
                      </div>
                      <div>
                        <div className="font-semibold">
                          {playerName(standing.player)}
                        </div>
                        <div className="text-xs text-slate-500">
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
                <div className="border-b px-4 py-2 text-xs font-bold uppercase text-slate-500">
                  Matches
                </div>
                <div className="grid gap-1.5 p-2">
                {poolMatches.map(match => (
                  <PoolMatchRow
                    key={match.id}
                    match={match}
                    tournamentIsLive={tournamentIsLive}
                  />
                ))}
                </div>
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
  tournamentIsLive,
}: {
  match: TournamentMatch;
  tournamentIsLive: boolean;
}) {
  const winnerName =
    match.winnerId === match.playerOne.id
      ? playerName(match.playerOne)
      : match.winnerId === match.playerTwo.id
        ? playerName(match.playerTwo)
        : null;

  return (
    <div className={`rounded-lg border px-2.5 py-2 ${
      match.completed
        ? "bg-white"
        : tournamentIsLive
          ? "border-green-200 bg-green-50"
          : "bg-slate-50"
    }`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <div className="min-w-[240px] flex-1">
          <div className="grid grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)] items-center text-sm font-semibold">
            <span>{playerName(match.playerOne)}</span>
            <span className="text-center text-xs text-slate-400">vs</span>
            <span className="text-right">{playerName(match.playerTwo)}</span>
          </div>
        </div>

        <div className="min-w-[90px] text-center text-xs font-semibold text-slate-500">
          {match.games.length > 0 ? match.games.join(" · ") : "No sets"}
        </div>

        {match.table && (
          <div className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800">
            Table {match.table}
          </div>
        )}

        {match.completed ? (
          <div className="ml-auto rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
            {winnerName} won
          </div>
        ) : tournamentIsLive ? (
          <div className="ml-auto inline-flex items-center gap-2 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Live
          </div>
        ) : (
          <div className="ml-auto rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600">
            Awaiting Go Live
          </div>
        )}
      </div>
    </div>
  );
}

function BracketMatch({
  match,
  tournamentIsLive,
  hasNextRound,
  eliminatedPlayerIds,
}: {
  match: KnockoutMatch;
  tournamentIsLive: boolean;
  hasNextRound: boolean;
  eliminatedPlayerIds: Set<string>;
}) {
  const isLive =
    tournamentIsLive &&
    !match.completed &&
    match.playerOne &&
    match.playerTwo;

  return (
    <div
      className={`relative rounded-2xl border bg-white p-4 shadow-sm ${
        isLive
          ? "border-emerald-400 ring-4 ring-emerald-100 shadow-lg"
          : "border-slate-200"
      } ${hasNextRound ? "after:absolute after:left-full after:top-1/2 after:w-10 after:border-t-2 after:border-slate-300" : ""}`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-500">
          {match.bracket === "winners"
            ? "Winners"
            : match.bracket === "losers"
              ? "Elimination"
              : match.bracket === "grand-final"
                ? "Grand Final"
                : "Match"} {match.position}
        </span>

        {match.table && (
          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800">
            Table {match.table}
          </span>
        )}

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
        completed={match.completed}
        isTbd={!match.playerOne}
        eliminated={Boolean(
          match.playerOne && eliminatedPlayerIds.has(match.playerOne.id)
        )}
      />

      <div className="py-2 text-center text-xs font-semibold uppercase text-slate-400">
        vs
      </div>

      <BracketPlayer
        name={playerName(match.playerTwo)}
        winner={
          match.winnerId === match.playerTwo?.id
        }
        completed={match.completed}
        isTbd={!match.playerTwo}
        eliminated={Boolean(
          match.playerTwo && eliminatedPlayerIds.has(match.playerTwo.id)
        )}
      />

      {match.games.length > 0 && (
        <div className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-center text-xs font-semibold text-slate-600">
          {match.games.join(" · ")}
        </div>
      )}
    </div>
  );
}

function BracketPlayer({
  name,
  winner,
  completed,
  isTbd,
  eliminated,
}: {
  name: string;
  winner: boolean;
  completed: boolean;
  isTbd: boolean;
  eliminated: boolean;
}) {
  const stateClass = isTbd
    ? "border-dashed border-slate-200 bg-slate-50 font-medium italic text-slate-400"
    : completed && winner && !eliminated
      ? "border-emerald-400 bg-emerald-100 text-emerald-900"
      : completed && winner
        ? "border-slate-300 bg-slate-200 text-slate-600"
      : completed || eliminated
        ? "border-slate-300 bg-slate-200 text-slate-500 line-through"
        : "border-slate-200 bg-white text-slate-900";

  return (
    <div
      className={`rounded-xl border px-4 py-3 font-semibold transition-colors ${stateClass}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span>{name}</span>
        {completed && winner && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ${
            eliminated ? "bg-slate-500" : "bg-emerald-700"
          }`}>
            Advances
          </span>
        )}
      </div>
    </div>
  );
}
