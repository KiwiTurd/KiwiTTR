import { supabase } from "../../lib/supabase";
import type { Match } from "../../types/match";

type MatchRow = {
  id: string;
  event_id: string;

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
    .order("played_at", { ascending: false });

  if (error) throw error;

  return (data as MatchRow[]).map(fromRow);
}

export async function addMatch(match: Match) {
  const { error } = await supabase
    .from("matches")
    .insert(toRow(match));

  if (error) throw error;
}

export async function deleteMatch(id: string) {
  const { error } = await supabase
    .from("matches")
    .delete()
    .eq("id", id);

  if (error) throw error;
}