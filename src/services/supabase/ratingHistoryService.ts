import { supabase } from "../../lib/supabase";
import type { RatingHistory } from "../../types/ratingHistory";

type RatingHistoryRow = {
  id: string;
  player_id: string;
  match_id: string;

  rating_before: number;
  rating_after: number;
  rating_change: number;

  recorded_at: string;
};

function fromRow(row: RatingHistoryRow): RatingHistory {
  return {
    id: row.id,

    playerId: row.player_id,
    matchId: row.match_id,

    ratingBefore: row.rating_before,
    ratingAfter: row.rating_after,
    ratingChange: row.rating_change,

    recordedAt: row.recorded_at,
  };
}

function toRow(history: RatingHistory) {
  return {
    id: history.id,

    player_id: history.playerId,
    match_id: history.matchId,

    rating_before: history.ratingBefore,
    rating_after: history.ratingAfter,
    rating_change: history.ratingChange,

    recorded_at: history.recordedAt,
  };
}

export async function getRatingHistory(): Promise<RatingHistory[]> {
  const { data, error } = await supabase
    .from("rating_history")
    .select("*")
    .order("recorded_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (data as RatingHistoryRow[]).map(fromRow);
}

export async function getPlayerRatingHistory(
  playerId: string
): Promise<RatingHistory[]> {
  const { data, error } = await supabase
    .from("rating_history")
    .select("*")
    .eq("player_id", playerId)
    .order("recorded_at", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  const rows = data as RatingHistoryRow[];
  const matchIds = [...new Set(rows.map(row => row.match_id))];

  if (matchIds.length === 0) return [];

  const { data: matches, error: matchError } = await supabase
    .from("matches")
    .select("id")
    .in("id", matchIds);

  if (matchError) throw matchError;

  const validMatchIds = new Set(
    (matches as Array<{ id: string }>).map(match => match.id)
  );

  return rows
    .filter(row => validMatchIds.has(row.match_id))
    .map(fromRow);
}

export async function addRatingHistory(
  history: RatingHistory
): Promise<void> {
  const { error } = await supabase
    .from("rating_history")
    .insert(toRow(history));

  if (error) {
    throw error;
  }
}
