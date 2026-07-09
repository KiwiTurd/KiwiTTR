import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useParams,
} from "react-router-dom";

import {
  Circle,
  Crown,
  Swords,
  Trophy,
  Users,
} from "lucide-react";

import { useTournament } from "../context/TournamentContext";
import { advanceWinner } from "../services/tournament/advanceKnockout";
import { getQualifiers } from "../services/tournament/getQualifiers";
import {
  arePoolsComplete,
  getNextUnplayedMatch,
  recordMatchResult,
} from "../services/tournament/matchProgression";
import { generateKnockout } from "../services/tournament/knockoutGenerator";
import type { KnockoutMatch } from "../types/tournament";
import { calculatePoolStandings } from "../services/tournament/standings";
import type { TournamentMatch } from "../types/tournament";
import { finishTournamentAndRecordRatings } from "../services/supabase/tournamentService";
import { notify } from "../services/notificationService";

const emptyGames = ["", "", "", "", ""];

function playerName(
  player: { firstName: string; lastName: string } | null
) {
  return player
    ? `${player.firstName} ${player.lastName}`
    : "TBD";
}

export default function TournamentLive() {
  const {
    tournament,
    loadTournament,
    setMatches,
    setKnockout,
  } = useTournament();

  const { id } = useParams();

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

  const initialTab =
    tournament.settings.format === "knockout"
      ? "knockout"
      : "pools";

  const [activeTab, setActiveTab] = useState<
    "pools" | "knockout" | "results"
  >(initialTab);

  const [
    selectedPoolMatch,
    setSelectedPoolMatch,
  ] = useState<TournamentMatch | null>(
    getNextUnplayedMatch(tournament.matches) ?? null
  );

  const [
    selectedKnockoutMatchId,
    setSelectedKnockoutMatchId,
  ] = useState<string | null>(null);

  const [winnerId, setWinnerId] = useState("");
  const [games, setGames] = useState(emptyGames);
  const [finishing, setFinishing] = useState(false);

  const standings = useMemo(
    () =>
      tournament.pools.map((pool) => ({
        pool,
        standings: calculatePoolStandings(
          pool,
          tournament.matches
        ),
      })),
    [tournament.pools, tournament.matches]
  );

  const poolMatchesComplete =
    tournament.matches.filter(match => match.completed).length;

  const remainingPoolMatches =
    tournament.matches.filter(match => !match.completed);

  const playableKnockoutMatches =
    tournament.knockout.filter(
      match =>
        !match.completed &&
        match.playerOne &&
        match.playerTwo
    );

  const selectedKnockoutMatch =
    tournament.knockout.find(
      match => match.id === selectedKnockoutMatchId
    ) ??
    playableKnockoutMatches[0] ??
    null;

  const completedKnockoutMatches =
    tournament.knockout.filter(match => match.completed);

  const completedMatches =
    poolMatchesComplete + completedKnockoutMatches.length;

  const totalMatches =
    tournament.matches.length + tournament.knockout.length;

  const championMatch =
    tournament.knockout.find(
      match =>
        match.round ===
        Math.max(
          0,
          ...tournament.knockout.map(item => item.round)
        )
    );

  const champion =
    championMatch?.winnerId
      ? championMatch.playerOne?.id === championMatch.winnerId
        ? championMatch.playerOne
        : championMatch.playerTwo
      : null;

  const tournamentComplete =
    totalMatches > 0 &&
    completedMatches === totalMatches &&
    Boolean(champion);

  function resetEntry() {
    setWinnerId("");
    setGames(emptyGames);
  }

  function ensureKnockoutFromPools(
    updatedMatches: TournamentMatch[]
  ) {
    if (
      tournament.settings.format !== "pools" ||
      tournament.knockout.length > 0 ||
      !arePoolsComplete(updatedMatches)
    ) {
      return;
    }

    const qualifiers = getQualifiers(
      tournament.pools,
      updatedMatches,
      tournament.settings.progressing
    );

    setKnockout(generateKnockout(qualifiers));
    setActiveTab("knockout");
  }

  function savePoolResult() {
    if (!selectedPoolMatch || !winnerId) {
      return;
    }

    const updatedMatches = recordMatchResult(
      tournament.matches,
      selectedPoolMatch.id,
      winnerId,
      games.filter(game => game.trim() !== "")
    );

    setMatches(updatedMatches);
    ensureKnockoutFromPools(updatedMatches);
    setSelectedPoolMatch(
      getNextUnplayedMatch(updatedMatches) ?? null
    );
    resetEntry();
  }

  function saveKnockoutResult() {
    if (!selectedKnockoutMatch || !winnerId) {
      return;
    }

    const updatedKnockout = advanceWinner(
      tournament.knockout,
      selectedKnockoutMatch.id,
      winnerId,
      games.filter(game => game.trim() !== "")
    );

    setKnockout(updatedKnockout);

    const nextMatch = updatedKnockout.find(
      match =>
        !match.completed &&
        match.playerOne &&
        match.playerTwo
    );

    setSelectedKnockoutMatchId(nextMatch?.id ?? null);
    resetEntry();
  }

  function renderPlayerRating(
    rating: number
  ) {
    if (tournament.settings.socialPlay) {
      return null;
    }

    return (
      <div className="text-sm text-slate-500">
        {rating} TTR
      </div>
    );
  }

  async function finishTournament() {
    if (!tournament.id || !tournamentComplete) {
      return;
    }

    setFinishing(true);

    try {
      await finishTournamentAndRecordRatings(
        tournament.id
      );
      await loadTournament(tournament.id);
      notify.ratingsUpdated();
    } catch (error) {
      console.error(error);
      notify.fault(
        error instanceof Error
          ? error.message
          : "Unable to finish tournament."
      );
    } finally {
      setFinishing(false);
    }
  }

  if (
    id &&
    tournament.id !== id
  ) {
    return (
      <div className="rounded-3xl border bg-white p-10 text-center text-slate-500 shadow-sm">
        Loading tournament...
      </div>
    );
  }

  if (!tournament.settings.name) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border bg-white p-10 text-center shadow-sm">
        <h1 className="text-3xl font-black">
          No tournament selected
        </h1>
        <p className="mt-3 text-slate-500">
          Choose a saved tournament from the Tournament Centre.
        </p>
        <Link
          to="/tournaments"
          className="mt-6 inline-flex rounded-xl bg-blue-900 px-5 py-3 font-semibold text-white hover:bg-blue-800"
        >
          Open Tournaments
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
            <Circle className="h-3 w-3 fill-current" />
            Live Tournament
          </div>
          <h1 className="mt-4 text-5xl font-black">
            {tournament.settings.name || "Tournament"}
          </h1>
          <p className="mt-3 text-lg text-slate-500">
            {tournament.settings.socialPlay
              ? "Social play"
              : "KiwiTTR event"}
            {" "}-
            {" "}
            {tournament.settings.seedByTTR
              ? "seeded by rating"
              : "random draw"}
          </p>
        </div>

        {champion && (
          <div className="rounded-2xl border bg-white p-5 text-right shadow-sm">
            <div className="flex items-center justify-end gap-2 text-sm font-semibold text-amber-700">
              <Crown className="h-4 w-4" />
              Champion
            </div>
            <div className="mt-2 text-2xl font-black">
              {playerName(champion)}
            </div>
            {tournamentComplete && (
              <button
                type="button"
                onClick={() => void finishTournament()}
                disabled={finishing}
                className="mt-4 rounded-xl bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {finishing
                  ? "Finishing..."
                  : tournament.settings.socialPlay ||
                    tournament.settings.format === "doubles"
                    ? "Finish Tournament"
                    : "Finish & Update Ratings"}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        <SummaryCard
          icon={<Users className="h-5 w-5 text-blue-700" />}
          label="Players"
          value={tournament.players.length}
        />
        <SummaryCard
          icon={<Trophy className="h-5 w-5 text-blue-700" />}
          label="Pools"
          value={tournament.pools.length || "-"}
        />
        <SummaryCard
          icon={<Swords className="h-5 w-5 text-blue-700" />}
          label="Matches"
          value={totalMatches}
        />
        <SummaryCard
          icon={<Circle className="h-5 w-5 fill-current text-green-600" />}
          label="Completed"
          value={`${completedMatches}/${Math.max(1, totalMatches)}`}
        />
      </div>

      <div className="flex gap-3">
        {tournament.settings.format === "pools" && (
          <TabButton
            active={activeTab === "pools"}
            onClick={() => setActiveTab("pools")}
          >
            Pools
          </TabButton>
        )}
        <TabButton
          active={activeTab === "knockout"}
          onClick={() => setActiveTab("knockout")}
        >
          Knockout
        </TabButton>
        <TabButton
          active={activeTab === "results"}
          onClick={() => setActiveTab("results")}
        >
          Results
        </TabButton>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {activeTab === "pools" &&
            standings.map(({ pool, standings }) => (
              <div
                key={pool.id}
                className="rounded-3xl border bg-white shadow-sm"
              >
                <div className="border-b px-6 py-5">
                  <h2 className="text-2xl font-bold">
                    {pool.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {pool.players.length} players
                  </p>
                </div>
                <div>
                  {standings.map(standing => (
                    <div
                      key={standing.player.id}
                      className="flex items-center justify-between border-b px-6 py-4 last:border-b-0"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-900">
                          {standing.position}
                        </div>
                        <div>
                          <div className="font-semibold">
                            {playerName(standing.player)}
                          </div>
                          {renderPlayerRating(
                            standing.player.rating
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {standing.wins}-{standing.losses}
                        </div>
                        <div className="text-sm text-slate-500">
                          {standing.gamesWon}-{standing.gamesLost}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

          {activeTab === "knockout" && (
            <div className="grid gap-5 lg:grid-cols-2">
              {tournament.knockout.length === 0 ? (
                <EmptyPanel text="Complete the pool stage to create the knockout draw." />
              ) : (
                tournament.knockout.map(match => (
                  <button
                    key={match.id}
                    onClick={() => {
                      if (
                        match.playerOne &&
                        match.playerTwo &&
                        !match.completed
                      ) {
                        setSelectedKnockoutMatchId(match.id);
                        resetEntry();
                      }
                    }}
                    className={`rounded-2xl border bg-white p-6 text-left shadow-sm transition ${
                      selectedKnockoutMatch?.id === match.id
                        ? "border-blue-500 bg-blue-50"
                        : "hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-500">
                        Round {match.round} - Match {match.position}
                      </div>
                      {match.completed && (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          Complete
                        </span>
                      )}
                    </div>
                    <KnockoutPlayer
                      name={playerName(match.playerOne)}
                      winner={
                        match.winnerId === match.playerOne?.id
                      }
                    />
                    <div className="text-center text-sm text-slate-400">
                      vs
                    </div>
                    <KnockoutPlayer
                      name={playerName(match.playerTwo)}
                      winner={
                        match.winnerId === match.playerTwo?.id
                      }
                    />
                  </button>
                ))
              )}
            </div>
          )}

          {activeTab === "results" && (
            <div className="space-y-5">
              {[...tournament.matches, ...completedKnockoutMatches].length === 0 ? (
                <EmptyPanel text="No completed results yet." />
              ) : (
                <>
                  {tournament.matches
                    .filter(match => match.completed)
                    .map(match => (
                      <ResultRow
                        key={match.id}
                        label={
                          tournament.pools.find(
                            pool => pool.id === match.poolId
                          )?.name ?? "Pool"
                        }
                        playerOne={playerName(match.playerOne)}
                        playerTwo={playerName(match.playerTwo)}
                        winner={
                          match.winnerId === match.playerOne.id
                            ? playerName(match.playerOne)
                            : playerName(match.playerTwo)
                        }
                      />
                    ))}
                  {completedKnockoutMatches.map(match => (
                    <ResultRow
                      key={match.id}
                      label={`Knockout round ${match.round}`}
                      playerOne={playerName(match.playerOne)}
                      playerTwo={playerName(match.playerTwo)}
                      winner={
                        match.winnerId === match.playerOne?.id
                          ? playerName(match.playerOne)
                          : playerName(match.playerTwo)
                      }
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">
              Tournament Progress
            </h2>
            <div className="mt-6">
              <div className="mb-2 flex justify-between text-sm">
                <span>
                  {completedMatches} of {Math.max(1, totalMatches)} matches completed
                </span>
                <span>
                  {Math.round(
                    (completedMatches / Math.max(1, totalMatches)) * 100
                  )}
                  %
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-500"
                  style={{
                    width: `${(completedMatches / Math.max(1, totalMatches)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {activeTab === "pools" && (
            <PoolQueue
              matches={remainingPoolMatches}
              selectedMatch={selectedPoolMatch}
              onSelect={(match) => {
                setSelectedPoolMatch(match);
                resetEntry();
              }}
            />
          )}

          {activeTab === "knockout" && (
            <KnockoutQueue
              matches={playableKnockoutMatches}
              selectedMatch={selectedKnockoutMatch}
              onSelect={(match) => {
                setSelectedKnockoutMatchId(match.id);
                resetEntry();
              }}
            />
          )}

          {activeTab === "pools" && selectedPoolMatch && (
            <ResultEntry
              title="Enter Pool Result"
              playerOne={selectedPoolMatch.playerOne}
              playerTwo={selectedPoolMatch.playerTwo}
              winnerId={winnerId}
              games={games}
              onWinnerChange={setWinnerId}
              onGamesChange={setGames}
              onSave={savePoolResult}
            />
          )}

          {activeTab === "knockout" && selectedKnockoutMatch && (
            <ResultEntry
              title="Enter Knockout Result"
              playerOne={selectedKnockoutMatch.playerOne}
              playerTwo={selectedKnockoutMatch.playerTwo}
              winnerId={winnerId}
              games={games}
              onWinnerChange={setWinnerId}
              onGamesChange={setGames}
              onSave={saveKnockoutResult}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-slate-500">
          {label}
        </span>
      </div>
      <div className="mt-3 text-3xl font-black">
        {value}
      </div>
    </div>
  );
}

function TabButton({
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
      onClick={onClick}
      className={`rounded-xl px-5 py-3 font-semibold transition ${
        active
          ? "bg-blue-900 text-white"
          : "border bg-white"
      }`}
    >
      {children}
    </button>
  );
}

function KnockoutPlayer({
  name,
  winner,
}: {
  name: string;
  winner: boolean;
}) {
  return (
    <div
      className={`mt-4 rounded-xl border px-4 py-3 font-semibold ${
        winner
          ? "border-green-300 bg-green-50 text-green-800"
          : ""
      }`}
    >
      {name}
    </div>
  );
}

function EmptyPanel({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-3xl border bg-white p-10 text-center text-slate-500">
      {text}
    </div>
  );
}

function PoolQueue({
  matches,
  selectedMatch,
  onSelect,
}: {
  matches: TournamentMatch[];
  selectedMatch: TournamentMatch | null;
  onSelect: (match: TournamentMatch) => void;
}) {
  return (
    <QueueShell title="Remaining Pool Matches">
      {matches.length === 0 ? (
        <div className="p-8 text-center text-slate-500">
          All pool matches completed.
        </div>
      ) : (
        matches.map(match => (
          <QueueButton
            key={match.id}
            active={selectedMatch?.id === match.id}
            onClick={() => onSelect(match)}
            label={playerName(match.playerOne)}
            subLabel="vs"
            detail={playerName(match.playerTwo)}
          />
        ))
      )}
    </QueueShell>
  );
}

function KnockoutQueue({
  matches,
  selectedMatch,
  onSelect,
}: {
  matches: KnockoutMatch[];
  selectedMatch: KnockoutMatch | null;
  onSelect: (match: KnockoutMatch) => void;
}) {
  return (
    <QueueShell title="Remaining Knockout Matches">
      {matches.length === 0 ? (
        <div className="p-8 text-center text-slate-500">
          No playable knockout matches.
        </div>
      ) : (
        matches.map(match => (
          <QueueButton
            key={match.id}
            active={selectedMatch?.id === match.id}
            onClick={() => onSelect(match)}
            label={playerName(match.playerOne)}
            subLabel={`Round ${match.round}`}
            detail={playerName(match.playerTwo)}
          />
        ))
      )}
    </QueueShell>
  );
}

function QueueShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border bg-white shadow-sm">
      <div className="border-b px-6 py-5">
        <h2 className="text-xl font-bold">
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Click a match to enter the score.
        </p>
      </div>
      <div className="max-h-[450px] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

function QueueButton({
  active,
  onClick,
  label,
  subLabel,
  detail,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  subLabel: string;
  detail: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full border-b px-6 py-5 text-left transition last:border-b-0 hover:bg-blue-50 ${
        active ? "bg-blue-50" : ""
      }`}
    >
      <div className="font-semibold">
        {label}
      </div>
      <div className="my-1 text-sm text-slate-400">
        {subLabel}
      </div>
      <div className="font-semibold">
        {detail}
      </div>
    </button>
  );
}

function ResultEntry({
  title,
  playerOne,
  playerTwo,
  winnerId,
  games,
  onWinnerChange,
  onGamesChange,
  onSave,
}: {
  title: string;
  playerOne: { id: string; firstName: string; lastName: string } | null;
  playerTwo: { id: string; firstName: string; lastName: string } | null;
  winnerId: string;
  games: string[];
  onWinnerChange: (winnerId: string) => void;
  onGamesChange: (games: string[]) => void;
  onSave: () => void;
}) {
  if (!playerOne || !playerTwo) {
    return null;
  }

  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">
        {title}
      </h2>
      <p className="mt-2 text-slate-500">
        {playerName(playerOne)} vs {playerName(playerTwo)}
      </p>
      <select
        value={winnerId}
        onChange={(event) => onWinnerChange(event.target.value)}
        className="mt-6 w-full rounded-xl border p-3"
      >
        <option value="">
          Select winner
        </option>
        <option value={playerOne.id}>
          {playerName(playerOne)}
        </option>
        <option value={playerTwo.id}>
          {playerName(playerTwo)}
        </option>
      </select>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {games.map((game, index) => (
          <input
            key={index}
            value={game}
            onChange={(event) => {
              const next = [...games];
              next[index] = event.target.value;
              onGamesChange(next);
            }}
            placeholder="11-8"
            className="rounded-xl border p-3"
          />
        ))}
      </div>
      <button
        onClick={onSave}
        disabled={!winnerId}
        className="mt-6 flex w-full items-center justify-center rounded-xl bg-blue-900 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Save Result
      </button>
    </div>
  );
}

function ResultRow({
  label,
  playerOne,
  playerTwo,
  winner,
}: {
  label: string;
  playerOne: string;
  playerTwo: string;
  winner: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-slate-500">
        {label}
      </div>
      <div className="mt-2 font-semibold">
        {playerOne} vs {playerTwo}
      </div>
      <div className="mt-2 text-sm text-green-700">
        Winner: {winner}
      </div>
    </div>
  );
}
