import type { KnockoutMatch } from "../../types/tournament";

export function advanceWinner(

  bracket: KnockoutMatch[],

  completedMatchId: string,

  winnerId: string

): KnockoutMatch[] {

  const updated =
    bracket.map(match => ({ ...match }));

  const completedMatch =
    updated.find(
      m => m.id === completedMatchId
    );

  if (!completedMatch) {
    return updated;
  }

  const winner =
    completedMatch.playerOne?.id === winnerId
      ? completedMatch.playerOne
      : completedMatch.playerTwo;

  if (!winner) {
    return updated;
  }

  completedMatch.winnerId = winnerId;

  const currentRound =
    completedMatch.round;

  const currentPosition =
    completedMatch.position;

  const nextRound =
    currentRound + 1;

  const nextPosition =
    Math.ceil(currentPosition / 2);

  const nextMatch =
    updated.find(

      match =>

        match.round === nextRound &&

        match.position === nextPosition

    );

  if (!nextMatch) {
    return updated;
  }

  if (currentPosition % 2 === 1) {

    nextMatch.playerOne =
      winner;

  } else {

    nextMatch.playerTwo =
      winner;

  }

  return updated;

}
