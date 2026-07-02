import { supabase } from "../../lib/supabase";

export type UserProfile = {
  id: string;
  role: "admin" | "club_leader" | "player";
  first_name: string | null;
  last_name: string | null;
  club_id: string | null;
  player_id: string | null;
  created_at: string;
};

export async function getUsers(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) throw error;

  return data as UserProfile[];
}

export async function updateUser(
  id: string,
  updates: Partial<UserProfile>
) {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
}