import type { Player } from "../../types/player";

/**
 * Sort players by TTR rating (highest first).
 */
export function sortPlayersByRating(
  players: Player[]
): Player[] {

  return [...players].sort(
    (a, b) => b.rating - a.rating
  );

}

/**
 * Creates snake seeding order.
 *
 * Example (16 players / 4 pools):
 *
 * 1  2  3  4
 * 8  7  6  5
 * 9 10 11 12
 * 16 15 14 13
 */
export function snakeSeedPlayers(
  players: Player[],
  poolCount: number
): Player[] {

  const sorted =
    sortPlayersByRating(players);

  const seeded: Player[] = [];

  for (
    let start = 0;
    start < sorted.length;
    start += poolCount
  ) {

    const band = sorted.slice(
      start,
      start + poolCount
    );

    const bandIndex =
      start / poolCount;

    if (bandIndex % 2 === 1) {

      band.reverse();

    }

    seeded.push(...band);

  }

  return seeded;

}