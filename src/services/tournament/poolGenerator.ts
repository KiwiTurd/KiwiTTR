import type { Player } from "../../types/player";

import type {
  Pool,
} from "../../types/tournament";

import { snakeSeedPlayers } from "./seeding";

/**
 * Generates balanced pools using snake seeding.
 */
export function generatePools(
  players: Player[],
  poolSize: number,
  seedByTTR: boolean
): Pool[] {

  const poolCount = Math.ceil(
    players.length / poolSize
  );

  const orderedPlayers =
  seedByTTR
    ? snakeSeedPlayers(
        players,
        poolCount
      )
    : [...players].sort(
        () => Math.random() - 0.5
      );

  const pools: Pool[] = [];

  for (
    let i = 0;
    i < poolCount;
    i++
  ) {

    pools.push({

      id: `pool-${i + 1}`,

      name: `Pool ${String.fromCharCode(
        65 + i
      )}`,

      players: [],

    });

  }

  orderedPlayers.forEach(
    (player, index) => {

      const poolIndex =
        index % poolCount;

      pools[poolIndex].players.push(
        player
      );

    }
  );

  return pools;

}