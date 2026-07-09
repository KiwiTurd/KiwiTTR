import type { Pool } from "../../types/tournament";
import type { Player } from "../../types/player";
import type { TournamentMatch } from "../../types/tournament";

import { calculatePoolStandings } from "./standings";

export function getQualifiers(

  pools: Pool[],

  matches: TournamentMatch[],

  progressing: number

): Player[] {

  const qualifiers: Player[] = [];

  for (const pool of pools) {

    const standings =
      calculatePoolStandings(
        pool,
        matches
      );

    qualifiers.push(

      ...standings

        .slice(0, progressing)

        .map(

          standing => standing.player

        )

    );

  }

  return qualifiers;

}