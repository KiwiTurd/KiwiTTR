import type { Player } from "../../types/player";
import type { KnockoutMatch } from "../../types/tournament";

export type { KnockoutMatch };

function getWinner(
  match: KnockoutMatch
): Player | null {

  if (!match.winnerId) {
    return null;
  }

  if (match.playerOne?.id === match.winnerId) {
    return match.playerOne;
  }

  if (match.playerTwo?.id === match.winnerId) {
    return match.playerTwo;
  }

  return null;

}

function placeWinnerInNextMatch(
  bracket: KnockoutMatch[],
  match: KnockoutMatch,
  winner: Player
) {

  const nextMatch = bracket.find(
    next =>
      next.round === match.round + 1 &&
      next.position === Math.ceil(match.position / 2)
  );

  if (!nextMatch) {
    return;
  }

  if (match.position % 2 === 1) {
    nextMatch.playerOne = winner;
  } else {
    nextMatch.playerTwo = winner;
  }

}

function autoAdvanceByes(
  bracket: KnockoutMatch[]
): KnockoutMatch[] {

  let changed = true;

  while (changed) {

    changed = false;

    for (const match of bracket) {

      if (
        match.completed ||
        (!match.playerOne && !match.playerTwo) ||
        (match.playerOne && match.playerTwo)
      ) {
        continue;
      }

      const winner =
        match.playerOne ?? match.playerTwo;

      if (!winner) {
        continue;
      }

      match.winnerId = winner.id;
      match.completed = true;
      match.games = ["Bye"];

      placeWinnerInNextMatch(
        bracket,
        match,
        winner
      );

      changed = true;

    }

    for (const match of bracket) {

      const winner = getWinner(match);

      if (winner) {
        placeWinnerInNextMatch(
          bracket,
          match,
          winner
        );
      }

    }

  }

  return bracket;

}

export function generateKnockout(
  players: Player[]
): KnockoutMatch[] {

  const size = Math.pow(
    2,
    Math.ceil(Math.log2(players.length))
  );

  const bracket: KnockoutMatch[] = [];

  const firstRoundMatches = size / 2;

  for (
    let i = 0;
    i < firstRoundMatches;
    i++
  ) {

    bracket.push({

      id: crypto.randomUUID(),

      round: 1,

      position: i + 1,

      playerOne:
        players[i] ?? null,

      playerTwo:
        players[
          size - 1 - i
        ] ?? null,

      winnerId: null,

      completed: false,

      games: [],

    });

  }

  let matches =
    firstRoundMatches;

  let round = 2;

  while (matches > 1) {

    matches /= 2;

    for (
      let i = 0;
      i < matches;
      i++
    ) {

      bracket.push({

        id:
          crypto.randomUUID(),

        round,

        position: i + 1,

        playerOne: null,

        playerTwo: null,

        winnerId: null,

        completed: false,

        games: [],

      });

    }

    round++;

  }

  return autoAdvanceByes(
    bracket
  );

}
