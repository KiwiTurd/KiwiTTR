import { supabase } from "../../lib/supabase";
import type { Event } from "../../types/event";

type EventRow = {
  id: string;
  club_id: string;
  name: string;
  event_date: string;
  created_at: string;
};

function fromRow(row: EventRow): Event {
  return {
    id: row.id,
    clubId: row.club_id,
    name: row.name,
    date: row.event_date,
    createdAt: row.created_at,
  };
}

function toRow(event: Event) {
  return {
    id: event.id,
    club_id: event.clubId,
    name: event.name,
    event_date: event.date,
    created_at: event.createdAt ?? new Date().toISOString(),
  };
}

export async function getEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: false });

  if (error) {
    console.error(error);
    throw error;
  }

  return (data as EventRow[]).map(fromRow);
}

export async function getEvent(
  id: string
): Promise<Event | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(error);
    throw error;
  }

  return data ? fromRow(data as EventRow) : null;
}

export async function addEvent(event: Event) {
  const { error } = await supabase
    .from("events")
    .insert(toRow(event));

  if (error) {
    console.error(error);
    throw error;
  }
}

export async function updateEvent(event: Event) {
  const { error } = await supabase
    .from("events")
    .update(toRow(event))
    .eq("id", event.id);

  if (error) {
    console.error(error);
    throw error;
  }
}

export async function deleteEvent(id: string) {
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    throw error;
  }
}