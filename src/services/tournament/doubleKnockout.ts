import type { Player } from "../../types/player";
import type { KnockoutMatch } from "../../types/tournament";

function loserOf(match: KnockoutMatch) {
  if (!match.completed || !match.winnerId) return null;
  return match.playerOne?.id === match.winnerId
    ? match.playerTwo
    : match.playerOne;
}

export function doubleKnockoutLosses(matches: KnockoutMatch[]) {
  const losses = new Map<string, number>();
  matches.forEach((match) => {
    const loser = loserOf(match);
    if (loser) losses.set(loser.id, (losses.get(loser.id) ?? 0) + 1);
  });
  return losses;
}

function createRound(players: Player[], round: number, bracket: KnockoutMatch["bracket"]) {
  const matches: KnockoutMatch[] = [];
  for (let index = 0; index + 1 < players.length; index += 2) {
    matches.push({
      id: crypto.randomUUID(),
      round,
      position: matches.length + 1,
      bracket,
      playerOne: players[index],
      playerTwo: players[index + 1],
      winnerId: null,
      completed: false,
      games: [],
    });
  }
  return matches;
}

export function generateDoubleKnockout(players: Player[]): KnockoutMatch[] {
  return createRound(players, 1, "winners");
}

export function advanceDoubleKnockout(
  bracket: KnockoutMatch[],
  tournamentPlayers: Player[],
  completedMatchId: string,
  winnerId: string,
  games: string[] = []
) {
  const completed = bracket.map((match) =>
    match.id === completedMatchId
      ? { ...match, winnerId, completed: true, games }
      : match
  );

  if (completed.some((match) => !match.completed)) return completed;

  const players = new Map<string, Player>(
    tournamentPlayers.map((player) => [player.id, player])
  );
  completed.forEach((match) => {
    if (match.playerOne) players.set(match.playerOne.id, match.playerOne);
    if (match.playerTwo) players.set(match.playerTwo.id, match.playerTwo);
  });

  const losses = doubleKnockoutLosses(completed);
  const active = [...players.values()].filter(
    (player) => (losses.get(player.id) ?? 0) < 2
  );
  if (active.length <= 1) return completed;

  const nextRound = Math.max(...completed.map((match) => match.round)) + 1;
  if (active.length === 2) {
    return [
      ...completed,
      ...createRound(active, nextRound, "grand-final"),
    ];
  }

  const undefeated = active.filter((player) => (losses.get(player.id) ?? 0) === 0);
  const oneLoss = active.filter((player) => (losses.get(player.id) ?? 0) === 1);
  const next = [
    ...createRound(undefeated, nextRound, "winners"),
    ...createRound(oneLoss, nextRound, "losers"),
  ].map((match, index) => ({ ...match, position: index + 1 }));

  return next.length > 0 ? [...completed, ...next] : completed;
}

export function getDoubleKnockoutChampion(
  players: Player[],
  matches: KnockoutMatch[]
) {
  if (matches.some((match) => !match.completed)) return null;
  const losses = doubleKnockoutLosses(matches);
  const active = players.filter((player) => (losses.get(player.id) ?? 0) < 2);
  return active.length === 1 && matches.length > 0 ? active[0] : null;
}
