import type {
  Pool,
  TournamentMatch,
} from "../../types/tournament";
import type { Player } from "../../types/player";

function pairingKey(
  playerOneId: string,
  playerTwoId: string
) {
  return [playerOneId, playerTwoId]
    .sort()
    .join(":");
}

/**
 * Uses the circle method so each player appears at most once per
 * round. Odd-sized pools receive one rotating bye each round.
 */
export function generateRoundRobinPairings(
  players: Player[]
): Array<[Player, Player]> {
  const rotation: Array<Player | null> = [
    ...players,
  ];

  if (rotation.length % 2 !== 0) {
    rotation.push(null);
  }

  const pairings: Array<[Player, Player]> = [];
  const roundCount = Math.max(
    0,
    rotation.length - 1
  );

  for (let round = 0; round < roundCount; round++) {
    for (
      let index = 0;
      index < rotation.length / 2;
      index++
    ) {
      const playerOne = rotation[index];
      const playerTwo =
        rotation[rotation.length - 1 - index];

      if (playerOne && playerTwo) {
        pairings.push([playerOne, playerTwo]);
      }
    }

    const fixedPlayer = rotation[0];
    const lastPlayer = rotation[rotation.length - 1];

    rotation.splice(
      0,
      rotation.length,
      fixedPlayer,
      lastPlayer,
      ...rotation.slice(1, -1)
    );
  }

  return pairings;
}

/**
 * Reorders saved matches into the rotating schedule as well as newly
 * generated ones. Unrecognised matches are retained at the end.
 */
export function orderPoolMatchesForPlay(
  pool: Pool,
  matches: TournamentMatch[]
): TournamentMatch[] {
  const poolMatches = matches.filter(
    (match) => match.poolId === pool.id
  );
  const matchesByPair = new Map(
    poolMatches.map((match) => [
      pairingKey(
        match.playerOne.id,
        match.playerTwo.id
      ),
      match,
    ])
  );
  const ordered = generateRoundRobinPairings(
    pool.players
  )
    .map(([playerOne, playerTwo]) =>
      matchesByPair.get(
        pairingKey(playerOne.id, playerTwo.id)
      )
    )
    .filter(Boolean) as TournamentMatch[];
  const orderedIds = new Set(
    ordered.map((match) => match.id)
  );

  return [
    ...ordered,
    ...poolMatches.filter(
      (match) => !orderedIds.has(match.id)
    ),
  ];
}

/**
 * Generates every round-robin match
 * for every pool.
 */
export function generatePoolMatches(
  pools: Pool[]
): TournamentMatch[] {

  const matches: TournamentMatch[] =
    [];

  pools.forEach((pool) => {
    generateRoundRobinPairings(
      pool.players
    ).forEach(([playerOne, playerTwo]) => {
      matches.push({
        id: crypto.randomUUID(),

        stage: "pool",

        poolId: pool.id,

        playerOne,

        playerTwo,

        completed: false,

        winnerId: undefined,

        games: [],
      });
    });

  });

  return matches;

}
