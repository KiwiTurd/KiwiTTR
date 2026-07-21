import type { Player } from "./player";

export type TournamentFormat =
  | "knockout"
  | "double-knockout"
  | "pools"
  | "pool-ratings"
  | "doubles"
  | "doubles-double-knockout";

export function isDoublesTournamentFormat(
  format: TournamentFormat
) {
  return format === "doubles" || format === "doubles-double-knockout";
}

export function isDoubleKnockoutTournamentFormat(
  format: TournamentFormat
) {
  return format === "double-knockout" || format === "doubles-double-knockout";
}

export interface TournamentSettings {
  eventType?: "tournament" | "club-round-robin";

  roundRobinCount?: number;

  name: string;

  eventDescription: string;

  clubId: string;

  date: string;

  startTime: string;

  signUpClosesAt: string | null;

  ageLimit: number | null;

  ageMinimum: number | null;

  gender: "open" | "female" | "male";

  playerCount: number;

  playerLimitEnabled: boolean;

  format: TournamentFormat;

  poolSize: number;

  progressing: number;

  seedByTTR: boolean;

  socialPlay: boolean;

  allowSignUp: boolean;

  ttrLimitEnabled: boolean;

  ttrLimit: number;
}

export interface Pool {
  id: string;

  name: string;

  players: Player[];
}

export interface TournamentMatch {

  id: string;

  stage:
    | "pool"
    | "knockout";

  poolId?: string;

  matchType?: "singles" | "doubles";

  countsForTTR?: boolean;

  isAdditional?: boolean;

  round?: string;

  table?: number;

  playerOne: Player;

  playerTwo: Player;

  winnerId?: string;

  completed: boolean;

  games: string[];

}

export interface PoolStanding {

  player: Player;

  wins: number;

  losses: number;

  gamesWon: number;

  gamesLost: number;

  points: number;

  position: number;

}

export interface TournamentDraw {

  pools: Pool[];

  matches: TournamentMatch[];

}

export interface KnockoutMatch {
  id: string;

  table?: number;

  round: number;

  position: number;

  bracket?: "winners" | "losers" | "grand-final";

  playerOne: Player | null;

  playerTwo: Player | null;

  winnerId: string | null;

  completed: boolean;

  games: string[];
}

export interface TournamentState {
  id: string;

  createdAt?: string;

  updatedAt?: string;

  status?: "draft" | "active" | "completed" | "cancelled";

  settings: TournamentSettings;

  players: Player[];

  pools: Pool[];

  matches: TournamentMatch[];

  knockout: KnockoutMatch[];
}

export type SavedTournament =
  TournamentState & {
    id: string;
    createdAt: string;
    updatedAt: string;
  };

export const defaultTournament: TournamentState = {
  id: "",

  settings: {
    name: "",

    eventDescription: "",

    clubId: "",

    date: "",

    startTime: "",

    signUpClosesAt: null,

    ageLimit: null,

    ageMinimum: null,

    gender: "open",

    playerCount: 32,

    playerLimitEnabled: false,

    format: "pools",

    poolSize: 4,

    progressing: 2,

    seedByTTR: true,

    socialPlay: false,

    allowSignUp: true,

    ttrLimitEnabled: false,

    ttrLimit: 2000,
  },

  players: [],

  pools: [],

  matches: [],

  knockout: [],
};
