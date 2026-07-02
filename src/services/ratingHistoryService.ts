import type { RatingHistory } from "../types/ratingHistory";

const STORAGE_KEY = "kiwittr_rating_history";

export function getRatingHistory(): RatingHistory[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveRatingHistory(
  history: RatingHistory[]
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(history)
  );
}

export function addRatingHistory(
  record: RatingHistory
) {
  const history = getRatingHistory();

  history.unshift(record);

  saveRatingHistory(history);
}

export function getPlayerRatingHistory(
  playerId: string
) {
  return getRatingHistory().filter(
    (record) => record.playerId === playerId
  );
}

export function clearRatingHistory() {
  saveRatingHistory([]);
}