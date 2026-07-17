import {
  useEffect,
  useMemo,
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
  Download,
  GripVertical,
  Pencil,
  Trash2,
  Trophy,
} from "lucide-react";

import useRole from "../hooks/useRole";
import { notify } from "../services/notificationService";
import {
  calculateClassic6Score,
  classic6NextMatchId,
  classicTeamFormatLabel,
  type Classic6Game,
  type Classic6Match,
} from "../services/teams/teamEngine";
import {
  deleteTeamGame,
  getTeamGame,
  saveTeamGame,
} from "../services/teams/teamGameService";
import {
  removeTeamGameTtrMatches,
  recordTeamGameTtrMatches,
} from "../services/teams/teamSubmission";
import LoadingScreen from "../components/shared/LoadingScreen";
import {
  downloadPlayCard,
  downloadTeamGameSheet,
} from "../utils/playCard";

export default function TeamGameManage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useRole();
  const [game, setGame] =
    useState<Classic6Game | null>(null);
  const [
    selectedMatchId,
    setSelectedMatchId,
  ] = useState<string | null>(null);
  const [
    draftSets,
    setDraftSets,
  ] = useState<
    Record<
      string,
      Record<number, { home: string; away: string }>
    >
  >({});
  const [
    submittingResult,
    setSubmittingResult,
  ] = useState(false);
  const [
    savingChange,
    setSavingChange,
  ] = useState(false);
  const [
    draggedMatchId,
    setDraggedMatchId,
  ] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    const gameId = id;
    let cancelled = false;

    async function loadGame() {
      try {
        const saved = await getTeamGame(gameId);

        if (cancelled) {
          return;
        }

        if (!saved) {
          notify.timeout(
            "Team game draft not found."
          );
          navigate("/team-games");
          return;
        }

        setGame(saved);
      } catch (error) {
        console.error(error);
        notify.fault(
          "Unable to load team game."
        );
        navigate("/team-games");
      }
    }

    void loadGame();

    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  const score = useMemo(
    () =>
      game
        ? calculateClassic6Score(
            game.matches,
            game.format ?? "classic-6",
            game.customSettings
          )
        : { home: 0, away: 0 },
    [game]
  );

  const nextMatchId = useMemo(
    () =>
      game
        ? classic6NextMatchId(
            game.matches,
            game.format ?? "classic-6",
            game.customSettings
          )
        : null,
    [game]
  );
  const formatLabel =
    classicTeamFormatLabel(
      game?.format ?? "classic-6"
    );
  const orderedMatches = useMemo(
    () =>
      game
        ? [...game.matches].sort(
            (a, b) => a.order - b.order
          )
        : [],
    [game]
  );
  const canReorderPlayOrder =
    game?.status === "draft" &&
    game.format === "custom";
  const canInputMatches =
    game?.status === "live";

  const selectedMatch =
    game?.matches.find(
      (match) => match.id === selectedMatchId
    ) ?? orderedMatches[0];
  const eventDetailParts = game
    ? [
        game.home.clubName,
        "v",
        game.away.clubName,
        "·",
        new Date(game.date).toLocaleDateString(),
        game.startTime ? `· ${game.startTime}` : "",
        game.locationClubName
          ? `· ${game.locationClubName}`
          : "",
      ].filter(Boolean)
    : [];

  function persist(next: Classic6Game) {
    void saveTeamGame(next).catch((error) => {
      console.error(error);
      notify.fault(
        "Unable to save team game changes."
      );
    });
    setGame(next);
  }

  async function prepareGameForEdit(
    currentGame: Classic6Game
  ) {
    if (!currentGame.submitted) {
      return currentGame;
    }

    return {
      ...(await removeTeamGameTtrMatches(
        currentGame
      )),
      status: "live" as const,
      submitted: false,
      homeConfirmed: false,
      awayConfirmed: false,
    };
  }

  async function updateMatch(
    matchId: string,
    update: Partial<Classic6Match>
  ) {
    if (!game || savingChange) {
      return;
    }

    setSavingChange(true);

    try {
      const editableGame =
        await prepareGameForEdit(game);

      persist({
        ...editableGame,
        homeConfirmed: false,
        awayConfirmed: false,
        submitted: false,
        matches: editableGame.matches.map((match) =>
          match.id === matchId
            ? { ...match, ...update }
            : match
        ),
      });

      if (game.submitted) {
        notify.timeout(
          "Submitted TTR has been removed. Confirm and submit again after editing."
        );
      }
    } catch (error) {
      console.error(error);
      notify.fault(
        "Unable to reopen submitted TTR."
      );
    } finally {
      setSavingChange(false);
    }
  }

  function updateDraftSet(
    match: Classic6Match,
    index: number,
    side: "home" | "away",
    value: string
  ) {
    setDraftSets((current) => ({
      ...current,
      [match.id]: {
        ...(current[match.id] ?? {}),
        [index]: {
          home:
            current[match.id]?.[index]?.home ??
            "",
          away:
            current[match.id]?.[index]?.away ??
            "",
          [side]: value,
        },
      },
    }));
  }

  async function submitSet(
    match: Classic6Match,
    index: number
  ) {
    if (!canInputMatches) {
      notify.timeout(
        "Go live before entering match sets."
      );
      return;
    }

    const draft =
      draftSets[match.id]?.[index];
    const homeScore = Number(draft?.home);
    const awayScore = Number(draft?.away);
    const setWins = match.sets.reduce(
      (wins, set) => {
        if (set.home > set.away) {
          return {
            ...wins,
            home: wins.home + 1,
          };
        }

        return {
          ...wins,
          away: wins.away + 1,
        };
      },
      {
        home: 0,
        away: 0,
      }
    );
    const matchAlreadyDecided =
      index >= match.sets.length &&
      (setWins.home >= 3 || setWins.away >= 3);

    if (matchAlreadyDecided) {
      notify.timeout(
        "A match is complete once a side has won 3 sets."
      );
      return;
    }

    if (
      index >= 5 ||
      (index >= match.sets.length &&
        match.sets.length >= 5)
    ) {
      notify.timeout(
        "A match can have a maximum of 5 sets."
      );
      return;
    }

    if (
      !draft ||
      draft.home === "" ||
      draft.away === "" ||
      Number.isNaN(homeScore) ||
      Number.isNaN(awayScore)
    ) {
      notify.timeout(
        "Enter both scores before submitting the set."
      );
      return;
    }

    const highScore =
      Math.max(homeScore, awayScore);
    const scoreGap =
      Math.abs(homeScore - awayScore);
    const validElevenPointSet =
      highScore === 11 && scoreGap >= 2;
    const validDeuceSet =
      highScore > 11 && scoreGap === 2;

    if (scoreGap === 0) {
      notify.timeout(
        "Invalid set score. Set scores cannot be even."
      );
      return;
    }

    if (!validElevenPointSet && !validDeuceSet) {
      notify.timeout(
        "Invalid set score. A set is first to 11 and must be won by 2 points."
      );
      return;
    }

    const nextSet = {
      home: homeScore,
      away: awayScore,
    };
    const nextSets =
      index < match.sets.length
        ? match.sets.map((set, i) =>
            i === index ? nextSet : set
          )
        : [
            ...match.sets,
            nextSet,
          ];

    await updateMatch(match.id, {
      status:
        match.status === "completed"
          ? "completed"
          : "live",
      sets: nextSets,
    });

    setDraftSets((current) => {
      const matchDrafts = {
        ...(current[match.id] ?? {}),
      };
      delete matchDrafts[index];

      return {
        ...current,
        [match.id]: matchDrafts,
      };
    });
  }

  function editSet(
    match: Classic6Match,
    index: number
  ) {
    if (!canInputMatches) {
      notify.timeout(
        "Go live before editing match sets."
      );
      return;
    }

    const set = match.sets[index];

    if (!set) {
      return;
    }

    setDraftSets((current) => ({
      ...current,
      [match.id]: {
        ...(current[match.id] ?? {}),
        [index]: {
          home: String(set.home),
          away: String(set.away),
        },
      },
    }));
  }

  async function completeMatch(
    match: Classic6Match,
    winner: "home" | "away"
  ) {
    if (!canInputMatches) {
      notify.timeout(
        "Go live before confirming match winners."
      );
      return;
    }

    if (match.sets.length < 3) {
      notify.timeout(
        "Submit at least 3 sets before completing the match."
      );
      return;
    }

    const setWins = match.sets.reduce(
      (wins, set) => {
        if (set.home > set.away) {
          return {
            ...wins,
            home: wins.home + 1,
          };
        }

        if (set.away > set.home) {
          return {
            ...wins,
            away: wins.away + 1,
          };
        }

        return wins;
      },
      {
        home: 0,
        away: 0,
      }
    );

    if (setWins.home === setWins.away) {
      notify.timeout(
        "Invalid match result. A match cannot be submitted as a draw."
      );
      return;
    }

    if (setWins[winner] < setWins[
      winner === "home" ? "away" : "home"
    ]) {
      notify.timeout(
        "Invalid match result. The selected winner has not won more sets."
      );
      return;
    }

    await updateMatch(match.id, {
      status: "completed",
      winner,
    });
  }

  async function editMatchWinner(
    match: Classic6Match
  ) {
    if (!canInputMatches) {
      notify.timeout(
        "Go live before editing match winners."
      );
      return;
    }

    await updateMatch(match.id, {
      status: match.sets.length > 0
        ? "live"
        : "pending",
      winner: null,
    });
  }

  function markLive() {
    if (!game) {
      return;
    }

    persist({
      ...game,
      status: "live",
    });
    notify.edgeBall(
      `${formatLabel} is now live. Setup editing is locked.`
    );
  }

  function reorderMatch(
    draggedId: string,
    targetId: string
  ) {
    if (
      !game ||
      !canReorderPlayOrder ||
      draggedId === targetId
    ) {
      return;
    }

    const currentMatches = [...game.matches].sort(
      (a, b) => a.order - b.order
    );
    const draggedIndex =
      currentMatches.findIndex(
        (match) => match.id === draggedId
      );
    const targetIndex =
      currentMatches.findIndex(
        (match) => match.id === targetId
      );

    if (draggedIndex < 0 || targetIndex < 0) {
      return;
    }

    const [draggedMatch] =
      currentMatches.splice(draggedIndex, 1);
    currentMatches.splice(
      targetIndex,
      0,
      draggedMatch
    );

    persist({
      ...game,
      homeConfirmed: false,
      awayConfirmed: false,
      submitted: false,
      matches: currentMatches.map(
        (match, index) => ({
          ...match,
          order: index + 1,
        })
      ),
    });
  }

  function confirmHome() {
    if (!game) {
      return;
    }

    persist({
      ...game,
      homeConfirmed: true,
    });
  }

  function confirmAway() {
    if (!game?.homeConfirmed) {
      notify.timeout(
        "The home team must confirm first."
      );
      return;
    }

    persist({
      ...game,
      awayConfirmed: true,
    });
  }

  async function submitResult() {
    if (!game?.homeConfirmed || !game.awayConfirmed) {
      notify.timeout(
        "Both teams must confirm before submitting."
      );
      return;
    }

    if (game.submitted || submittingResult) {
      return;
    }

    setSubmittingResult(true);

    try {
      const recordedGame =
        await recordTeamGameTtrMatches(game);

      persist({
        ...recordedGame,
        status: "submitted",
        submitted: true,
      });
      notify.edgeBall(
        `${formatLabel} submitted. TTR singles have been recorded.`
      );
    } catch (error) {
      console.error(error);
      notify.fault(
        error instanceof Error
          ? error.message
          : "Unable to submit team game."
      );
    } finally {
      setSubmittingResult(false);
    }
  }

  async function deleteCurrentGame() {
    if (!game || !isAdmin) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${game.name}? This will also remove team-game TTR records created from this fixture.`
    );

    if (!confirmed) {
      return;
    }

    setSavingChange(true);

    try {
      await removeTeamGameTtrMatches(game);
      await deleteTeamGame(game.id);
      notify.edgeBall("Team game deleted.");
      navigate("/team-games");
    } catch (error) {
      console.error(error);
      notify.fault(
        "Unable to delete team game."
      );
    } finally {
      setSavingChange(false);
    }
  }

  function playerNames(
    side: "home" | "away",
    ids: string[]
  ) {
    const team =
      side === "home"
        ? game?.home
        : game?.away;

    return ids
      .map(
        (playerId) =>
          team?.players.find(
            (player) => player.id === playerId
          )?.name ?? "TBC"
      )
      .join(" / ");
  }

  function downloadTeamMatchCard(match: Classic6Match) {
    if (!game) return;

    const playersFor = (side: "home" | "away", ids: string[]) => {
      const team = side === "home" ? game.home : game.away;
      return ids.map((id) => {
        const player = team.players.find((candidate) => candidate.id === id);
        return {
          name: player?.name ?? "TBC",
          club: player?.clubName ?? team.clubName,
          ttr: player?.rating ?? "-",
        };
      });
    };

    downloadPlayCard({
      eventName: game.name,
      matchName: match.label,
      sideOne: playersFor("home", match.homePlayerIds),
      sideTwo: playersFor("away", match.awayPlayerIds),
    });
  }

  function downloadFullTeamGameSheet() {
    if (!game) return;

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
        sideOne: playerNames("home", match.homePlayerIds),
        sideTwo: playerNames("away", match.awayPlayerIds),
        sets: match.sets.map((set) => ({
          sideOne: set.home,
          sideTwo: set.away,
        })),
        winner: match.winner,
        countsForTeamScore: match.countsForTeamScore,
      })),
    });
  }

  if (!game) {
    return <LoadingScreen label="Loading team game..." />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <Link
          to="/team-games"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Team Games
        </Link>
        <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-emerald-700">
          {formatLabel} Match Builder
        </p>
        <h1 className="mt-2 text-5xl font-normal tracking-tight">
          {game.name}
        </h1>
        <p className="mt-3 text-lg text-slate-500">
          {eventDetailParts.join(" ")}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Stat label="Score" value={`${score.home} - ${score.away}`} />
        <Stat label="Status" value={game.status} />
        <Stat
          label="Next"
          value={
            nextMatchId
              ? game.matches.find(
                  (match) => match.id === nextMatchId
                )?.label ?? "-"
              : "Complete"
          }
        />
      </div>

      <div className="flex flex-wrap gap-3">
        {(game.status === "draft" || isAdmin) && (
          <Link
            to={`/team-games/new/${game.format ?? "classic-6"}?edit=${game.id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Edit Setup
          </Link>
        )}
        {game.status === "draft" && (
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
          to={`/team-games/${game.id}/live`}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Open Live Viewer
        </Link>
        <button
          type="button"
          onClick={downloadFullTeamGameSheet}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <Download className="h-4 w-4" />
          Download Full Scoresheet
        </button>
        {isAdmin && (
          <button
            type="button"
            onClick={deleteCurrentGame}
            disabled={savingChange}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-70"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">

      <section className="rounded-3xl border bg-white p-8 shadow-sm">
        <h2 className="mb-6 text-xl font-bold">
          Play Order
        </h2>
        <div className="grid gap-3">
          {orderedMatches.map((match) => {
            const isNext =
              match.id === nextMatchId;
            const isSelected =
              match.id === selectedMatch?.id;
            const isComplete =
              match.status === "completed";
            const isLive =
              match.status === "live";
            const isDoubles =
              match.phase === "doubles";
            const canDrag =
              canReorderPlayOrder;
            const isDragging =
              draggedMatchId === match.id;

            return (
              <button
                key={match.id}
                type="button"
                draggable={canDrag}
                onDragStart={(event) => {
                  if (!canDrag) {
                    return;
                  }

                  setDraggedMatchId(match.id);
                  event.dataTransfer.effectAllowed =
                    "move";
                  event.dataTransfer.setData(
                    "text/plain",
                    match.id
                  );
                }}
                onDragOver={(event) => {
                  if (canDrag && draggedMatchId) {
                    event.preventDefault();
                    event.dataTransfer.dropEffect =
                      "move";
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();

                  const draggedId =
                    draggedMatchId ||
                    event.dataTransfer.getData(
                      "text/plain"
                    );

                  reorderMatch(
                    draggedId,
                    match.id
                  );
                  setDraggedMatchId(null);
                }}
                onDragEnd={() =>
                  setDraggedMatchId(null)
                }
                onClick={() =>
                  setSelectedMatchId(match.id)
                }
                className={`grid gap-3 rounded-xl border p-4 text-left transition md:grid-cols-[104px_1fr_120px] md:items-center ${
                  isDragging
                    ? "opacity-50 ring-4 ring-emerald-100"
                    : isSelected
                    ? "border-blue-400 ring-4 ring-blue-100"
                    : isComplete
                      ? "border-slate-200 bg-slate-100 text-slate-500"
                      : isLive
                      ? "border-green-300 bg-green-50"
                        : isNext
                          ? "border-yellow-300 bg-yellow-50"
                          : isDoubles
                            ? "border-purple-200 bg-purple-50 text-purple-950 hover:bg-purple-100"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2 font-black">
                  {canDrag && (
                    <GripVertical className="h-5 w-5 text-slate-400" />
                  )}
                  <span>#{match.order}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase text-slate-500">
                    {match.label}
                  </p>
                  <p className="font-semibold">
                    {playerNames("home", match.homePlayerIds)} v{" "}
                    {playerNames("away", match.awayPlayerIds)}
                  </p>
                </div>
                <div className="text-sm font-semibold">
                  {isComplete
                    ? "Completed"
                    : isLive
                      ? "Live"
                      : isNext
                        ? "Next"
                        : "Pending"}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border bg-white p-8 shadow-sm">
        <h2 className="mb-6 text-xl font-bold">
          Confirmation
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          <ConfirmButton
            confirmed={game.homeConfirmed}
            onClick={confirmHome}
            label="Home Confirm"
            confirmedLabel="Home Confirmed"
          />
          <ConfirmButton
            confirmed={game.awayConfirmed}
            onClick={confirmAway}
            label="Away Confirm"
            confirmedLabel="Away Confirmed"
          />
          <button
            type="button"
            onClick={submitResult}
            disabled={
              game.submitted || submittingResult
            }
            className={`rounded-xl px-4 py-3 font-semibold transition ${
              game.submitted
                ? "bg-green-600 text-white"
                : submittingResult
                  ? "cursor-wait bg-emerald-500 text-white"
                : "bg-emerald-700 text-white hover:bg-emerald-600"
            }`}
          >
            {submittingResult
              ? "Submitting..."
              : game.submitted
              ? "Submitted"
              : "Submit Result"}
          </button>
        </div>
      </section>

        </div>

        <div>
      {selectedMatch && (
        <section className="sticky top-24 rounded-3xl border bg-white p-5 shadow-sm">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">
              {selectedMatch.label}
            </h2>
            <button
              type="button"
              onClick={() => downloadTeamMatchCard(selectedMatch)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Download Play Card
            </button>
          </div>
          <p className="mb-6 text-sm text-slate-500">
            {!canInputMatches
              ? "Go live before entering sets or confirming match winners."
              : selectedMatch.countsForTTR
              ? game.submitted
                ? "This singles result counts toward TTR."
                : "This singles result will count toward TTR after submission."
              : "Doubles do not count toward TTR."}
          </p>

          <div className="space-y-2">
            {selectedMatch.sets.map((set, index) => {
              const draft =
                draftSets[selectedMatch.id]?.[index];

              return (
                <div
                  key={index}
                className={`grid grid-cols-[minmax(54px,1fr)_48px_48px_40px] items-center gap-1.5 rounded-xl p-2 ${
                    draft ? "bg-blue-50" : "bg-slate-50"
                  }`}
                >
                  <div className="text-sm font-semibold text-slate-700">
                    S{index + 1}
                  </div>

                  {draft ? (
                    <>
                      <input
                        type="number"
                        min={0}
                        disabled={!canInputMatches}
                        value={draft.home}
                        onChange={(event) =>
                          updateDraftSet(
                            selectedMatch,
                            index,
                            "home",
                            event.target.value
                          )
                        }
                        className="min-w-0 rounded-lg border bg-white px-1 py-2 text-center text-sm disabled:bg-slate-100"
                      />
                      <input
                        type="number"
                        min={0}
                        disabled={!canInputMatches}
                        value={draft.away}
                        onChange={(event) =>
                          updateDraftSet(
                            selectedMatch,
                            index,
                            "away",
                            event.target.value
                          )
                        }
                        className="min-w-0 rounded-lg border bg-white px-1 py-2 text-center text-sm disabled:bg-slate-100"
                      />
                      <button
                        type="button"
                        disabled={!canInputMatches}
                        onClick={() =>
                          submitSet(
                            selectedMatch,
                            index
                          )
                        }
                        className="h-9 rounded-lg bg-blue-900 px-1 text-xs font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        Save
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="rounded-lg border bg-white px-1 py-2 text-center text-sm font-semibold">
                        {set.home}
                      </div>
                      <div className="rounded-lg border bg-white px-1 py-2 text-center text-sm font-semibold">
                        {set.away}
                      </div>
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          disabled={!canInputMatches}
                          onClick={() =>
                            editSet(
                              selectedMatch,
                              index
                            )
                          }
                          aria-label={`Edit set ${index + 1}`}
                          title="Submitted. Edit set"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-green-200 bg-white text-green-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            {selectedMatch.sets.filter(
              (set) => set.home > set.away
            ).length >= 3 ||
            selectedMatch.sets.filter(
              (set) => set.away > set.home
            ).length >= 3 ? (
              <div className="rounded-xl bg-slate-100 p-3 text-sm font-semibold text-slate-600">
                A side has won 3 sets.
              </div>
            ) : selectedMatch.sets.length >= 5 ? (
              <div className="rounded-xl bg-slate-100 p-3 text-sm font-semibold text-slate-600">
                Maximum of 5 sets reached.
              </div>
            ) : (
              <div className="grid grid-cols-[minmax(54px,1fr)_48px_48px_40px] items-center gap-1.5 rounded-xl bg-blue-50 p-2">
                <div className="text-sm font-semibold text-slate-700">
                  S{selectedMatch.sets.length + 1}
                </div>
                <input
                  type="number"
                  min={0}
                  disabled={!canInputMatches}
                  value={
                    draftSets[selectedMatch.id]?.[
                      selectedMatch.sets.length
                    ]?.home ?? ""
                  }
                  onChange={(event) =>
                    updateDraftSet(
                      selectedMatch,
                      selectedMatch.sets.length,
                      "home",
                      event.target.value
                    )
                  }
                  className="min-w-0 rounded-lg border bg-white px-1 py-2 text-center text-sm disabled:bg-slate-100"
                />
                <input
                  type="number"
                  min={0}
                  disabled={!canInputMatches}
                  value={
                    draftSets[selectedMatch.id]?.[
                      selectedMatch.sets.length
                    ]?.away ?? ""
                  }
                  onChange={(event) =>
                    updateDraftSet(
                      selectedMatch,
                      selectedMatch.sets.length,
                      "away",
                      event.target.value
                    )
                  }
                  className="min-w-0 rounded-lg border bg-white px-1 py-2 text-center text-sm disabled:bg-slate-100"
                />
                <button
                  type="button"
                  disabled={!canInputMatches}
                  onClick={() =>
                    submitSet(
                      selectedMatch,
                      selectedMatch.sets.length
                    )
                  }
                  className="h-9 rounded-lg bg-blue-900 px-1 text-xs font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Save
                </button>
              </div>
            )}
          </div>

          {selectedMatch.winner ? (
            <div className="mt-4 grid grid-cols-[1fr_44px] items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-2">
              <div className="px-2 text-sm font-semibold text-green-800">
                {selectedMatch.winner === "home"
                  ? "Home"
                  : "Away"}{" "}
                win confirmed
              </div>
              <button
                type="button"
                disabled={!canInputMatches}
                onClick={() =>
                  editMatchWinner(selectedMatch)
                }
                aria-label="Edit match winner"
                title="Edit match winner"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-green-200 bg-white text-green-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              <button
                type="button"
                disabled={!canInputMatches}
                onClick={() =>
                  completeMatch(selectedMatch, "home")
                }
                className="rounded-xl bg-blue-900 px-4 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Home Won
              </button>
              <button
                type="button"
                disabled={!canInputMatches}
                onClick={() =>
                  completeMatch(selectedMatch, "away")
                }
                className="rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Away Won
              </button>
            </div>
          )}
        </section>
      )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <Trophy className="h-5 w-5 text-amber-500" />
      <div>
        <p className="text-xs font-semibold uppercase text-slate-500">
          {label}
        </p>
        <p className="text-xl font-black capitalize">
          {value}
        </p>
      </div>
    </div>
  );
}

function ConfirmButton({
  confirmed,
  onClick,
  label,
  confirmedLabel,
}: {
  confirmed: boolean;
  onClick: () => void;
  label: string;
  confirmedLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-3 font-semibold transition ${
        confirmed
          ? "bg-green-100 text-green-700"
          : "bg-blue-900 text-white hover:bg-blue-800"
      }`}
    >
      {confirmed ? confirmedLabel : label}
    </button>
  );
}
