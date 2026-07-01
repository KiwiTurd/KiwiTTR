export interface RatingResult {
  winnerBefore: number;

  winnerAfter: number;

  winnerChange: number;

  loserBefore: number;

  loserAfter: number;

  loserChange: number;

  reliabilityBeforeWinner: number;

  reliabilityAfterWinner: number;

  reliabilityBeforeLoser: number;

  reliabilityAfterLoser: number;
}