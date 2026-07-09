import { supabase } from "../../lib/supabase";
import type { Club } from "../../types/club";

type ClubRow = {
  id: string;
  name: string;
  short_name: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  notice: string | null;
  header_image_url: string | null;
  created_at: string;
};

function fromRow(row: ClubRow): Club {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name ?? "",
    address: row.address ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    website: row.website ?? "",
    notice: row.notice ?? "",
    headerImageUrl: row.header_image_url ?? "",
    createdAt: row.created_at,
  };
}

function toRow(club: Club) {
  return {
    id: club.id,
    name: club.name,
    short_name: club.shortName,
    address: club.address,
    phone: club.phone,
    email: club.email,
    website: club.website,
    notice: club.notice,
    header_image_url: club.headerImageUrl,
    created_at: club.createdAt,
  };
}

export async function getClubs(): Promise<Club[]> {
  const { data, error } = await supabase
    .from("clubs")
    .select("*")
    .order("name");

  if (error) {
    console.error(error);
    throw error;
  }

  return (data as ClubRow[]).map(fromRow);
}

export async function getClub(id: string): Promise<Club | null> {
  const { data, error } = await supabase
    .from("clubs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(error);
    throw error;
  }

  if (!data) {
    return null;
  }

  return fromRow(data as ClubRow);
}

export async function addClub(club: Club) {
  const { error } = await supabase
    .from("clubs")
    .insert(toRow(club));

  if (error) {
    console.error(error);
    throw error;
  }
}

export async function updateClub(club: Club) {
  const { error } = await supabase
    .from("clubs")
    .update(toRow(club))
    .eq("id", club.id);

  if (error) {
    console.error(error);
    throw error;
  }
}

export async function deleteClub(id: string) {
  const { error } = await supabase
    .from("clubs")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    throw error;
  }
}
