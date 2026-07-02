import type { Club } from "../types/club";

const STORAGE_KEY = "kiwittr_clubs";

export function getClubs(): Club[] {
  const data = localStorage.getItem(STORAGE_KEY);

  if (!data) return [];

  return JSON.parse(data);
}

export function getClub(id: string): Club | undefined {
  return getClubs().find(
    (club) => club.id === id
  );
}

export function saveClubs(clubs: Club[]) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(clubs)
  );
}

export function addClub(club: Club) {
  const clubs = getClubs();

  clubs.push(club);

  saveClubs(clubs);
}

export function updateClub(club: Club) {
  const clubs = getClubs().map((c) =>
    c.id === club.id ? club : c
  );

  saveClubs(clubs);
}

export function deleteClub(id: string) {
  const clubs = getClubs().filter(
    (c) => c.id !== id
  );

  saveClubs(clubs);
}