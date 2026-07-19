import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  GripVertical,
  Trophy,
} from "lucide-react";
import {
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";
import type { Club } from "../types/club";

import { getClubs } from "../services/supabase/clubService";

import { useTournament } from "../context/TournamentContext";

import type { Player } from "../types/player";

import { getPlayers } from "../services/supabase/playerService";

import { generateTournamentDraw } from "../services/tournament/drawGenerator";
import { generateKnockout } from "../services/tournament/knockoutGenerator";
import { generateDoubleKnockout } from "../services/tournament/doubleKnockout";
import PlayerSelector from "../components/shared/PlayerSelector";
import { notify } from "../services/notificationService";

function shufflePlayers(
  players: Player[]
) {

  return [...players].sort(
    () => Math.random() - 0.5
  );

}

function orderPlayersForKnockout(
  players: Player[],
  seedByTTR: boolean
) {

  if (!seedByTTR) {
    return shufflePlayers(players);
  }

  return [...players].sort(
    (a, b) => b.rating - a.rating
  );

}

function createDoublesPair(
  playerOne: Player,
  playerTwo: Player
): Player {

  return {
    id: `pair-${playerOne.id}-${playerTwo.id}`,
    profileId: null,
    firstName: `${playerOne.firstName} ${playerOne.lastName}`,
    lastName: `/ ${playerTwo.firstName} ${playerTwo.lastName}`,
    mobile: "",
    email: "",
    mobilePublicToClub: false,
    emailPublicToClub: false,
    avatarUrl: "",
    clubId: playerOne.clubId,
    rating: 0,
    highestRating: 0,
    wins: 0,
    losses: 0,
    matchesPlayed: 0,
    provisionalMatchesRemaining: 0,
    ratingReliability: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

}

function parseDoublesPairId(value: string) {
  const match = value.match(
    /^pair-([0-9a-f-]{36})-([0-9a-f-]{36})$/i
  );

  return match
    ? [match[1], match[2]] as const
    : null;
}

function restorePairMember(
  savedPair: Player,
  id: string,
  fullName: string
): Player {
  const nameParts = fullName.trim().split(/\s+/);
  const firstName = nameParts.shift() ?? "Player";

  return {
    ...savedPair,
    id,
    profileId: null,
    firstName,
    lastName: nameParts.join(" "),
  };
}

function restoreDoublesPairs(
  savedPlayers: Player[],
  availablePlayers: Player[]
) {
  const availableById = new Map(
    availablePlayers.map((player) => [player.id, player])
  );

  return savedPlayers.flatMap((savedPlayer) => {
    const pairIds = parseDoublesPairId(savedPlayer.id);

    if (!pairIds) {
      return [];
    }

    const playerOneName = savedPlayer.firstName.trim();
    const playerTwoName = savedPlayer.lastName
      .replace(/^\s*\/\s*/, "")
      .trim();

    return [[
      availableById.get(pairIds[0]) ??
        restorePairMember(savedPlayer, pairIds[0], playerOneName),
      availableById.get(pairIds[1]) ??
        restorePairMember(savedPlayer, pairIds[1], playerTwoName),
    ]];
  });
}

export default function TournamentPlayerSelection() {

  const navigate =
  useNavigate();

const {
  saveTournament,
  tournament,
} = useTournament();

const creationIdRef = useRef(
  tournament.id || crypto.randomUUID()
);
const submissionInProgressRef =
  useRef(false);
const [isSubmitting, setIsSubmitting] =
  useState(false);

const [players, setPlayers] =
  useState<Player[]>([]);

const [clubs, setClubs] =
  useState<Club[]>([]);

const [selectedPlayers, setSelectedPlayers] =
  useState<Player[]>(
    tournament.settings.format === "doubles" &&
    tournament.players.some((player) =>
      Boolean(parseDoublesPairId(player.id))
    )
      ? []
      : tournament.players
  );

const [doublesPairs, setDoublesPairs] =
  useState<Player[][]>(() => {
    if (
      tournament.settings.format !== "doubles"
    ) {
      return [];
    }

    if (
      tournament.players.some((player) =>
        Boolean(parseDoublesPairId(player.id))
      )
    ) {
      return [];
    }

    const pairs: Player[][] = [];

    for (
      let index = 0;
      index < tournament.players.length;
      index += 2
    ) {
      pairs.push(
        tournament.players.slice(index, index + 2)
      );
    }

    return pairs;
  });

const [draggedDoublesSlot, setDraggedDoublesSlot] =
  useState<{
    pairIndex: number;
    playerIndex: number;
  } | null>(null);

const [doublesDropTarget, setDoublesDropTarget] =
  useState<string | null>(null);

const isDoubles =
  tournament.settings.format === "doubles";

const hasPlayerLimit =
  tournament.settings.playerLimitEnabled;

const playerLimitReached =
  hasPlayerLimit &&
  selectedPlayers.length >=
    tournament.settings.playerCount;

const hasValidPlayerTotal =
  selectedPlayers.length >= 2 &&
  (
    !hasPlayerLimit ||
    selectedPlayers.length <=
      tournament.settings.playerCount
  );

  const [clubFilter, setClubFilter] =
    useState("");

  const loadPlayers = useCallback(async () => {

  const [
    playerData,
    clubData,
  ] = await Promise.all([

    getPlayers(),

    getClubs(),

  ]);

  playerData.sort((a, b) => {

    if (
      tournament.settings.socialPlay ||
      tournament.settings.format === "doubles"
    ) {

      return `${a.firstName} ${a.lastName}`
        .localeCompare(
          `${b.firstName} ${b.lastName}`
        );

    }

    return b.rating - a.rating;

  });

  setPlayers(playerData);

  setClubs(clubData);

  if (
    tournament.settings.format === "doubles" &&
    tournament.players.some((player) =>
      Boolean(parseDoublesPairId(player.id))
    )
  ) {
    const restoredPairs = restoreDoublesPairs(
      tournament.players,
      playerData
    );

    setDoublesPairs(restoredPairs);
    setSelectedPlayers(restoredPairs.flat());
  }

}, [
  tournament.settings.format,
  tournament.settings.socialPlay,
  tournament.players,
]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPlayers();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadPlayers]);

  const filteredPlayers =
    useMemo(() => {

      return players.filter((player) => {
        if (
          clubFilter &&
          player.clubId !== clubFilter
        ) {
          return false;
        }

        if (
          tournament.settings.ttrLimitEnabled &&
          player.rating >
            tournament.settings.ttrLimit
        ) {
          return false;
        }

        return true;

      });

    }, [
      players,
      clubFilter,
      tournament.settings.ttrLimit,
      tournament.settings.ttrLimitEnabled,
    ]);

  function addPlayer(player: Player) {

    if (
      selectedPlayers.some(
        (p) => p.id === player.id
      )
    ) {
      return;
    }

    if (playerLimitReached) {
      return;
    }

    if (!isDoubles) {

      setSelectedPlayers([
        ...selectedPlayers,
        player,
      ]);

      return;

    }

    const activePair =
      doublesPairs[doublesPairs.length - 1];

    if (
      activePair &&
      activePair.length === 1
    ) {

      setDoublesPairs([
        ...doublesPairs.slice(0, -1),
        [
          activePair[0],
          player,
        ],
      ]);

      setSelectedPlayers([
        ...selectedPlayers,
        player,
      ]);

      return;

    }

    setDoublesPairs([
      ...doublesPairs,
      [player],
    ]);

    setSelectedPlayers([
      ...selectedPlayers,
      player,
    ]);

  }

  function removePlayer(id: string) {

    setSelectedPlayers(
      selectedPlayers.filter(
        (p) => p.id !== id
      )
    );

    if (isDoubles) {

      setDoublesPairs(
        doublesPairs
          .map(pair =>
            pair.filter(
              player => player.id !== id
            )
          )
          .filter(pair => pair.length > 0)
      );

    }

  }

  function beginDoublesDrag(
    event: DragEvent<HTMLDivElement>,
    pairIndex: number,
    playerIndex: number
  ) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(
      "text/plain",
      `${pairIndex}:${playerIndex}`
    );
    setDraggedDoublesSlot({ pairIndex, playerIndex });
  }

  function finishDoublesDrag() {
    setDraggedDoublesSlot(null);
    setDoublesDropTarget(null);
  }

  function swapDoublesPlayers(
    targetPairIndex: number,
    targetPlayerIndex: number
  ) {
    if (!draggedDoublesSlot) {
      return;
    }

    const source = draggedDoublesSlot;

    if (
      source.pairIndex === targetPairIndex &&
      source.playerIndex === targetPlayerIndex
    ) {
      finishDoublesDrag();
      return;
    }

    setDoublesPairs((currentPairs) => {
      const nextPairs = currentPairs.map((pair) => [...pair]);
      const sourcePlayer =
        nextPairs[source.pairIndex]?.[source.playerIndex];
      const targetPlayer =
        nextPairs[targetPairIndex]?.[targetPlayerIndex];

      if (!sourcePlayer || !targetPlayer) {
        return currentPairs;
      }

      nextPairs[source.pairIndex][source.playerIndex] = targetPlayer;
      nextPairs[targetPairIndex][targetPlayerIndex] = sourcePlayer;
      return nextPairs;
    });

    finishDoublesDrag();
  }

  function moveDoublesPlayerToOpenPair(
    targetPairIndex: number
  ) {
    if (!draggedDoublesSlot) {
      return;
    }

    const source = draggedDoublesSlot;

    setDoublesPairs((currentPairs) => {
      if (
        source.pairIndex === targetPairIndex ||
        currentPairs[targetPairIndex]?.length >= 2
      ) {
        return currentPairs;
      }

      const nextPairs = currentPairs.map((pair) => [...pair]);
      const [sourcePlayer] = nextPairs[source.pairIndex].splice(
        source.playerIndex,
        1
      );

      if (!sourcePlayer) {
        return currentPairs;
      }

      nextPairs[targetPairIndex].push(sourcePlayer);
      return nextPairs.filter((pair) => pair.length > 0);
    });

    finishDoublesDrag();
  }
function getClubName(
  clubId: string
) {

  return (
    clubs.find(
      club =>
        club.id === clubId
    )?.name ?? "-"
  );

}

  if (
    tournament.id &&
    (tournament.status === "active" ||
      tournament.status === "completed" ||
      tournament.status === "cancelled")
  ) {
    return (
      <Navigate
        to={`/tournaments/${tournament.id}/live`}
        replace
      />
    );
  }

  return (

    <div className="max-w-7xl mx-auto">

      <div className="mb-8">

        <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">

          <Trophy className="h-4 w-4" />

          Tournament Wizard

        </div>

        <h1 className="mt-4 text-5xl font-normal">

          Select Players

        </h1>

      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8">

        {/* Available */}

        <div>

          <div className="mb-6 space-y-3">

            <PlayerSelector
              players={filteredPlayers
                .filter(
                  (player) =>
                    !playerLimitReached &&
                    !selectedPlayers.some(
                      (selected) => selected.id === player.id
                    )
                )
                .map((player) => ({
                  ...player,
                  clubName: getClubName(player.clubId),
                }))}
              value={null}
              onChange={addPlayer}
              placeholder={
                playerLimitReached
                  ? "Player limit reached"
                  : "Search and add a player..."
              }
            />

            <div className="relative w-56 max-w-full">
              <select
                aria-label="Filter players by club"
                value={clubFilter}
                onChange={(event) => setClubFilter(event.target.value)}
                className="w-full appearance-none rounded-xl border bg-white py-2 pl-3 pr-10 text-sm text-slate-700"
              >
                <option value="">All clubs</option>
                {[...clubs]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name}
                    </option>
                  ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

          </div>

<div className="space-y-2">

  {filteredPlayers.map((player) => (

    <button
      key={player.id}
      onClick={() =>
        selectedPlayers.some((selected) => selected.id === player.id)
          ? removePlayer(player.id)
          : addPlayer(player)
      }
      disabled={
        playerLimitReached &&
        !selectedPlayers.some((selected) => selected.id === player.id)
      }
      className={`
        flex
        w-full
        items-center
        rounded-xl
        border
        px-5
        py-3
        text-left
        transition

        ${
          selectedPlayers.some(
            (p) => p.id === player.id
          )
            ? "border-green-300 bg-green-50 hover:border-red-300 hover:bg-red-50"
            : playerLimitReached
              ? "cursor-not-allowed bg-slate-50 opacity-50"
            : "bg-white hover:border-blue-300 hover:bg-blue-50"
        }
      `}
    >

      <div className="flex-1">

        <div className="font-semibold">

          {player.firstName} {player.lastName}

        </div>

        <div className="text-sm text-slate-500">

          {getClubName(player.clubId)}

        </div>

      </div>

      {!isDoubles && !tournament.settings.socialPlay && (

      <div className="mr-4 font-semibold text-slate-700">

        {player.rating}

      </div>

      )}

      {selectedPlayers.some(
        (p) => p.id === player.id
      ) ? (

        <div className="flex items-center gap-2 rounded-full bg-green-600 px-3 py-1 font-semibold text-white">

          <Check className="h-4 w-4" />

          Selected

        </div>

      ) : (

        <div className="rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-800">

          Add

        </div>

      )}

    </button>

   ))}

</div>

</div>

        {/* Selected */}

        {/* Selected */}

        <div>

          <div className="sticky top-24 rounded-3xl border bg-white p-5 shadow-sm lg:flex lg:max-h-[calc(100dvh-7rem)] lg:flex-col lg:overflow-hidden">

            <h2 className="text-xl font-bold">

              {isDoubles
                ? "Selected Pairs"
                : "Selected Players"}

            </h2>

<p className="mt-2 text-slate-500">

  {hasPlayerLimit
    ? `${selectedPlayers.length} selected · limit ${tournament.settings.playerCount}`
    : `${selectedPlayers.length} selected`}

</p>

{isDoubles && doublesPairs.length > 1 && (
  <p className="mt-2 text-xs font-medium text-blue-700">
    Drag a player onto another player to swap them between pairs.
  </p>
)}

<div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">

  <div
    className="h-full rounded-full bg-green-500 transition-all duration-300"
    style={{
      width: `${
        hasPlayerLimit
          ? Math.min(
              (selectedPlayers.length /
                tournament.settings.playerCount) *
                100,
              100
            )
          : selectedPlayers.length >= 2
            ? 100
            : 0
      }%`,
    }}
  />

</div>

            <div className="mt-4 space-y-1.5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-2">

              {isDoubles ? (

                doublesPairs.map((pair, index) => (
                  <div
                    key={`pair-${index}`}
                    onDragOver={(event) => {
                      if (
                        draggedDoublesSlot &&
                        pair.length < 2 &&
                        draggedDoublesSlot.pairIndex !== index
                      ) {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                        setDoublesDropTarget(`pair-${index}`);
                      }
                    }}
                    onDragLeave={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                        setDoublesDropTarget(null);
                      }
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      moveDoublesPlayerToOpenPair(index);
                    }}
                    className={`rounded-xl border px-3 py-2 transition ${
                      doublesDropTarget === `pair-${index}`
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-stretch gap-2">
                      <div className="min-w-0 flex-1 space-y-0.5">
                      {pair.map((player, playerIndex) => (
                        <div
                          key={player.id}
                          draggable
                          onDragStart={(event) =>
                            beginDoublesDrag(
                              event,
                              index,
                              playerIndex
                            )
                          }
                          onDragEnd={finishDoublesDrag}
                          onDragOver={(event) => {
                            if (draggedDoublesSlot) {
                              event.preventDefault();
                              event.stopPropagation();
                              event.dataTransfer.dropEffect = "move";
                              setDoublesDropTarget(
                                `player-${index}-${playerIndex}`
                              );
                            }
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            swapDoublesPlayers(index, playerIndex);
                          }}
                          className={`flex cursor-grab items-center justify-between gap-2 rounded-lg px-1.5 py-1 text-sm transition active:cursor-grabbing ${
                            doublesDropTarget ===
                            `player-${index}-${playerIndex}`
                              ? "bg-blue-100 ring-2 ring-blue-300"
                              : draggedDoublesSlot?.pairIndex === index &&
                                  draggedDoublesSlot.playerIndex === playerIndex
                                ? "opacity-40"
                                : "hover:bg-slate-50"
                          }`}
                          title="Drag onto a player in another pair to swap them"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <GripVertical className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">
                              {player.firstName} {player.lastName}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              removePlayer(player.id)
                            }
                            className="font-semibold text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {pair.length === 1 && (
                        <div className="rounded-lg bg-amber-50 px-2 py-1.5 text-xs font-medium text-amber-800">
                          Choose one more player for this pair.
                        </div>
                      )}
                      </div>
                    </div>
                  </div>
                ))

              ) : (

              selectedPlayers.map((player,index)=>(
                <div
                  key={player.id}
                  className="flex items-center rounded-xl border px-4 py-3"
                >

                  <div className="mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">

                    {index+1}

                  </div>

                  <div className="flex-1">

                    <div className="font-medium">

                      {player.firstName} {player.lastName}

                    </div>

                    {!tournament.settings.socialPlay && (

                    <div className="text-sm text-slate-500">

                      {player.rating} TTR

                    </div>

                    )}

                  </div>

                  <button
                    onClick={()=>
                      removePlayer(player.id)
                    }
                    className="text-sm font-semibold text-red-600 hover:text-red-800"
                  >

                    Remove

                  </button>

                </div>
              ))

              )}

            </div>

            <div className="mt-5 flex shrink-0 gap-3">

              <Link
                to="/tournaments/new"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 font-semibold hover:bg-slate-50"
              >

                <ArrowLeft className="h-4 w-4"/>

                Back

              </Link>

              <button
  onClick={async () => {
    if (submissionInProgressRef.current) {
      return;
    }

    submissionInProgressRef.current = true;
    setIsSubmitting(true);

    try {

    const draw =
      generateTournamentDraw(
        selectedPlayers,
        tournament.settings
      );

    const pairPlayers =
      doublesPairs
        .filter(pair => pair.length === 2)
        .map(([playerOne, playerTwo]) =>
          createDoublesPair(
            playerOne,
            playerTwo
          )
        );

    const knockout =
      tournament.settings.format === "doubles"
        ? generateKnockout(
            shufflePlayers(
              pairPlayers
            )
          )
        : tournament.settings.format === "knockout"
        ? generateKnockout(
            orderPlayersForKnockout(
              selectedPlayers,
              tournament.settings.seedByTTR
            )
          )
        : tournament.settings.format === "double-knockout"
        ? generateDoubleKnockout(
            orderPlayersForKnockout(
              selectedPlayers,
              tournament.settings.seedByTTR
            )
          )
        : [];

const savedTournament =
  await saveTournament({
    ...tournament,
    id: tournament.id || creationIdRef.current,
    players:
      isDoubles
        ? pairPlayers
        : selectedPlayers,
    pools: draw.pools,
    matches: draw.matches,
    knockout,
  });

navigate(
  `/tournaments/${savedTournament.id}/live`
);

    } catch (error) {
      console.error(error);
      notify.fault(
        "Unable to build the tournament."
      );
      submissionInProgressRef.current = false;
      setIsSubmitting(false);
    }

  }}
  disabled={
  isSubmitting ||
  !hasValidPlayerTotal ||
  (
    isDoubles &&
    doublesPairs.some(
      pair => pair.length !== 2
    )
  )
}
  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-900 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
>

                {isSubmitting
                  ? "Building Tournament..."
                  : "Continue"}

                <ArrowRight className="h-4 w-4"/>

              </button>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}
