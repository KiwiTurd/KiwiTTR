import { supabase } from "../../lib/supabase";
import type { Profile } from "../../types/profile";

import {
  getPlayer,
  getPlayers,
  updatePlayer,
} from "./playerService";

type ProfileRow = {
  id: string;

  first_name: string | null;
  last_name: string | null;

  role: string;

  club_id: string | null;
  player_id: string | null;

  created_at: string;
};

function fromRow(row: ProfileRow): Profile {
  return {
    id: row.id,

    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",

    role: row.role as Profile["role"],

    clubId: row.club_id,
    playerId: row.player_id,

    createdAt: row.created_at,
  };
}

function toRow(profile: Profile) {
  return {
    id: profile.id,

    first_name: profile.firstName,
    last_name: profile.lastName,

    role: profile.role,

    club_id: profile.clubId,
    player_id: profile.playerId,
  };
}

export async function getProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("first_name");

  if (error) {
    throw error;
  }

  return (data as ProfileRow[]).map(fromRow);
}

export async function getProfile(
  id: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data
    ? fromRow(data as ProfileRow)
    : null;
}

export async function updateProfile(
  profile: Profile
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update(toRow(profile))
    .eq("id", profile.id);

  if (error) {
    throw error;
  }
}

export async function saveProfile(
  profile: Profile
): Promise<void> {

  const existing = await getProfile(profile.id);

  //
  // 1. Unlink this profile's old player
  //
  if (
    existing?.playerId &&
    existing.playerId !== profile.playerId
  ) {
    const oldPlayer = await getPlayer(
      existing.playerId
    );

    if (oldPlayer) {
      oldPlayer.profileId = null;
      await updatePlayer(oldPlayer);
    }
  }

  //
  // 2. Ensure no other profile is linked
  //    to the selected player
  //
  if (profile.playerId) {

    const { error: unlinkProfileError } =
      await supabase
        .from("profiles")
        .update({
          player_id: null,
        })
        .eq("player_id", profile.playerId)
        .neq("id", profile.id);

    if (unlinkProfileError) {
      throw unlinkProfileError;
    }

    //
    // 3. Remove the selected player from any
    //    other player's profile link
    //
    const players = await getPlayers();

    for (const player of players) {

      if (
        player.profileId &&
        player.profileId !== profile.id
      ) {
        if (player.id === profile.playerId) {
          player.profileId = null;
          await updatePlayer(player);
        }
      }

    }

    //
    // 4. Link the selected player
    //
    const newPlayer = await getPlayer(
      profile.playerId
    );

    if (newPlayer) {
      newPlayer.profileId = profile.id;
      await updatePlayer(newPlayer);
    }
  }

  //
  // 5. Save the profile
  //
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: profile.firstName,
      last_name: profile.lastName,

      role: profile.role,

      club_id: profile.clubId,
      player_id: profile.playerId,
    })
    .eq("id", profile.id);

  if (error) {
    throw error;
  }
}