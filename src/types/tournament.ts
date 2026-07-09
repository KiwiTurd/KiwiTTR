import type { Player } from "./player";

export interface TournamentSettings {
  name: string;

  eventDescription: string;

  clubId: string;

  date: string;

  signUpClosesAt: string | null;

  playerCount: number;

  playerLimitEnabled: boolean;

  format: "knockout" | "pools" | "doubles";

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

  round: number;

  position: number;

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

    signUpClosesAt: null,

    playerCount: 32,

    playerLimitEnabled: false,

    format: "pools",

    poolSize: 4,

    progressing: 2,

    seedByTTR: true,

    socialPlay: false,

    allowSignUp: false,

    ttrLimitEnabled: false,

    ttrLimit: 2000,
  },

  players: [],

  pools: [],

  matches: [],

  knockout: [],
};
