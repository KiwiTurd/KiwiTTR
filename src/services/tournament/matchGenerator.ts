import type {
  Pool,
  TournamentMatch,
} from "../../types/tournament";

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

    for (
      let i = 0;
      i < pool.players.length - 1;
      i++
    ) {

      for (
        let j = i + 1;
        j < pool.players.length;
        j++
      ) {

        matches.push({

          id: crypto.randomUUID(),

          stage: "pool",

          poolId: pool.id,

          playerOne:
            pool.players[i],

          playerTwo:
            pool.players[j],

          completed: false,

          winnerId: undefined,

          games: [],

        });

      }

    }

  });

  return matches;

}