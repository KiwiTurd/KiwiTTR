import type { Match, MatchSet } from "../types/match";

import { calculateMatch } from "./ttrEngine";
import { getPlayers, updatePlayer } from "./playerService";
import { addRatingHistory } from "./ratingHistoryService";

const STORAGE_KEY = "kiwittr_matches";

export function getMatches(): Match[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveMatches(matches: Match[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
}

export function addMatch(match: Match) {
  const matches = getMatches();

  matches.unshift(match);

  saveMatches(matches);
}

export function clearMatches() {
  saveMatches([]);
}

export function recordMatch(
  eventId: string,
  player1Id: string,
  player2Id: string,
  sets: MatchSet[]
): Match {
  const players = getPlayers();

  const player1 = players.find((p) => p.id === player1Id);
  const player2 = players.find((p) => p.id === player2Id);

  if (!player1 || !player2) {
    throw new Error("Unable to find players.");
  }

  let player1Sets = 0;
  let player2Sets = 0;

  sets.forEach((set) => {
    const max = Math.max(set.player1Score, set.player2Score);
    const min = Math.min(set.player1Score, set.player2Score);

    // Ignore incomplete or invalid sets
    if (max < 11) return;
    if (max - min < 2) return;

    if (set.player1Score > set.player2Score) {
      player1Sets++;
    } else {
      player2Sets++;
    }
  });

  if (player1Sets === player2Sets) {
    throw new Error("Match is tied.");
  }

  const winner = player1Sets > player2Sets ? player1 : player2;
  const loser = player1Sets > player2Sets ? player2 : player1;

  const result = calculateMatch(winner, loser);

  updatePlayer(result.winner);
  updatePlayer(result.loser);

  const match: Match = {
    id: crypto.randomUUID(),

    eventId,

    playedAt: new Date().toISOString(),

    player1Id,
    player2Id,

    winnerId: result.winner.id,
    loserId: result.loser.id,

    winnerRatingBefore: winner.rating,
    winnerRatingAfter: result.winner.rating,

    loserRatingBefore: loser.rating,
    loserRatingAfter: result.loser.rating,

    winnerRatingChange: result.winnerChange,
    loserRatingChange: result.loserChange,

    sets,
  };

  addMatch(match);

  addRatingHistory({
    id: crypto.randomUUID(),

    playerId: result.winner.id,

    matchId: match.id,

    ratingBefore: winner.rating,
    ratingAfter: result.winner.rating,

    ratingChange: result.winnerChange,

    recordedAt: match.playedAt,
  });

  addRatingHistory({
    id: crypto.randomUUID(),

    playerId: result.loser.id,

    matchId: match.id,

    ratingBefore: loser.rating,
    ratingAfter: result.loser.rating,

    ratingChange: result.loserChange,

    recordedAt: match.playedAt,
  });

  return match;
}