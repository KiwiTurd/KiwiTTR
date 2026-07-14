import { Trophy } from "lucide-react";
import type { ReactNode } from "react";

import type {
  KnockoutMatch,
  Pool,
  TournamentMatch,
} from "../../types/tournament";

function playerName(
  player: { firstName: string; lastName: string } | null
) {
  if (!player) {
    return "TBD";
  }

  const lastInitial = player.lastName.trim().charAt(0).toUpperCase();

  return lastInitial
    ? `${player.firstName} ${lastInitial}`
    : player.firstName;
}

export default function LiveTournamentPanel({
  name,
  pools,
  poolMatches,
  knockoutMatches,
  compact = false,
  viewerCount = 1,
  action,
}: {
  name: string;
  pools: Pool[];
  poolMatches: TournamentMatch[];
  knockoutMatches: KnockoutMatch[];
  compact?: boolean;
  viewerCount?: number;
  action?: ReactNode;
}) {
  const matchCount = poolMatches.length + knockoutMatches.length;
  const dense = compact && (viewerCount >= 4 || matchCount >= 6);
  const minimumCardWidth = dense
    ? 150
    : compact
      ? 190
      : matchCount >= 9
        ? 210
        : 260;

  return (
    <div className={compact ? "flex min-h-0 flex-1 flex-col" : ""}>
      <div className={`flex items-start justify-between gap-3 border-b border-slate-700 ${compact ? "pb-3" : "pb-4"}`}>
        <div className="min-w-0">
          <div className={`flex items-center gap-2 font-bold uppercase tracking-widest text-emerald-400 ${compact ? "text-[10px]" : "text-sm"}`}>
            <span className={`${compact ? "h-2 w-2" : "h-2.5 w-2.5"} animate-pulse rounded-full bg-emerald-400`} />
            Live matches
          </div>
          <h1 className={`mt-2 truncate font-normal tracking-tight text-white ${compact ? "text-base md:text-lg" : "text-3xl md:text-5xl"}`}>
            {name}
          </h1>
          <p className={`mt-1 text-slate-300 ${compact ? "text-xs" : "mt-2"}`}>
            {matchCount} match{matchCount === 1 ? "" : "es"} currently on display
          </p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {matchCount === 0 ? (
        <div className={`flex flex-1 flex-col items-center justify-center text-center ${compact ? "py-10" : "py-24"}`}>
          <Trophy className={`${compact ? "h-8 w-8" : "h-12 w-12"} text-slate-600`} />
          <h2 className={`mt-4 font-semibold ${compact ? "text-base" : "text-2xl"}`}>
            No live matches right now
          </h2>
          <p className="mt-2 text-sm text-slate-400">New matches will appear here automatically.</p>
        </div>
      ) : (
        <div
          className={`${compact ? "mt-3 min-h-0 flex-1 overflow-y-auto pr-1" : "mt-5"} grid content-start gap-3`}
          style={{
            gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minimumCardWidth}px), 1fr))`,
          }}
        >
          {poolMatches.map(match => (
            <DisplayMatchCard
              key={`pool-${match.id}`}
              label={`${
                pools.find(pool => pool.id === match.poolId)?.name ?? "Pool"
              }${match.table ? ` · Table ${match.table}` : ""}`}
              playerOne={playerName(match.playerOne)}
              playerTwo={playerName(match.playerTwo)}
              games={match.games}
              dense={dense}
              compact={compact}
            />
          ))}
          {knockoutMatches.map(match => (
            <DisplayMatchCard
              key={`knockout-${match.id}`}
              label={`${match.bracket === "grand-final" ? "Grand Final" : `Knockout · Round ${match.round}`}${match.table ? ` · Table ${match.table}` : ""}`}
              playerOne={playerName(match.playerOne)}
              playerTwo={playerName(match.playerTwo)}
              games={match.games}
              dense={dense}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DisplayMatchCard({
  label,
  playerOne,
  playerTwo,
  games,
  dense,
  compact,
}: {
  label: string;
  playerOne: string;
  playerTwo: string;
  games: string[];
  dense: boolean;
  compact: boolean;
}) {
  return (
    <div className={`rounded-xl border border-slate-700 bg-slate-900 shadow-lg ${dense ? "p-2.5" : "p-4"}`}>
      <div className={`flex items-center justify-between gap-2 font-bold uppercase tracking-wide text-slate-400 ${dense ? "text-[9px]" : "text-xs"}`}>
        <span className="truncate">{label}</span>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Live
        </span>
      </div>
      <div className={`grid grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)] items-center gap-1 font-semibold ${
        dense
          ? "mt-2 text-xs"
          : compact
            ? "mt-2.5 text-sm"
            : "mt-3 text-lg"
      }`}>
        <span className="truncate">{playerOne}</span>
        <span className="text-center text-[10px] font-bold uppercase text-slate-500">vs</span>
        <span className="truncate text-right">{playerTwo}</span>
      </div>
      <div className={`min-h-5 truncate font-medium text-slate-300 ${dense ? "mt-1.5 text-xs" : "mt-3 text-sm"}`}>
        {games.length > 0 ? games.join("  ·  ") : "Awaiting first set"}
      </div>
    </div>
  );
}
