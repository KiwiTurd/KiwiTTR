import { supabase } from "../../lib/supabase";
import type { Player } from "../../types/player";

type PlayerRow = {
  id: string;
  profile_id: string | null;
  club_id: string;
  first_name: string;
  last_name: string;
  rating: number;
  highest_rating: number;
  wins: number;
  losses: number;
  matches_played: number;
  provisional_matches_remaining: number;
  rating_reliability: number;
  is_active: boolean;
  created_at: string;
};

function fromRow(row: PlayerRow): Player {
  return {
    id: row.id,
    clubId: row.club_id,
    firstName: row.first_name,
    lastName: row.last_name,
    rating: row.rating,
    highestRating: row.highest_rating,
    wins: row.wins,
    losses: row.losses,
    matchesPlayed: row.matches_played,
    provisionalMatchesRemaining:
      row.provisional_matches_remaining,
    ratingReliability: Number(row.rating_reliability),
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function toRow(player: Player) {
  return {
    id: player.id,
    club_id: player.clubId,
    first_name: player.firstName,
    last_name: player.lastName,
    rating: player.rating,
    highest_rating: player.highestRating,
    wins: player.wins,
    losses: player.losses,
    matches_played: player.matchesPlayed,
    provisional_matches_remaining:
      player.provisionalMatchesRemaining,
    rating_reliability: player.ratingReliability,
    is_active: player.isActive,
    created_at: player.createdAt,
  };
}

export async function getPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .order("rating", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return (data as PlayerRow[]).map(fromRow);
}

export async function getPlayer(
  id: string
): Promise<Player | null> {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return fromRow(data as PlayerRow);
}

export async function addPlayer(player: Player) {
  const { error } = await supabase
    .from("players")
    .insert(toRow(player));

  if (error) {
    console.error(error);
    throw error;
  }
}

export async function updatePlayer(player: Player) {
  const { error } = await supabase
    .from("players")
    .update(toRow(player))
    .eq("id", player.id);

  if (error) {
    console.error(error);
    throw error;
  }
}

export async function deletePlayer(id: string) {
  const { error } = await supabase
    .from("players")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    throw error;
  }
}