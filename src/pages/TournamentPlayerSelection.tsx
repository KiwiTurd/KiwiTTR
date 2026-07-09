import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Search,
  Trophy,
} from "lucide-react";
import {
  Link,
  useNavigate,
} from "react-router-dom";
import type { Club } from "../types/club";

import { getClubs } from "../services/supabase/clubService";

import { useTournament } from "../context/TournamentContext";

import type { Player } from "../types/player";

import { getPlayers } from "../services/supabase/playerService";

import { generateTournamentDraw } from "../services/tournament/drawGenerator";
import { generateKnockout } from "../services/tournament/knockoutGenerator";

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

export default function TournamentPlayerSelection() {

  const navigate =
  useNavigate();

const {
  saveTournament,
  tournament,
} = useTournament();

const [players, setPlayers] =
  useState<Player[]>([]);

const [clubs, setClubs] =
  useState<Club[]>([]);

const [selectedPlayers, setSelectedPlayers] =
  useState<Player[]>(
    tournament.players
  );

const [doublesPairs, setDoublesPairs] =
  useState<Player[][]>([]);

const isDoubles =
  tournament.settings.format === "doubles";

  const [search, setSearch] =
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

}, [
  tournament.settings.format,
  tournament.settings.socialPlay,
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
          tournament.settings.clubId &&
          player.clubId !==
            tournament.settings.clubId
        ) {
          return false;
        }

        const fullName =
          `${player.firstName} ${player.lastName}`;

        return fullName
          .toLowerCase()
          .includes(search.toLowerCase());

      });

    }, [
      players,
      search,
      tournament.settings.clubId,
    ]);

  function addPlayer(player: Player) {

    if (
      selectedPlayers.some(
        (p) => p.id === player.id
      )
    ) {
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

  return (

    <div className="max-w-7xl mx-auto">

      <div className="mb-8">

        <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">

          <Trophy className="h-4 w-4" />

          Tournament Wizard

        </div>

        <h1 className="mt-4 text-5xl font-black">

          Select Players

        </h1>

      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8">

        {/* Available */}

        <div>

          <div className="relative mb-6">

            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"/>

            <input
              value={search}
              onChange={(e)=>
                setSearch(e.target.value)
              }
              placeholder="Search players..."
              className="w-full rounded-xl border py-3 pl-12 pr-4"
            />

          </div>

<div className="space-y-2">

  {filteredPlayers.map((player) => (

    <button
      key={player.id}
      onClick={() => addPlayer(player)}
      disabled={selectedPlayers.some(
        (p) => p.id === player.id
      )}
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
            ? "border-green-300 bg-green-50"
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

          <div className="sticky top-24 rounded-3xl border bg-white p-6 shadow-sm">

            <h2 className="text-xl font-bold">

              {isDoubles
                ? "Selected Pairs"
                : "Selected Players"}

            </h2>

            <p className="mt-2 text-slate-500">

  {selectedPlayers.length} / {tournament.settings.playerCount} selected

</p>

<div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">

  <div
    className="h-full rounded-full bg-green-500 transition-all duration-300"
    style={{
      width: `${
        (selectedPlayers.length /
          tournament.settings.playerCount) *
        100
      }%`,
    }}
  />

</div>

            <div className="mt-6 space-y-2">

              {isDoubles ? (

                doublesPairs.map((pair, index) => (
                  <div
                    key={pair
                      .map(player => player.id)
                      .join("-")}
                    className="rounded-xl border px-4 py-3"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-900 text-sm font-bold text-white">
                        {index + 1}
                      </div>
                      <div className="font-medium">
                        Pair {index + 1}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {pair.map(player => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span>
                            {player.firstName} {player.lastName}
                          </span>
                          <button
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
                        <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                          Choose one more player for this pair.
                        </div>
                      )}
                    </div>
                  </div>
                ))

              ) : (

              selectedPlayers.map((player,index)=>(
                <div
                  key={player.id}
                  className="flex items-center rounded-xl border px-4 py-3"
                >

                  <div className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-blue-900 text-sm font-bold text-white">

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

            <div className="mt-8 flex gap-3">

              <Link
                to="/tournaments/new"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 font-semibold hover:bg-slate-50"
              >

                <ArrowLeft className="h-4 w-4"/>

                Back

              </Link>

              <button
  onClick={async () => {

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
        : [];

const savedTournament =
  await saveTournament({
    ...tournament,
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

  }}
  disabled={
  selectedPlayers.length !==
    tournament.settings.playerCount ||
  (
    isDoubles &&
    doublesPairs.some(
      pair => pair.length !== 2
    )
  )
}
  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-900 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
>

                Continue

                <ArrowRight className="h-4 w-4"/>

              </button>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}
