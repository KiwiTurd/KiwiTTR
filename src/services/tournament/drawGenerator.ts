import type { Player } from "../../types/player";

import type {
  TournamentSettings,
  Pool,
  TournamentMatch,
} from "../../types/tournament";

import { generatePools } from "./poolGenerator";

import { generatePoolMatches } from "./matchGenerator";

export interface TournamentDraw {

  pools: Pool[];

  matches: TournamentMatch[];

}

export function generateTournamentDraw(
  players: Player[],
  settings: TournamentSettings
): TournamentDraw {

  if (settings.format !== "pools") {

    return {

      pools: [],

      matches: [],

    };

  }

  const pools =
    generatePools(
      players,
      settings.poolSize,
      settings.seedByTTR
    );

  const matches =
    generatePoolMatches(
      pools
    );

  return {

    pools,

    matches,

  };

}
