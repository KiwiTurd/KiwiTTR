import {
  addRatingHistory,
} from "../supabase/ratingHistoryService";
import {
  addEvent,
  getEvent,
} from "../supabase/eventService";
import {
  deleteMatch,
  getMatch,
  getMatches,
  updateMatch,
  isMatchFixed,
} from "../supabase/matchService";
import {
  getPlayer,
  updatePlayer,
} from "../supabase/playerService";
import { supabase } from "../../lib/supabase";
import { calculateMatch } from "../ttrEngine";
import { recordMatch } from "../recordMatch";
import type { Event } from "../../types/event";
import type { Match } from "../../types/match";
import type { Player } from "../../types/player";
import type {
  Classic6Game,
  Classic6Match,
  Classic6Player,
} from "./teamEngine";
import { classicTeamTargetScore } from "./teamEngine";

function playerById(
  game: Classic6Game,
  playerId: string
) {
  return [
    ...game.home.players,
    ...game.away.players,
  ].find((player) => player.id === playerId);
}

function realSinglesPlayer(
  game: Classic6Game,
  match: Classic6Match,
  side: "home" | "away"
): Classic6Player {
  const ids =
    side === "home"
      ? match.homePlayerIds
      : match.awayPlayerIds;

  if (ids.length !== 1) {
    throw new Error(
      "Only singles matches can be submitted for TTR."
    );
  }

  const player = playerById(game, ids[0]);

  if (!player) {
    throw new Error(
      "A team match player could not be found."
    );
  }

  return player;
}

async function ensureTeamGameEvent(
  game: Classic6Game
) {
  const eventId = game.eventId ?? game.id;
  const existing = await getEvent(eventId);

  if (existing) {
    return existing.id;
  }

  const event: Event = {
    id: eventId,
    clubId:
      game.locationClubId ||
      game.home.clubId,
    name: game.name,
    date: game.date,
    createdAt: new Date().toISOString(),
  };

  await addEvent(event);

  return event.id;
}

function assertMatchReady(match: Classic6Match) {
  if (
    match.status !== "completed" ||
    !match.winner
  ) {
    throw new Error(
      "Every TTR team match must be completed before submission."
    );
  }

  if (match.sets.length < 3) {
    throw new Error(
      "Every submitted TTR match must have at least 3 sets."
    );
  }
}

function isPlayThrough(game: Classic6Game) {
  return (
    game.format === "abc-123" ||
    (game.format === "custom" &&
      game.customSettings?.matchMode === "play-through")
  );
}

function teamResultReached(
  game: Classic6Game,
  home: number,
  away: number
) {
  if (isPlayThrough(game)) {
    return false;
  }

  const targetScore = classicTeamTargetScore(
    game.format ?? "classic-6",
    game.customSettings
  );

  return (
    home === targetScore ||
    away === targetScore ||
    (game.format === "classic-6" &&
      home === 8 &&
      away === 8)
  );
}

function countedMatchesForSubmission(
  game: Classic6Game
) {
  const countedMatches: Classic6Match[] = [];
  let home = 0;
  let away = 0;

  for (const match of [...game.matches].sort(
    (a, b) => a.order - b.order
  )) {
    if (!match.countsForTeamScore) {
      continue;
    }

    if (
      match.status !== "completed" ||
      !match.winner
    ) {
      throw new Error(
        "Every scoring team match must be completed up to the final result."
      );
    }

    countedMatches.push(match);

    if (match.winner === "home") {
      home += 1;
    } else {
      away += 1;
    }

    if (teamResultReached(game, home, away)) {
      break;
    }
  }

  return countedMatches;
}

function teamMatchPlayedAt(
  game: Classic6Game,
  match: Classic6Match
) {
  const baseDate = game.startTime
    ? `${game.date}T${game.startTime}:00`
    : `${game.date}T00:00:00`;
  const date = new Date(baseDate);

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  date.setMilliseconds(match.order);

  return date.toISOString();
}

export async function recordTeamGameTtrMatches(
  game: Classic6Game
): Promise<Classic6Game> {
  const countedMatches =
    countedMatchesForSubmission(game);
  const ttrMatches = countedMatches.filter(
    (match) => match.countsForTTR
  );

  for (const match of ttrMatches) {
    assertMatchReady(match);
  }

  const eventId = await ensureTeamGameEvent(game);
  const recordedMatchIds = new Map<
    string,
    string
  >();

  for (const match of ttrMatches) {
    if (match.recordedMatchId) {
      continue;
    }

    const homePlayer = realSinglesPlayer(
      game,
      match,
      "home"
    );
    const awayPlayer = realSinglesPlayer(
      game,
      match,
      "away"
    );

    const result = await recordMatch(
      eventId,
      homePlayer.id,
      awayPlayer.id,
      match.sets.map((set) => ({
        player1Score: set.home,
        player2Score: set.away,
      }))
    );
    const playedAt = teamMatchPlayedAt(
      game,
      match
    );
    const adjustedMatch = {
      ...result.match,
      playedAt,
    };

    await updateMatch(adjustedMatch);

    recordedMatchIds.set(
      match.id,
      result.match.id
    );
  }

  if (recordedMatchIds.size > 0) {
    const firstPlayedAt = ttrMatches
      .filter((match) =>
        recordedMatchIds.has(match.id)
      )
      .map((match) =>
        teamMatchPlayedAt(game, match)
      )
      .sort()[0];

    await replayMatchesFrom(firstPlayedAt);
  }

  return {
    ...game,
    eventId,
    matches: game.matches.map((match) => ({
      ...match,
      recordedMatchId:
        match.recordedMatchId ??
        recordedMatchIds.get(match.id),
    })),
  };
}

export function clearTeamGameRecordedMatchIds(
  game: Classic6Game
): Classic6Game {
  return {
    ...game,
    matches: game.matches.map((match) => ({
      ...match,
      recordedMatchId: undefined,
    })),
  };
}

async function deleteRatingHistoryForMatches(
  matchIds: string[]
) {
  if (matchIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("rating_history")
    .delete()
    .in("match_id", matchIds);

  if (error) {
    throw error;
  }
}

function matchSetWinnerIds(match: Match) {
  let player1Sets = 0;
  let player2Sets = 0;

  match.sets.forEach((set) => {
    if (set.player1Score > set.player2Score) {
      player1Sets += 1;
    } else {
      player2Sets += 1;
    }
  });

  return player1Sets > player2Sets
    ? {
        winnerId: match.player1Id,
        loserId: match.player2Id,
      }
    : {
        winnerId: match.player2Id,
        loserId: match.player1Id,
      };
}

function playerMatchStats(
  matches: Match[],
  playerId: string
) {
  const wins = matches.filter(
    (match) => match.winnerId === playerId
  ).length;
  const losses = matches.filter(
    (match) => match.loserId === playerId
  ).length;

  return {
    wins,
    losses,
    played: wins + losses,
  };
}

async function baselinePlayersForReplay(
  matches: Match[]
) {
  const playerIds = [
    ...new Set(
      matches.flatMap((match) => [
        match.player1Id,
        match.player2Id,
      ])
    ),
  ];
  const players = new Map<string, Player>();

  for (const playerId of playerIds) {
    const player = await getPlayer(playerId);

    if (!player) {
      continue;
    }

    const ratingChange = matches.reduce(
      (total, match) => {
        if (match.winnerId === playerId) {
          return total + match.winnerRatingChange;
        }

        if (match.loserId === playerId) {
          return total + match.loserRatingChange;
        }

        return total;
      },
      0
    );
    const stats = playerMatchStats(
      matches,
      playerId
    );

    players.set(playerId, {
      ...player,
      rating: player.rating - ratingChange,
      wins: Math.max(
        0,
        player.wins - stats.wins
      ),
      losses: Math.max(
        0,
        player.losses - stats.losses
      ),
      matchesPlayed: Math.max(
        0,
        player.matchesPlayed - stats.played
      ),
      provisionalMatchesRemaining:
        player.provisionalMatchesRemaining +
        stats.played,
    });
  }

  return players;
}

function buildReplayedMatch(
  match: Match,
  player1: Player,
  player2: Player
) {
  const { winnerId, loserId } =
    matchSetWinnerIds(match);
  const winner =
    winnerId === player1.id ? player1 : player2;
  const loser =
    loserId === player1.id ? player1 : player2;
  const result = calculateMatch(winner, loser);
  const replayedMatch: Match = {
    ...match,
    winnerId: result.winner.id,
    loserId: result.loser.id,
    winnerRatingBefore: winner.rating,
    winnerRatingAfter: result.winner.rating,
    loserRatingBefore: loser.rating,
    loserRatingAfter: result.loser.rating,
    winnerRatingChange: result.winnerChange,
    loserRatingChange: result.loserChange,
  };

  return {
    match: replayedMatch,
    winner: result.winner,
    loser: result.loser,
  };
}

async function addReplayHistory(match: Match) {
  await addRatingHistory({
    id: crypto.randomUUID(),
    playerId: match.winnerId,
    matchId: match.id,
    ratingBefore: match.winnerRatingBefore,
    ratingAfter: match.winnerRatingAfter,
    ratingChange: match.winnerRatingChange,
    recordedAt: match.playedAt,
  });

  await addRatingHistory({
    id: crypto.randomUUID(),
    playerId: match.loserId,
    matchId: match.id,
    ratingBefore: match.loserRatingBefore,
    ratingAfter: match.loserRatingAfter,
    ratingChange: match.loserRatingChange,
    recordedAt: match.playedAt,
  });
}

async function recomputeHighestRating(
  player: Player
): Promise<Player> {
  const { data, error } = await supabase
    .from("rating_history")
    .select("rating_before,rating_after")
    .eq("player_id", player.id);

  if (error) {
    throw error;
  }

  const recordedRatings = (
    data as Array<{
      rating_before: number;
      rating_after: number;
    }>
  ).flatMap(history => [
    history.rating_before,
    history.rating_after,
  ]);

  return {
    ...player,
    highestRating: Math.max(
      player.rating,
      ...recordedRatings
    ),
  };
}

async function replayMatchesFrom(
  replayFrom: string,
  removedMatches: Match[] = []
) {
  if (!replayFrom) {
    return;
  }

  const removedMatchIds = new Set(
    removedMatches.map((match) => match.id)
  );
  const replayWindowMatches = (await getMatches())
    .filter((match) => match.playedAt >= replayFrom)
    .sort((a, b) =>
      a.playedAt === b.playedAt
        ? a.id.localeCompare(b.id)
        : a.playedAt.localeCompare(b.playedAt)
    );

  if (removedMatches.length > 0) {
    const fixedMatch = replayWindowMatches.find(isMatchFixed);

    if (fixedMatch) {
      throw new Error(
        "This result can no longer be removed because it would change fixed TTR history older than seven days."
      );
    }
  }

  const replayWindowMatchIds =
    replayWindowMatches.map((match) => match.id);
  const playerState =
    await baselinePlayersForReplay(
      replayWindowMatches
    );

  await deleteRatingHistoryForMatches(
    replayWindowMatchIds
  );
  await deleteNormalMatchSetsForMatches(
    [...removedMatchIds]
  );

  for (const matchId of removedMatchIds) {
    await deleteMatch(matchId);
  }

  for (const match of replayWindowMatches) {
    if (removedMatchIds.has(match.id)) {
      continue;
    }

    const player1 = playerState.get(match.player1Id);
    const player2 = playerState.get(match.player2Id);

    if (!player1 || !player2) {
      continue;
    }

    const result = buildReplayedMatch(
      match,
      player1,
      player2
    );

    await updateMatch(result.match);
    await addReplayHistory(result.match);

    playerState.set(
      result.winner.id,
      result.winner
    );
    playerState.set(result.loser.id, result.loser);
  }

  for (const player of playerState.values()) {
    await updatePlayer(
      await recomputeHighestRating(player)
    );
  }
}

async function deleteNormalMatchSetsForMatches(
  matchIds: string[]
) {
  if (matchIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("match_sets")
    .delete()
    .in("match_id", matchIds);

  if (error) {
    throw error;
  }
}

async function replayMatchesAfterRemoving(
  removedMatches: Match[]
) {
  if (removedMatches.length === 0) {
    return;
  }

  const replayFrom = removedMatches
    .map((match) => match.playedAt)
    .sort()[0];

  await replayMatchesFrom(replayFrom, removedMatches);
}

export async function replayTtrMatchesFrom(
  replayFrom: string
) {
  await replayMatchesFrom(replayFrom);
}

export async function removeRecordedTtrMatchesAndReplay(
  recordedMatchIds: string[]
) {
  const uniqueMatchIds = [
    ...new Set(recordedMatchIds.filter(Boolean)),
  ];

  if (uniqueMatchIds.length === 0) {
    return;
  }

  const matches = (
    await Promise.all(
      uniqueMatchIds.map((matchId) =>
        getMatch(matchId)
      )
    )
  ).filter(Boolean) as Match[];

  await replayMatchesAfterRemoving(matches);
}

export async function removeTeamGameTtrMatches(
  game: Classic6Game
): Promise<Classic6Game> {
  const recordedMatchIds = game.matches
    .map((match) => match.recordedMatchId)
    .filter(Boolean) as string[];

  if (recordedMatchIds.length === 0) {
    return clearTeamGameRecordedMatchIds(game);
  }

  await removeRecordedTtrMatchesAndReplay(
    recordedMatchIds
  );

  return clearTeamGameRecordedMatchIds(game);
}
