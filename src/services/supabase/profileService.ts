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

  email: string | null;

  role: string;
  status: string;

  club_id: string | null;
  player_id: string | null;

  created_at: string;
};

const PROFILE_COLUMNS =
  "id, first_name, last_name, email, role, status, club_id, player_id, created_at";

function normalizeRole(
  role: string
): Profile["role"] {
  if (
    role === "admin" ||
    role === "club_admin" ||
    role === "player"
  ) {
    return role;
  }

  return "player";
}

function fromRow(row: ProfileRow): Profile {
  return {
    id: row.id,

    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",

    email: row.email ?? "",

    role: normalizeRole(row.role),
    status: row.status as Profile["status"],

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

    email: profile.email,

    role: profile.role,
    status: profile.status,

    club_id: profile.clubId,
    player_id: profile.playerId,
  };
}

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

function profileMatchesPlayerName(
  profile: Profile,
  player: Awaited<ReturnType<typeof getPlayer>>
) {
  if (!player) {
    return true;
  }

  return (
    normalizeName(profile.firstName) ===
      normalizeName(player.firstName) &&
    normalizeName(profile.lastName) ===
      normalizeName(player.lastName)
  );
}

export async function getProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
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
    .select(PROFILE_COLUMNS)
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

  const selectedPlayer = profile.playerId
    ? await getPlayer(profile.playerId)
    : null;

  if (
    profile.playerId &&
    !profileMatchesPlayerName(
      profile,
      selectedPlayer
    )
  ) {
    throw new Error(
      "A profile can only be linked to a player with the same first and last name."
    );
  }

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
    if (selectedPlayer) {
      selectedPlayer.profileId = profile.id;
      await updatePlayer(selectedPlayer);
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

      email: profile.email,

      role: profile.role,
      status: profile.status,

      club_id: profile.clubId,
      player_id: profile.playerId,
    })
    .eq("id", profile.id);

  if (error) {
    throw error;
  }
}
export async function setProfileStatus(
  profileId: string,
  status: Profile["status"]
): Promise<void> {

  console.log("Updating profile ID:", profileId);

  const { data: row } = await supabase
    .from("profiles")
    .select("id, first_name, status")
    .eq("id", profileId);

  console.log("Row before update:", row);

  const { data, error } = await supabase
    .from("profiles")
    .update({
      status,
    })
    .eq("id", profileId)
    .select();

  console.log("Update result:", data);
  console.log("Update error:", error);

  if (error) {
    throw error;
  }
}
