import { supabase } from "../../lib/supabase";
import type { Player } from "../../types/player";

type PlayerRow = {
  id: string;

  profile_id: string | null;

  club_id: string;

  first_name: string;
  last_name: string;

  mobile: string | null;
  email: string | null;
  mobile_public_to_club: boolean | null;
  email_public_to_club: boolean | null;
  avatar_url: string | null;

  rating: number;
  initial_rating: number | null;
  highest_rating: number;

  wins: number;
  losses: number;

  matches_played: number;

  provisional_matches_remaining: number;

  rating_reliability: number;

  is_active: boolean;

  created_at: string;
};

type PlayerSearchRow = PlayerRow & {
  clubs?: {
    name: string | null;
  } | null;
};

export interface PlayerSearchResult
  extends Player {
  clubName: string;
}

function fromRow(row: PlayerRow): Player {
  return {
    id: row.id,

    profileId: row.profile_id,

    clubId: row.club_id,

    firstName: row.first_name,
    lastName: row.last_name,

    mobile: row.mobile ?? "",
    email: row.email ?? "",
    mobilePublicToClub: row.mobile_public_to_club ?? false,
    emailPublicToClub: row.email_public_to_club ?? false,
    avatarUrl: row.avatar_url ?? "",

    rating: row.rating,
    initialRating: row.initial_rating ?? row.rating,
    highestRating: row.highest_rating,

    wins: row.wins,
    losses: row.losses,

    matchesPlayed: row.matches_played,

    provisionalMatchesRemaining:
      row.provisional_matches_remaining,

    ratingReliability: Number(
      row.rating_reliability
    ),

    isActive: row.is_active,

    createdAt: row.created_at,
  };
}

function toRow(player: Player) {
  return {
    id: player.id,

    profile_id: player.profileId,

    club_id: player.clubId,

    first_name: player.firstName,
    last_name: player.lastName,

    mobile: player.mobile,
    email: player.email,
    mobile_public_to_club: player.mobilePublicToClub,
    email_public_to_club: player.emailPublicToClub,
    avatar_url: player.avatarUrl || null,

    rating: player.rating,
    initial_rating:
      player.initialRating ?? player.rating,
    highest_rating: player.highestRating,

    wins: player.wins,
    losses: player.losses,

    matches_played: player.matchesPlayed,

    provisional_matches_remaining:
      player.provisionalMatchesRemaining,

    rating_reliability:
      player.ratingReliability,

    is_active: player.isActive,

    created_at: player.createdAt,
  };
}

export async function getPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .order("rating", {
      ascending: false,
    });

  if (error) {
    throw error;
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
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data
    ? fromRow(data as PlayerRow)
    : null;
}

/*
|--------------------------------------------------------------------------
| Search list (Player Selector)
|--------------------------------------------------------------------------
*/

export async function getPlayerSearchList(): Promise<
  PlayerSearchResult[]
> {
  const { data, error } =
    await supabase
      .from("players")
      .select(`
        *,
        clubs (
          name
        )
      `)
      .eq("is_active", true)
      .order("rating", {
        ascending: false,
      });

  if (error) {
    throw error;
  }

  return (data as PlayerSearchRow[]).map((row) => ({
    ...fromRow(row),
    clubName: row.clubs?.name ?? "",
  }));
}

export async function addPlayer(
  player: Player
): Promise<void> {
  const { error } = await supabase
    .from("players")
    .insert(toRow(player));

  if (error) {
    throw error;
  }
}

export async function updatePlayer(
  player: Player
): Promise<void> {
  const { error } = await supabase
    .from("players")
    .update(toRow(player))
    .eq("id", player.id);

  if (error) {
    throw error;
  }
}

export async function updateOwnPlayerContact({
  mobile,
  email,
  mobilePublicToClub,
  emailPublicToClub,
}: {
  mobile: string;
  email: string;
  mobilePublicToClub: boolean;
  emailPublicToClub: boolean;
}): Promise<void> {
  const { error } = await supabase.rpc(
    "update_own_player_contact",
    {
      new_mobile: mobile,
      new_email: email,
      new_mobile_public_to_club: mobilePublicToClub,
      new_email_public_to_club: emailPublicToClub,
    }
  );

  if (error) {
    throw error;
  }
}

export async function updateOwnPlayerAvatarUrl(
  avatarUrl: string
): Promise<void> {
  const { error } = await supabase.rpc(
    "update_own_player_avatar",
    {
      new_avatar_url: avatarUrl,
    }
  );

  if (error) {
    throw error;
  }
}

export async function deletePlayer(
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("players")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function linkPlayerToProfile(
  playerId: string,
  profileId: string | null
): Promise<void> {
  const { error } = await supabase
    .from("players")
    .update({
      profile_id: profileId,
    })
    .eq("id", playerId);

  if (error) {
    throw error;
  }
}
