import type { Event } from "../types/event";

const STORAGE_KEY = "kiwittr_events";

export function getEvents(): Event[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveEvents(events: Event[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function addEvent(event: Event) {
  const events = getEvents();
  events.push(event);
  saveEvents(events);
}

export function deleteEvent(id: string) {
  const events = getEvents().filter((e) => e.id !== id);
  saveEvents(events);
}