import { supabase } from "../../lib/supabase";
import type { Match } from "../../types/match";

type MatchRow = {
  id: string;

  event_id: string;

  player1_id: string;
  player2_id: string;

  winner_id: string;
  loser_id: string;

  played_at: string;

  winner_rating_before: number;
  winner_rating_after: number;

  loser_rating_before: number;
  loser_rating_after: number;

  winner_rating_change: number;
  loser_rating_change: number;

  sets: unknown;

  created_at: string;
};

function fromRow(row: MatchRow): Match {
  return {
    id: row.id,

    eventId: row.event_id,

    player1Id: row.player1_id,
    player2Id: row.player2_id,

    winnerId: row.winner_id,
    loserId: row.loser_id,

    playedAt: row.played_at,

    winnerRatingBefore: row.winner_rating_before,
    winnerRatingAfter: row.winner_rating_after,

    loserRatingBefore: row.loser_rating_before,
    loserRatingAfter: row.loser_rating_after,

    winnerRatingChange: row.winner_rating_change,
    loserRatingChange: row.loser_rating_change,

    sets: row.sets as Match["sets"],
  };
}

function toRow(match: Match) {
  return {
    id: match.id,

    event_id: match.eventId,

    player1_id: match.player1Id,
    player2_id: match.player2Id,

    winner_id: match.winnerId,
    loser_id: match.loserId,

    played_at: match.playedAt,

    winner_rating_before: match.winnerRatingBefore,
    winner_rating_after: match.winnerRatingAfter,

    loser_rating_before: match.loserRatingBefore,
    loser_rating_after: match.loserRatingAfter,

    winner_rating_change: match.winnerRatingChange,
    loser_rating_change: match.loserRatingChange,

    sets: match.sets,
  };
}

export async function getMatches(): Promise<Match[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("played_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (data as MatchRow[]).map(fromRow);
}

export async function getMatch(
  id: string
): Promise<Match | null> {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? fromRow(data as MatchRow) : null;
}

export async function addMatch(
  match: Match
): Promise<void> {
  const { error } = await supabase
    .from("matches")
    .insert(toRow(match));

  if (error) {
    throw error;
  }
}

export async function deleteMatch(
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("matches")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function getPlayerMatches(
  playerId: string
): Promise<Match[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .or(
      `player1_id.eq.${playerId},player2_id.eq.${playerId}`
    )
    .order("played_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (data as MatchRow[]).map(fromRow);
}

export async function getRecentMatches(
  limit = 20
): Promise<Match[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("played_at", {
      ascending: false,
    })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data as MatchRow[]).map(fromRow);
}