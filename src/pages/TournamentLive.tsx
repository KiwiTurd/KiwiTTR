import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Eye,
  Crown,
  Pencil,
  Save,
  Trash2,
} from "lucide-react";

import { useTournament } from "../context/TournamentContext";
import useRole from "../hooks/useRole";
import { advanceWinner } from "../services/tournament/advanceKnockout";
import { getQualifiers } from "../services/tournament/getQualifiers";
import {
  arePoolsComplete,
  getNextUnplayedMatch,
  recordMatchResult,
} from "../services/tournament/matchProgression";
import { generateKnockout } from "../services/tournament/knockoutGenerator";
import {
  advanceDoubleKnockout,
  getDoubleKnockoutChampion,
} from "../services/tournament/doubleKnockout";
import { calculatePoolStandings } from "../services/tournament/standings";
import type { TournamentMatch } from "../types/tournament";
import { finishTournamentAndRecordRatings } from "../services/supabase/tournamentService";
import { notify } from "../services/notificationService";
import LoadingScreen from "../components/shared/LoadingScreen";

const emptyGames = ["", "", "", "", ""];
const emptyConfirmedGames = [false, false, false, false, false];

function playerName(
  player: { firstName: string; lastName: string } | null
) {
  return player
    ? `${player.firstName} ${player.lastName}`
    : "TBD";
}

function tournamentFormatLabel(
  format: "knockout" | "double-knockout" | "pools" | "pool-ratings" | "doubles"
) {
  if (format === "double-knockout") return "Double Knockout";
  if (format === "pool-ratings") return "Pool Only Ratings";
  if (format === "pools") return "Pools";
  if (format === "doubles") return "Doubles";
  return "Knockout";
}

export default function TournamentLive() {
  const {
    tournament,
    deleteTournament,
    loadTournament,
    setMatches,
    setKnockout,
    setTournamentState,
  } = useTournament();
  const navigate = useNavigate();
  const {
    isAdmin,
    isClubLeader,
    clubId: userClubId,
  } = useRole();

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
    tournament.settings.format === "knockout" ||
    tournament.settings.format === "double-knockout"
      ? "knockout"
      : "pools";
  const isPoolOnlyRatings =
    tournament.settings.format === "pool-ratings";

  const [activeTab, setActiveTab] = useState<
    "pools" | "knockout" | "results"
  >(initialTab);
  const restoredTabForTournament = useRef("");

  useEffect(() => {
    if (!tournament.id) return;

    if (restoredTabForTournament.current === tournament.id) {
      window.sessionStorage.setItem(
        `tournament-input-tab:${tournament.id}`,
        activeTab
      );
      return;
    }

    restoredTabForTournament.current = tournament.id;
    const savedTab = window.sessionStorage.getItem(
      `tournament-input-tab:${tournament.id}`
    );

    if (
      savedTab === "pools" ||
      savedTab === "knockout" ||
      savedTab === "results"
    ) {
      setActiveTab(savedTab);
    }
  }, [activeTab, tournament.id]);

  const [
    selectedPoolMatchState,
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
  const [confirmedGames, setConfirmedGames] = useState(emptyConfirmedGames);
  const [expandedPoolId, setExpandedPoolId] = useState<string | null>(null);
  const [focusedPoolId, setFocusedPoolId] = useState("");
  const [finishing, setFinishing] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const selectedPoolMatch =
    selectedPoolMatchState ??
    getNextUnplayedMatch(tournament.matches) ??
    null;

  const selectedKnockoutMatch =
    tournament.knockout.find(
      match => match.id === selectedKnockoutMatchId
    ) ??
    tournament.knockout.find(
      match =>
        !match.completed &&
        Boolean(match.playerOne) &&
        Boolean(match.playerTwo)
    ) ?? null;

  useEffect(() => {
    const match = activeTab === "pools"
      ? selectedPoolMatch
      : activeTab === "knockout"
        ? selectedKnockoutMatch
        : null;

    if (!match) return;
    restoreEntry(match);
  }, [
    activeTab,
    selectedPoolMatch?.id,
    selectedPoolMatch?.games,
    selectedKnockoutMatch?.id,
    selectedKnockoutMatch?.games,
  ]);

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

  const champion = tournament.settings.format === "double-knockout"
    ? getDoubleKnockoutChampion(tournament.players, tournament.knockout)
    : championMatch?.winnerId
      ? championMatch.playerOne?.id === championMatch.winnerId
        ? championMatch.playerOne
        : championMatch.playerTwo
      : null;

  const tournamentComplete =
    totalMatches > 0 &&
    completedMatches === totalMatches &&
    (isPoolOnlyRatings || Boolean(champion));

  const tournamentLocked =
    tournament.status === "completed" ||
    tournament.status === "cancelled";
  const canInputMatches = tournament.status === "active";

  function markLive() {
    if (!tournament.id || tournamentLocked || canInputMatches) return;

    setTournamentState({
      ...tournament,
      status: "active",
    });
    notify.edgeBall(
      `${tournament.settings.name || "Tournament"} is now live. Match input is enabled.`
    );
  }

  async function deleteCurrentTournament() {
    if (!tournament.id || !isAdmin || deleting) return;

    const confirmed = window.confirm(
      `Delete ${tournament.settings.name}? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteTournament(tournament.id);
      notify.edgeBall("Tournament deleted.");
      navigate("/tournaments");
    } catch (error) {
      console.error(error);
      notify.fault("Unable to delete tournament.");
      setDeleting(false);
    }
  }

  function resetEntry() {
    setWinnerId("");
    setGames(emptyGames);
    setConfirmedGames(emptyConfirmedGames);
  }

  function restoreEntry(match: {
    games: string[];
    playerOne: { id: string } | null;
    playerTwo: { id: string } | null;
  }) {
    const savedGames = match.games.slice(0, 5);
    const nextGames = [
      ...savedGames,
      ...Array(Math.max(0, 5 - savedGames.length)).fill(""),
    ];
    const nextConfirmed = nextGames.map(
      (game, index) => index < savedGames.length && game.trim() !== ""
    );

    let playerOneSets = 0;
    let playerTwoSets = 0;
    savedGames.forEach(game => {
      const [one, two] = game.split("-").map(Number);
      if (one > two) playerOneSets += 1;
      if (two > one) playerTwoSets += 1;
    });

    setGames(nextGames);
    setConfirmedGames(nextConfirmed);
    setWinnerId(
      playerOneSets >= 3
        ? match.playerOne?.id ?? ""
        : playerTwoSets >= 3
          ? match.playerTwo?.id ?? ""
          : ""
    );
  }

  function focusPool(poolId: string) {
    setFocusedPoolId(poolId);
    setExpandedPoolId(poolId || null);
    if (!poolId) return;

    window.requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>(`[data-pool-card="${poolId}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
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
    if (!canInputMatches || !selectedPoolMatch || !winnerId) {
      return;
    }

    const updatedMatches = recordMatchResult(
      tournament.matches,
      selectedPoolMatch.id,
      winnerId,
      games.filter((game, index) =>
        confirmedGames[index] && game.trim() !== ""
      )
    );

    setMatches(updatedMatches);
    ensureKnockoutFromPools(updatedMatches);
    setSelectedPoolMatch(
      getNextUnplayedMatch(updatedMatches) ?? null
    );
    resetEntry();
  }

  function savePoolSets(savedGames: string[]) {
    if (!selectedPoolMatch) return;
    setMatches(
      tournament.matches.map(match =>
        match.id === selectedPoolMatch.id
          ? { ...match, games: savedGames }
          : match
      )
    );
  }

  function saveKnockoutSets(savedGames: string[]) {
    if (!selectedKnockoutMatch) return;
    setKnockout(
      tournament.knockout.map(match =>
        match.id === selectedKnockoutMatch.id
          ? { ...match, games: savedGames }
          : match
      )
    );
  }

  function savePoolTable(poolId: string, table?: number) {
    setMatches(
      tournament.matches.map(match =>
        match.poolId === poolId
          ? { ...match, table }
          : match
      )
    );
  }

  function saveKnockoutTable(matchId: string, table?: number) {
    setKnockout(
      tournament.knockout.map(match =>
        match.id === matchId
          ? { ...match, table }
          : match
      )
    );
  }

  function saveKnockoutResult() {
    if (!canInputMatches || !selectedKnockoutMatch || !winnerId) {
      return;
    }

    const updatedKnockout =
      tournament.settings.format === "double-knockout"
        ? advanceDoubleKnockout(
            tournament.knockout,
            tournament.players,
            selectedKnockoutMatch.id,
            winnerId,
            games.filter((game, index) =>
              confirmedGames[index] && game.trim() !== ""
            )
          )
        : advanceWinner(
            tournament.knockout,
            selectedKnockoutMatch.id,
            winnerId,
            games.filter((game, index) =>
              confirmedGames[index] && game.trim() !== ""
            )
          );

    setKnockout(updatedKnockout);

    const nextMatch = updatedKnockout.find(
      match =>
        !match.completed &&
        Boolean(match.playerOne) &&
        Boolean(match.playerTwo)
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
    return <LoadingScreen label="Loading tournament..." />;
  }

  if (!tournament.settings.name) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border bg-white p-10 text-center shadow-sm">
        <h1 className="text-3xl font-normal">
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

  if (
    !isAdmin &&
    (
      !isClubLeader ||
      userClubId !== tournament.settings.clubId
    )
  ) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border bg-white p-10 text-center shadow-sm">
        <h1 className="text-3xl font-normal">
          Tournament unavailable
        </h1>
        <p className="mt-3 text-slate-500">
          Only admins and this club's admins can manage this tournament.
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
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <Link
          to="/tournaments"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Tournaments
        </Link>
        <div className="mt-6 flex items-start justify-between gap-6 border-b border-slate-300 pb-6">
          <div className="tournament-page-header-copy">
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
              {tournamentFormatLabel(tournament.settings.format)} Tournament Builder
            </p>
            <h1 className="mt-2 text-5xl font-normal tracking-tight">
            {tournament.settings.name || "Tournament"}
            </h1>
            <p className="mt-3 text-lg text-slate-500">
              {new Date(`${tournament.settings.date}T00:00:00`).toLocaleDateString()}
              {" · "}{tournament.players.length} players
              {" · "}{tournament.settings.socialPlay ? "Social play" : "KiwiTTR event"}
              {" · "}{tournament.settings.seedByTTR ? "Seeded by rating" : "Random draw"}
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
            {tournamentComplete && !tournamentLocked && (
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
          {isPoolOnlyRatings && tournamentComplete && !tournamentLocked && (
            <div className="rounded-2xl border bg-white p-5 text-right shadow-sm">
              <div className="text-sm font-semibold text-emerald-700">
                All pool matches complete
              </div>
              <button
                type="button"
                onClick={() => void finishTournament()}
                disabled={finishing}
                className="mt-3 rounded-xl bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {finishing ? "Finishing..." : "Finish & Update Ratings"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {tournament.status === "draft" && (
          <Link
            to="/tournaments/players"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
        )}
        {tournament.status === "draft" && (
          <button
            type="button"
            onClick={markLive}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-600"
          >
            Go Live
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
        <Link
          to={`/tournaments/${tournament.id}/viewer`}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <Eye className="h-4 w-4" />
          Open Live Viewer
        </Link>
        {isAdmin && (
          <button
            type="button"
            onClick={() => void deleteCurrentTournament()}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-70"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "Deleting..." : "Delete"}
          </button>
        )}
      </div>

      {tournamentLocked && (
        <div className="rounded-2xl border bg-slate-50 px-5 py-4 font-semibold text-slate-700">
          This tournament is {tournament.status}. Results and draw management are locked.
        </div>
      )}

      <div className="flex gap-3">
        {(tournament.settings.format === "pools" || isPoolOnlyRatings) && (
          <TabButton
            active={activeTab === "pools"}
            onClick={() => setActiveTab("pools")}
          >
            Pools
          </TabButton>
        )}
        {!isPoolOnlyRatings && <TabButton
          active={activeTab === "knockout"}
          onClick={() => setActiveTab("knockout")}
        >
          Knockout
        </TabButton>}
        <TabButton
          active={activeTab === "results"}
          onClick={() => setActiveTab("results")}
        >
          Results
        </TabButton>
      </div>

      <div className={`grid gap-6 ${
        canInputMatches &&
        (
          (activeTab === "pools" && selectedPoolMatch) ||
          (activeTab === "knockout" && selectedKnockoutMatch)
        )
          ? "xl:grid-cols-[1fr_380px]"
          : "grid-cols-1"
      }`}>
        <div className="space-y-6">
          {activeTab === "pools" && (
            <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border bg-white px-3 py-2 shadow-sm">
              <label htmlFor="pool-quick-select" className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Pool quick select
              </label>
              <select
                id="pool-quick-select"
                value={focusedPoolId}
                onChange={(event) => focusPool(event.target.value)}
                className="w-44 rounded-lg border bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
              >
                <option value="">All pools</option>
                {standings.map(({ pool }) => (
                  <option key={pool.id} value={pool.id}>{pool.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
            {standings
              .filter(({ pool }) => !focusedPoolId || pool.id === focusedPoolId)
              .map(({ pool, standings }) => (
              <div
                key={pool.id}
                data-pool-card={pool.id}
                className={`overflow-hidden rounded-xl border bg-white shadow-sm transition ${
                  expandedPoolId === pool.id ? "lg:col-span-2" : ""
                } ${
                  focusedPoolId === pool.id
                    ? "border-blue-400 ring-4 ring-blue-100"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
                  <div>
                    <h2 className="text-lg font-bold">
                      {pool.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {pool.players.length} players
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <TableAssignment
                      value={tournament.matches.find(match => match.poolId === pool.id)?.table}
                      disabled={!canInputMatches}
                      onSave={(table) => savePoolTable(pool.id, table)}
                    />
                    <button
                      type="button"
                      onClick={() => setExpandedPoolId(
                        expandedPoolId === pool.id ? null : pool.id
                      )}
                      className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      {remainingPoolMatches.filter((match) => match.poolId === pool.id).length} remaining
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${
                        expandedPoolId === pool.id ? "rotate-180" : ""
                      }`} />
                    </button>
                  </div>
                </div>
                <div className={expandedPoolId === pool.id ? "lg:grid lg:grid-cols-2" : ""}>
                <div>
                  {standings.map(standing => (
                    <div
                      key={standing.player.id}
                      className="flex items-center justify-between border-b px-4 py-2.5 last:border-b-0"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-900">
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
                {expandedPoolId === pool.id && (
                  <div className="border-t bg-slate-50 lg:border-l lg:border-t-0">
                    <div className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Remaining pool matches
                    </div>
                    {remainingPoolMatches.filter((match) => match.poolId === pool.id).length === 0 ? (
                      <p className="px-4 pb-3 text-sm text-slate-500">
                        All pool matches completed.
                      </p>
                    ) : (
                      remainingPoolMatches
                        .filter((match) => match.poolId === pool.id)
                        .map((match) => (
                          <button
                            key={match.id}
                            type="button"
                            disabled={!canInputMatches}
                            onClick={() => {
                              setSelectedPoolMatch(match);
                              restoreEntry(match);
                            }}
                            className={`grid w-full grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)] items-center gap-3 border-t px-4 py-2.5 text-left text-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 ${
                              selectedPoolMatch?.id === match.id ? "bg-blue-50" : "bg-white"
                            }`}
                          >
                            <span className="font-semibold">{playerName(match.playerOne)}</span>
                            <span className="text-center text-xs text-slate-400">vs</span>
                            <span className="text-right font-semibold">{playerName(match.playerTwo)}</span>
                          </button>
                        ))
                    )}
                  </div>
                )}
                </div>
              </div>
            ))}
            </div>
            </div>
          )}

          {activeTab === "knockout" && (
            <div className="grid gap-5 lg:grid-cols-2">
              {tournament.knockout.length === 0 ? (
                <EmptyPanel text="Complete the pool stage to create the knockout draw." />
              ) : (
                tournament.knockout.map(match => (
                  <div
                    key={match.id}
                    className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition ${
                      selectedKnockoutMatch?.id === match.id
                        ? "border-blue-500 bg-blue-50"
                        : "hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-500">
                        {match.bracket === "winners"
                          ? "Winners Bracket"
                          : match.bracket === "losers"
                            ? "Elimination Bracket"
                            : match.bracket === "grand-final"
                              ? "Grand Final"
                              : `Round ${match.round}`} - Match {match.position}
                      </div>
                      <div className="flex items-center gap-2">
                      <TableAssignment
                        value={match.table}
                        disabled={!canInputMatches || match.completed}
                        onSave={(table) => saveKnockoutTable(match.id, table)}
                      />
                      {match.completed && (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          Complete
                        </span>
                      )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!canInputMatches) return;
                        if (match.playerOne && match.playerTwo && !match.completed) {
                          setSelectedKnockoutMatchId(match.id);
                          restoreEntry(match);
                        }
                      }}
                      className="mt-3 w-full text-left"
                    >
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
                  </div>
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
          {canInputMatches && activeTab === "pools" && selectedPoolMatch && (
            <ResultEntry
              title="Enter Pool Result"
              playerOne={selectedPoolMatch.playerOne}
              playerTwo={selectedPoolMatch.playerTwo}
              winnerId={winnerId}
              games={games}
              confirmedGames={confirmedGames}
              onWinnerChange={setWinnerId}
              onGamesChange={setGames}
              onConfirmedGamesChange={setConfirmedGames}
              onSetsChange={savePoolSets}
              onSave={savePoolResult}
            />
          )}

          {canInputMatches && activeTab === "knockout" && selectedKnockoutMatch && (
            <ResultEntry
              title="Enter Knockout Result"
              playerOne={selectedKnockoutMatch.playerOne}
              playerTwo={selectedKnockoutMatch.playerTwo}
              winnerId={winnerId}
              games={games}
              confirmedGames={confirmedGames}
              onWinnerChange={setWinnerId}
              onGamesChange={setGames}
              onConfirmedGamesChange={setConfirmedGames}
              onSetsChange={saveKnockoutSets}
              onSave={saveKnockoutResult}
            />
          )}
        </div>
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

function TableAssignment({
  value,
  disabled,
  onSave,
}: {
  value?: number;
  disabled: boolean;
  onSave: (table?: number) => void;
}) {
  const [draft, setDraft] = useState(value ? String(value) : "");

  useEffect(() => {
    setDraft(value ? String(value) : "");
  }, [value]);

  function save() {
    const table = Number(draft);
    if (!Number.isInteger(table) || table < 1) {
      notify.timeout("Enter a valid table number.");
      return;
    }
    onSave(table);
  }

  return (
    <div className="inline-flex items-center overflow-hidden rounded-lg border bg-white">
      <input
        type="number"
        min={1}
        inputMode="numeric"
        aria-label="Table number"
        placeholder="Table"
        value={draft}
        disabled={disabled}
        onChange={(event) => setDraft(event.target.value)}
        className="w-16 border-0 px-2 py-1.5 text-xs font-semibold outline-none disabled:bg-slate-50"
      />
      {value ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setDraft("");
            onSave(undefined);
          }}
          aria-label="Remove table number"
          className="flex h-7 w-8 items-center justify-center border-l text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : (
        <button
          type="button"
          disabled={disabled || !draft}
          onClick={save}
          aria-label="Save table number"
          className="flex h-7 w-8 items-center justify-center border-l text-blue-800 hover:bg-blue-50 disabled:opacity-40"
        >
          <Save className="h-3.5 w-3.5" />
        </button>
      )}
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

function ResultEntry({
  title,
  playerOne,
  playerTwo,
  winnerId,
  games,
  confirmedGames,
  onWinnerChange,
  onGamesChange,
  onConfirmedGamesChange,
  onSetsChange,
  onSave,
}: {
  title: string;
  playerOne: { id: string; firstName: string; lastName: string } | null;
  playerTwo: { id: string; firstName: string; lastName: string } | null;
  winnerId: string;
  games: string[];
  confirmedGames: boolean[];
  onWinnerChange: (winnerId: string) => void;
  onGamesChange: (games: string[]) => void;
  onConfirmedGamesChange: (confirmed: boolean[]) => void;
  onSetsChange: (games: string[]) => void;
  onSave: () => void;
}) {
  if (!playerOne || !playerTwo) {
    return null;
  }

  const playerOneId = playerOne.id;
  const playerTwoId = playerTwo.id;

  function scoresAt(index: number) {
    const [one = "", two = ""] = games[index]?.split("-") ?? [];
    return {
      one: one === "0" ? "" : one,
      two: two === "0" ? "" : two,
    };
  }

  function updateScore(index: number, side: "one" | "two", value: string) {
    const scores = scoresAt(index);
    const next = [...games];
    next[index] = side === "one"
      ? `${value || 0}-${scores.two || 0}`
      : `${scores.one || 0}-${value || 0}`;
    onGamesChange(next);
  }

  function updateWinner(nextGames: string[], nextConfirmed: boolean[]) {
    let oneSets = 0;
    let twoSets = 0;
    nextGames.forEach((game, index) => {
      if (!nextConfirmed[index]) return;
      const [one, two] = game.split("-").map(Number);
      if (one > two) oneSets += 1;
      if (two > one) twoSets += 1;
    });
    onWinnerChange(
      oneSets >= 3 ? playerOneId : twoSets >= 3 ? playerTwoId : ""
    );
  }

  function confirmSet(index: number) {
    const { one, two } = scoresAt(index);
    const oneScore = Number(one || 0);
    const twoScore = Number(two || 0);
    const high = Math.max(oneScore, twoScore);
    const gap = Math.abs(oneScore - twoScore);
    if (!((high === 11 && gap >= 2) || (high > 11 && gap === 2))) {
      notify.timeout("A set is first to 11 and must be won by 2 points.");
      return;
    }
    const nextConfirmed = confirmedGames.map((saved, savedIndex) =>
      savedIndex === index ? true : saved
    );
    onConfirmedGamesChange(nextConfirmed);
    updateWinner(games, nextConfirmed);
    onSetsChange(
      games.filter((game, gameIndex) =>
        nextConfirmed[gameIndex] && game.trim() !== ""
      )
    );
  }

  function editSet(index: number) {
    const nextConfirmed = confirmedGames.map((saved, savedIndex) =>
      savedIndex === index ? false : saved
    );
    onConfirmedGamesChange(nextConfirmed);
    updateWinner(games, nextConfirmed);
    onSetsChange(
      games.filter((game, gameIndex) =>
        nextConfirmed[gameIndex] && game.trim() !== ""
      )
    );
  }

  function deleteSet(index: number) {
    const nextGames = games.map((game, gameIndex) =>
      gameIndex === index ? "" : game
    );
    const nextConfirmed = confirmedGames.map((saved, savedIndex) =>
      savedIndex === index ? false : saved
    );
    onGamesChange(nextGames);
    onConfirmedGamesChange(nextConfirmed);
    updateWinner(nextGames, nextConfirmed);
    onSetsChange(
      nextGames.filter((game, gameIndex) =>
        nextConfirmed[gameIndex] && game.trim() !== ""
      )
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="text-xl font-bold">
        {title}
      </h2>
      <p className="mt-2 text-slate-500">
        {playerName(playerOne)} vs {playerName(playerTwo)}
      </p>
      <div className="mt-4 space-y-1.5">
        {games.map((_game, index) => {
          const scores = scoresAt(index);
          const saved = Boolean(confirmedGames[index]);
          return (
            <div key={index} className={`grid grid-cols-[minmax(36px,1fr)_52px_52px_34px_34px] items-center gap-1.5 rounded-lg px-2 py-1.5 ${saved ? "bg-slate-50" : "bg-blue-50"}`}>
              <span className="text-sm font-semibold text-slate-600">S{index + 1}</span>
              {saved ? (
                <>
                  <span className="rounded-md border bg-white py-1.5 text-center text-sm font-semibold">{scores.one}</span>
                  <span className="rounded-md border bg-white py-1.5 text-center text-sm font-semibold">{scores.two}</span>
                  <button type="button" onClick={() => editSet(index)} aria-label={`Edit set ${index + 1}`} className="flex h-8 w-8 items-center justify-center rounded-md border border-green-200 bg-white text-green-700"><Pencil className="h-4 w-4" /></button>
                </>
              ) : (
                <>
                  <input type="number" min={0} inputMode="numeric" value={scores.one} onChange={(event) => updateScore(index, "one", event.target.value)} className="min-w-0 rounded-md border bg-white py-1.5 text-center text-sm" />
                  <input type="number" min={0} inputMode="numeric" value={scores.two} onChange={(event) => updateScore(index, "two", event.target.value)} className="min-w-0 rounded-md border bg-white py-1.5 text-center text-sm" />
                  <button type="button" onClick={() => confirmSet(index)} aria-label={`Save set ${index + 1}`} className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-900 text-white"><Save className="h-4 w-4" /></button>
                </>
              )}
              <button type="button" onClick={() => deleteSet(index)} aria-label={`Delete set ${index + 1}`} className="flex h-8 w-8 items-center justify-center rounded-md border text-slate-500 hover:border-red-300 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
            </div>
          );
        })}
      </div>
      <div className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">
        Winner: {winnerId ? playerName(winnerId === playerOne.id ? playerOne : playerTwo) : "Confirm sets to determine the winner"}
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
