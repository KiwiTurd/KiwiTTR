import type { KnockoutMatch } from "../../types/tournament";

export function advanceWinner(

  bracket: KnockoutMatch[],

  completedMatchId: string,

  winnerId: string,

  games: string[] = []

): KnockoutMatch[] {

  const updated = bracket.map(match => {

    if (match.id !== completedMatchId) {

      return match;

    }

    return {

      ...match,

      winnerId,

      completed: true,

      games,

    };

  });

  const currentMatch =
    updated.find(
      match =>
        match.id === completedMatchId
    );

  if (!currentMatch) {

    return updated;

  }

  const nextRound =
    currentMatch.round + 1;

  const nextPosition =
    Math.ceil(
      currentMatch.position / 2
    );

  const nextMatch =
    updated.find(

      match =>

        match.round === nextRound &&

        match.position === nextPosition

    );

  if (!nextMatch) {

    return updated;

  }

  const winner =

    currentMatch.playerOne?.id === winnerId

      ? currentMatch.playerOne

      : currentMatch.playerTwo;

  if (!winner) {

    return updated;

  }

  return updated.map(match => {

    if (match.id !== nextMatch.id) {

      return match;

    }

    if (

      currentMatch.position % 2 === 1

    ) {

      return {

        ...match,

        playerOne: winner,

      };

    }

    return {

      ...match,

      playerTwo: winner,

    };

  });

}
