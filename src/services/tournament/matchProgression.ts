import type {
  TournamentMatch,
} from "../../types/tournament";

/**
 * Saves the result of a match.
 */
export function recordMatchResult(
  matches: TournamentMatch[],
  matchId: string,
  winnerId: string,
  games: string[]
): TournamentMatch[] {

  return matches.map((match) => {

    if (match.id !== matchId) {

      return match;

    }

    return {

      ...match,

      winnerId,

      completed: true,

      games,

    };

  });

}

/**
 * Returns true if every match
 * in a pool has been completed.
 */
export function isPoolComplete(
  matches: TournamentMatch[],
  poolId: string
): boolean {

  return matches

    .filter(
      match =>
        match.poolId === poolId
    )

    .every(
      match =>
        match.completed
    );

}

/**
 * Returns true if the
 * entire pool stage is complete.
 */
export function arePoolsComplete(
  matches: TournamentMatch[]
): boolean {

  return matches

    .filter(
      match =>
        match.stage === "pool"
    )

    .every(
      match =>
        match.completed
    );

}
export function getNextUnplayedMatch(
  matches: TournamentMatch[]
): TournamentMatch | undefined {

  return matches.find(

    match =>

      !match.completed

  );

}