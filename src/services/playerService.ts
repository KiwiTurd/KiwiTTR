import type { Player } from "../types/player";

const STORAGE_KEY = "kiwittr_players";

export function getPlayers(): Player[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function savePlayers(players: Player[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
}

export function addPlayer(player: Player) {
  const players = getPlayers();

  players.push(player);

  savePlayers(players);
}

export function updatePlayer(player: Player) {
  const players = getPlayers().map((p) =>
    p.id === player.id ? player : p
  );

  savePlayers(players);
}

export function deletePlayer(id: string) {
  const players = getPlayers().filter(
    (p) => p.id !== id
  );

  savePlayers(players);
}

export function getPlayer(id: string) {
  return getPlayers().find((p) => p.id === id);
}