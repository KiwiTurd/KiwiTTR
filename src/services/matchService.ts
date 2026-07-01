import type { Match } from "../types/match";

const STORAGE_KEY = "kiwittr_matches";

export function getMatches(): Match[] {
  const data = localStorage.getItem(STORAGE_KEY);

  return data ? JSON.parse(data) : [];
}

export function saveMatches(matches: Match[]) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(matches)
  );
}

export function addMatch(match: Match) {
  const matches = getMatches();

  matches.unshift(match);

  saveMatches(matches);
}

export function clearMatches() {
  saveMatches([]);
}