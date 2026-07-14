import { supabase } from "../../lib/supabase";
import { buildMatch } from "../matchEngine";
import {
  removeRecordedTtrMatchesAndReplay,
  replayTtrMatchesFrom,
} from "../teams/teamSubmission";
import {
  getPlayer,
  updatePlayer,
} from "./playerService";
import { deleteEvent } from "./eventService";
import { addMatch } from "./matchService";
import { addRatingHistory } from "./ratingHistoryService";
import type { MatchSet } from "../../types/match";
import type { Player } from "../../types/player";
import type { RatingHistory } from "../../types/ratingHistory";
import type {
  KnockoutMatch,
  Pool,
  SavedTournament,
  TournamentMatch,
  TournamentState,
} from "../../types/tournament";
import { generatePoolMatches } from "../tournament/matchGenerator";

type TournamentRow = {
  id: string;
  club_id: string;
  name: string;
  event_description: string | null;
  tournament_date: string;
  start_time: string | null;
  signup_closes_at: string | null;
  player_count: number;
  player_limit_enabled: boolean;
  format: TournamentState["settings"]["format"];
  pool_size: number;
  progressing: number;
  seed_by_ttr: boolean;
  social_play: boolean;
  allow_sign_up: boolean;
  ttr_limit_enabled: boolean;
  ttr_limit: number | null;
  status: "draft" | "active" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
};

type TournamentPlayerRow = {
  id: string;
  tournament_id: string;
  app_player_id: string;
  player_id: string | null;
  profile_id: string | null;
  club_id: string;
  first_name: string;
  last_name: string;
  mobile: string;
  email: string;
  rating: number;
  highest_rating: number;
  wins: number;
  losses: number;
  matches_played: number;
  provisional_matches_remaining: number;
  rating_reliability: number;
  is_active: boolean;
  source_created_at: string | null;
  created_at: string;
};

type TournamentPoolRow = {
  id: string;
  tournament_id: string;
  app_pool_id: string;
  name: string;
  position: number;
};

type TournamentPoolPlayerRow = {
  id: string;
  pool_id: string;
  tournament_player_id: string;
  position: number;
};

type KnockoutRoundRow = {
  id: string;
  round_number: number;
  name: string;
  position: number;
};

type TournamentMatchRow = {
  id: string;
  tournament_id: string;
  app_match_id: string;
  stage: "pool" | "knockout";
  pool_id: string | null;
  knockout_round_id: string | null;
  player_one_id: string | null;
  player_two_id: string | null;
  winner_id: string | null;
  round_number: number | null;
  position: number | null;
  table_number: number | null;
  completed: boolean;
  bracket: "winners" | "losers" | "grand-final" | null;
  recorded_match_id: string | null;
};

type TournamentMatchSetRow = {
  tournament_match_id: string;
  set_number: number;
  raw_score: string;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function parsePairId(value: string) {
  const match = value.match(
    /^pair-([0-9a-f-]{36})-([0-9a-f-]{36})$/i
  );

  return match
    ? {
        playerOneId: match[1],
        playerTwoId: match[2],
      }
    : null;
}

function parseGameScore(game: string) {
  const match = game.match(/(\d+)\D+(\d+)/);

  return match
    ? {
        playerOneScore: Number(match[1]),
        playerTwoScore: Number(match[2]),
      }
    : {
        playerOneScore: null,
        playerTwoScore: null,
      };
}

function parseMatchSets(games: string[]): MatchSet[] {
  return games.map(game => {
    const parsed = parseGameScore(game);

    if (
      parsed.playerOneScore === null ||
      parsed.playerTwoScore === null
    ) {
      throw new Error(
        `Unable to read set score "${game}". Use scores like 11-8.`
      );
    }

    return {
      player1Score: parsed.playerOneScore,
      player2Score: parsed.playerTwoScore,
    };
  });
}

function roundName(round: number, maxRound: number) {
  if (round === maxRound) {
    return "Final";
  }

  if (round === maxRound - 1) {
    return "Semi Finals";
  }

  if (round === maxRound - 2) {
    return "Quarter Finals";
  }

  return `Round ${round}`;
}

function ensureCompleteKnockoutBracket(
  knockout: KnockoutMatch[],
  tournamentId: string
): KnockoutMatch[] {
  if (knockout.length === 0) return knockout;

  const firstRound = Math.min(...knockout.map(match => match.round));
  const firstRoundMatchCount = knockout.filter(
    match => match.round === firstRound
  ).length;

  if (firstRoundMatchCount < 2) return knockout;

  const expectedRoundCount = Math.ceil(
    Math.log2(firstRoundMatchCount * 2)
  );
  const completed = [...knockout];

  for (let offset = 0; offset < expectedRoundCount; offset += 1) {
    const round = firstRound + offset;
    const matchesInRound = Math.max(
      1,
      firstRoundMatchCount / Math.pow(2, offset)
    );

    for (let position = 1; position <= matchesInRound; position += 1) {
      if (completed.some(
        match => match.round === round && match.position === position
      )) continue;

      completed.push({
        id: `recovered-${tournamentId}-${round}-${position}`,
        round,
        position,
        playerOne: null,
        playerTwo: null,
        winnerId: null,
        completed: false,
        games: [],
      });
    }
  }

  return completed.sort((a, b) =>
    a.round === b.round
      ? a.position - b.position
      : a.round - b.round
  );
}

function fromTournamentRow(
  row: TournamentRow,
  details: {
    players: Player[];
    pools: Pool[];
    matches: TournamentMatch[];
    knockout: KnockoutMatch[];
  }
): SavedTournament {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
    settings: {
      name: row.name,
      eventDescription:
        row.event_description ?? "",
      clubId: row.club_id,
      date: row.tournament_date,
      startTime: row.start_time?.slice(0, 5) ?? "",
      signUpClosesAt:
        row.signup_closes_at ?? null,
      playerCount: row.player_count,
      playerLimitEnabled:
        row.player_limit_enabled ?? true,
      format: row.format,
      poolSize: row.pool_size,
      progressing: row.progressing,
      seedByTTR: row.seed_by_ttr,
      socialPlay: row.social_play,
      allowSignUp: row.allow_sign_up ?? false,
      ttrLimitEnabled:
        row.ttr_limit_enabled ?? false,
      ttrLimit: row.ttr_limit ?? 2000,
    },
    ...details,
    knockout:
      row.format === "double-knockout"
        ? details.knockout
        : ensureCompleteKnockoutBracket(
            details.knockout,
            row.id
          ),
  };
}

function toTournamentRow(tournament: TournamentState) {
  return {
    id: tournament.id || crypto.randomUUID(),
    club_id: tournament.settings.clubId,
    name: tournament.settings.name,
    event_description:
      tournament.settings.eventDescription,
    tournament_date: tournament.settings.date,
    start_time: tournament.settings.startTime || null,
    signup_closes_at:
      tournament.settings.signUpClosesAt,
    player_count: tournament.settings.playerCount,
    player_limit_enabled:
      tournament.settings.playerLimitEnabled,
    format: tournament.settings.format,
    pool_size: tournament.settings.poolSize,
    progressing: tournament.settings.progressing,
    seed_by_ttr: tournament.settings.seedByTTR,
    social_play: tournament.settings.socialPlay,
    allow_sign_up: tournament.settings.allowSignUp,
    ttr_limit_enabled:
      tournament.settings.ttrLimitEnabled,
    ttr_limit: tournament.settings.ttrLimitEnabled
      ? tournament.settings.ttrLimit
      : null,
    status:
      tournament.status === "completed" ||
      tournament.status === "cancelled" ||
      tournament.status === "active"
        ? tournament.status
        : tournament.knockout.some(match => match.winnerId)
          ? "active"
          : "draft",
  };
}

function playerFromRow(row: TournamentPlayerRow): Player {
  return {
    id: row.app_player_id,
    profileId: row.profile_id,
    firstName: row.first_name,
    lastName: row.last_name,
    mobile: row.mobile,
    email: row.email,
    mobilePublicToClub: false,
    emailPublicToClub: false,
    avatarUrl: "",
    clubId: row.club_id,
    rating: row.rating,
    highestRating: row.highest_rating,
    wins: row.wins,
    losses: row.losses,
    matchesPlayed: row.matches_played,
    provisionalMatchesRemaining:
      row.provisional_matches_remaining,
    ratingReliability: Number(row.rating_reliability),
    isActive: row.is_active,
    createdAt:
      row.source_created_at ?? row.created_at,
  };
}

function collectPlayers(
  tournament: TournamentState
) {
  const players = new Map<string, Player>();

  function add(player: Player | null | undefined) {
    if (player) {
      players.set(player.id, player);
    }
  }

  tournament.players.forEach(add);

  tournament.pools.forEach(pool => {
    pool.players.forEach(add);
  });

  tournament.matches.forEach(match => {
    add(match.playerOne);
    add(match.playerTwo);
  });

  tournament.knockout.forEach(match => {
    add(match.playerOne);
    add(match.playerTwo);
  });

  return [...players.values()];
}

function toTournamentPlayerInsert(
  tournamentId: string,
  player: Player,
  index: number
) {
  const pair = parsePairId(player.id);

  return {
    tournament_id: tournamentId,
    app_player_id: player.id,
    player_id: isUuid(player.id)
      ? player.id
      : null,
    profile_id: player.profileId,
    club_id: player.clubId,
    pair_player_one_id: pair?.playerOneId ?? null,
    pair_player_two_id: pair?.playerTwoId ?? null,
    first_name: player.firstName,
    last_name: player.lastName,
    mobile: player.mobile,
    email: player.email,
    rating: player.rating,
    highest_rating: player.highestRating,
    wins: player.wins,
    losses: player.losses,
    matches_played: player.matchesPlayed,
    provisional_matches_remaining:
      player.provisionalMatchesRemaining,
    rating_reliability: player.ratingReliability,
    is_active: player.isActive,
    seed_position: index + 1,
    is_pair: Boolean(pair),
    source_created_at: player.createdAt,
  };
}

async function throwIfError(
  result: { error: unknown }
) {
  if (result.error) {
    throw result.error;
  }
}

async function loadTournamentDetails(
  tournamentId: string
) {
  const [
    playerResult,
    poolResult,
    poolPlayerResult,
    roundResult,
    matchResult,
    setResult,
  ] = await Promise.all([
    supabase
      .from("tournament_players")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("seed_position"),
    supabase
      .from("tournament_pools")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("position"),
    supabase
      .from("tournament_pool_players")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("position"),
    supabase
      .from("knockout_rounds")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("round_number"),
    supabase
      .from("tournament_matches")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("position"),
    supabase
      .from("tournament_match_sets")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("set_number"),
  ]);

  await throwIfError(playerResult);
  await throwIfError(poolResult);
  await throwIfError(poolPlayerResult);
  await throwIfError(roundResult);
  await throwIfError(matchResult);
  await throwIfError(setResult);

  const playerRows =
    playerResult.data as TournamentPlayerRow[];
  const poolRows =
    poolResult.data as TournamentPoolRow[];
  const poolPlayerRows =
    poolPlayerResult.data as TournamentPoolPlayerRow[];
  const roundRows =
    roundResult.data as KnockoutRoundRow[];
  const matchRows =
    matchResult.data as TournamentMatchRow[];
  const setRows =
    setResult.data as TournamentMatchSetRow[];

  const playersByRowId = new Map(
    playerRows.map(row => [
      row.id,
      playerFromRow(row),
    ])
  );

  const poolsByRowId = new Map(
    poolRows.map(row => [
      row.id,
      row,
    ])
  );

  const roundsByRowId = new Map(
    roundRows.map(row => [
      row.id,
      row,
    ])
  );

  const gamesByMatchId = new Map<string, string[]>();

  setRows.forEach(row => {
    gamesByMatchId.set(
      row.tournament_match_id,
      [
        ...(gamesByMatchId.get(
          row.tournament_match_id
        ) ?? []),
        row.raw_score,
      ]
    );
  });

  const pools: Pool[] = poolRows.map(pool => {
    const players = poolPlayerRows
      .filter(row => row.pool_id === pool.id)
      .sort((a, b) => a.position - b.position)
      .map(row =>
        playersByRowId.get(row.tournament_player_id)
      )
      .filter(Boolean) as Player[];

    return {
      id: pool.app_pool_id,
      name: pool.name,
      players,
    };
  });

  let matches: TournamentMatch[] = matchRows
    .filter(row => row.stage === "pool")
    .map(row => {
      const playerOne =
        row.player_one_id
          ? playersByRowId.get(row.player_one_id)
          : undefined;
      const playerTwo =
        row.player_two_id
          ? playersByRowId.get(row.player_two_id)
          : undefined;

      if (!playerOne || !playerTwo) {
        return null;
      }

      return {
        id: row.app_match_id,
        stage: "pool",
        poolId: row.pool_id
          ? poolsByRowId.get(row.pool_id)?.app_pool_id
          : undefined,
        table: row.table_number ?? undefined,
        playerOne,
        playerTwo,
        winnerId: row.winner_id
          ? playersByRowId.get(row.winner_id)?.id
          : undefined,
        completed: row.completed,
        games: gamesByMatchId.get(row.id) ?? [],
      };
    })
    .filter(Boolean) as TournamentMatch[];

  if (matches.length === 0 && pools.length > 0) {
    matches = generatePoolMatches(pools);
  }

  const knockout: KnockoutMatch[] = matchRows
    .filter(row => row.stage === "knockout")
    .map(row => ({
      id: row.app_match_id,
      round:
        row.round_number ??
        (row.knockout_round_id
          ? roundsByRowId.get(row.knockout_round_id)
              ?.round_number
          : undefined) ??
        1,
      position: row.position ?? 1,
      table: row.table_number ?? undefined,
      bracket: row.bracket ?? undefined,
      playerOne: row.player_one_id
        ? playersByRowId.get(row.player_one_id) ?? null
        : null,
      playerTwo: row.player_two_id
        ? playersByRowId.get(row.player_two_id) ?? null
        : null,
      winnerId: row.winner_id
        ? playersByRowId.get(row.winner_id)?.id ?? null
        : null,
      completed: row.completed,
      games: gamesByMatchId.get(row.id) ?? [],
    }))
    .sort((a, b) =>
      a.round === b.round
        ? a.position - b.position
        : a.round - b.round
    );

  return {
    players: playerRows.map(playerFromRow),
    pools,
    matches,
    knockout,
  };
}

async function clearTournamentDetails(
  tournamentId: string
) {
  const tables = [
    "knockout_matches",
    "tournament_match_sets",
    "tournament_matches",
    "tournament_pool_players",
    "tournament_pools",
    "knockout_rounds",
    "tournament_players",
  ];

  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("tournament_id", tournamentId);

    if (error) {
      throw error;
    }
  }
}

export async function getTournaments(): Promise<
  SavedTournament[]
> {
  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .order("updated_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return Promise.all(
    (data as TournamentRow[]).map(async row =>
      fromTournamentRow(
        row,
        await loadTournamentDetails(row.id)
      )
    )
  );
}

export async function getTournament(
  id: string
): Promise<SavedTournament | null> {
  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return fromTournamentRow(
    data as TournamentRow,
    await loadTournamentDetails(id)
  );
}

export async function saveTournamentRecord(
  tournament: TournamentState
): Promise<SavedTournament> {
  const baseRow = toTournamentRow(tournament);
  const existingTournamentId = tournament.id;

  if (existingTournamentId) {
    const removedRatings =
      await removeTournamentRecordedRatings(
        existingTournamentId
      );

    if (
      removedRatings > 0 &&
      baseRow.status === "completed"
    ) {
      baseRow.status = "active";
    }
  }

  const { data, error } = await supabase
    .from("tournaments")
    .upsert(baseRow)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  const savedTournamentRow =
    data as TournamentRow;
  const tournamentId =
    savedTournamentRow.id;

  await clearTournamentDetails(tournamentId);

  const tournamentPlayers =
    collectPlayers(tournament);
  const playerRows = tournamentPlayers.map(
    (player, index) =>
      toTournamentPlayerInsert(
        tournamentId,
        player,
        index
      )
  );

  const savedPlayerRows =
    playerRows.length > 0
      ? await supabase
          .from("tournament_players")
          .insert(playerRows)
          .select("*")
      : {
          data: [],
          error: null,
        };

  await throwIfError(savedPlayerRows);

  const playerRowByAppId = new Map(
    (
      savedPlayerRows.data as TournamentPlayerRow[]
    ).map(row => [
      row.app_player_id,
      row,
    ])
  );

  const savedPools =
    tournament.pools.length > 0
      ? await supabase
          .from("tournament_pools")
          .insert(
            tournament.pools.map((pool, index) => ({
              tournament_id: tournamentId,
              app_pool_id: pool.id,
              name: pool.name,
              position: index + 1,
            }))
          )
          .select("*")
      : {
          data: [],
          error: null,
        };

  await throwIfError(savedPools);

  const poolRowByAppId = new Map(
    (savedPools.data as TournamentPoolRow[]).map(
      row => [
        row.app_pool_id,
        row,
      ]
    )
  );

  const poolPlayerRows = tournament.pools.flatMap(
    pool =>
      pool.players.map((player, index) => ({
        tournament_id: tournamentId,
        pool_id: poolRowByAppId.get(pool.id)?.id,
        tournament_player_id:
          playerRowByAppId.get(player.id)?.id,
        position: index + 1,
      }))
  ).filter(
    row => row.pool_id && row.tournament_player_id
  );

  if (poolPlayerRows.length > 0) {
    await throwIfError(
      await supabase
        .from("tournament_pool_players")
        .insert(poolPlayerRows)
    );
  }

  const knockoutRoundNumbers = [
    ...new Set(
      tournament.knockout.map(match => match.round)
    ),
  ].sort((a, b) => a - b);
  const maxRound = Math.max(
    0,
    ...knockoutRoundNumbers
  );

  const savedRounds =
    knockoutRoundNumbers.length > 0
      ? await supabase
          .from("knockout_rounds")
          .insert(
            knockoutRoundNumbers.map((round, index) => ({
              tournament_id: tournamentId,
              round_number: round,
              name: roundName(round, maxRound),
              position: index + 1,
            }))
          )
          .select("*")
      : {
          data: [],
          error: null,
        };

  await throwIfError(savedRounds);

  const roundRowByNumber = new Map(
    (savedRounds.data as KnockoutRoundRow[]).map(
      row => [
        row.round_number,
        row,
      ]
    )
  );

  const poolMatchRows = tournament.matches.map(
    (match, index) => ({
      tournament_id: tournamentId,
      app_match_id: match.id,
      stage: "pool",
      pool_id: match.poolId
        ? poolRowByAppId.get(match.poolId)?.id
        : null,
      knockout_round_id: null,
      player_one_id:
        playerRowByAppId.get(match.playerOne.id)?.id,
      player_two_id:
        playerRowByAppId.get(match.playerTwo.id)?.id,
      winner_id: match.winnerId
        ? playerRowByAppId.get(match.winnerId)?.id
        : null,
      round_number: null,
      position: index + 1,
      table_number: match.table ?? null,
      completed: match.completed,
      completed_at: match.completed
        ? new Date().toISOString()
        : null,
    })
  );

  const knockoutMatchRows = tournament.knockout.map(
    match => ({
      tournament_id: tournamentId,
      app_match_id: match.id,
      stage: "knockout",
      pool_id: null,
      knockout_round_id:
        roundRowByNumber.get(match.round)?.id,
      player_one_id: match.playerOne
        ? playerRowByAppId.get(match.playerOne.id)?.id
        : null,
      player_two_id: match.playerTwo
        ? playerRowByAppId.get(match.playerTwo.id)?.id
        : null,
      winner_id: match.winnerId
        ? playerRowByAppId.get(match.winnerId)?.id
        : null,
      round_number: match.round,
      position: match.position,
      table_number: match.table ?? null,
      completed: match.completed,
      ...(match.bracket ? { bracket: match.bracket } : {}),
      completed_at: match.completed
        ? new Date().toISOString()
        : null,
    })
  );

  const allMatchRows = [
    ...poolMatchRows,
    ...knockoutMatchRows,
  ];

  const savedMatches =
    allMatchRows.length > 0
      ? await supabase
          .from("tournament_matches")
          .insert(allMatchRows)
          .select("*")
      : {
          data: [],
          error: null,
        };

  await throwIfError(savedMatches);

  const matchRowByAppId = new Map(
    (
      savedMatches.data as TournamentMatchRow[]
    ).map(row => [
      row.app_match_id,
      row,
    ])
  );

  const setRows = [
    ...tournament.matches,
    ...tournament.knockout,
  ].flatMap(match => {
    const savedMatch =
      matchRowByAppId.get(match.id);

    if (!savedMatch) {
      return [];
    }

    return match.games.map((game, index) => {
      const parsed = parseGameScore(game);

      return {
        tournament_id: tournamentId,
        tournament_match_id: savedMatch.id,
        set_number: index + 1,
        raw_score: game,
        player_one_score: parsed.playerOneScore,
        player_two_score: parsed.playerTwoScore,
      };
    });
  });

  if (setRows.length > 0) {
    await throwIfError(
      await supabase
        .from("tournament_match_sets")
        .insert(setRows)
    );
  }

  const knockoutRows = tournament.knockout.flatMap(
    match => {
      const savedMatch =
        matchRowByAppId.get(match.id);
      const savedRound =
        roundRowByNumber.get(match.round);

      if (!savedMatch || !savedRound) {
        return [];
      }

      const nextMatch =
        tournament.knockout.find(
          candidate =>
            candidate.round === match.round + 1 &&
            candidate.position ===
              Math.ceil(match.position / 2)
        );

      return [{
        tournament_id: tournamentId,
        tournament_match_id: savedMatch.id,
        knockout_round_id: savedRound.id,
        position: match.position,
        next_tournament_match_id: nextMatch
          ? matchRowByAppId.get(nextMatch.id)?.id ?? null
          : null,
        next_slot: nextMatch
          ? match.position % 2 === 1
            ? "player_one"
            : "player_two"
          : null,
      }];
    }
  );

  if (knockoutRows.length > 0) {
    await throwIfError(
      await supabase
        .from("knockout_matches")
        .insert(knockoutRows)
    );
  }

  return fromTournamentRow(
    savedTournamentRow,
    await loadTournamentDetails(tournamentId)
  );
}

export async function updateTournamentMetadata(
  tournament: SavedTournament
): Promise<SavedTournament> {
  if (
    tournament.status === "completed" ||
    tournament.status === "cancelled"
  ) {
    throw new Error(
      "Finished or cancelled tournaments cannot be edited."
    );
  }

  const { error } = await supabase
    .from("tournaments")
    .update({
      club_id: tournament.settings.clubId,
      name: tournament.settings.name,
      event_description:
        tournament.settings.eventDescription,
      tournament_date: tournament.settings.date,
      start_time: tournament.settings.startTime || null,
      signup_closes_at:
        tournament.settings.signUpClosesAt,
      player_count: tournament.settings.playerCount,
      player_limit_enabled:
        tournament.settings.playerLimitEnabled,
      format: tournament.settings.format,
      pool_size: tournament.settings.poolSize,
      progressing: tournament.settings.progressing,
      seed_by_ttr: tournament.settings.seedByTTR,
      social_play: tournament.settings.socialPlay,
      allow_sign_up:
        tournament.settings.allowSignUp,
      ttr_limit_enabled:
        tournament.settings.ttrLimitEnabled,
      ttr_limit: tournament.settings.ttrLimitEnabled
        ? tournament.settings.ttrLimit
        : null,
    })
    .eq("id", tournament.id)
    .not("status", "in", "(completed,cancelled)");

  if (error) {
    throw error;
  }

  const saved = await getTournament(tournament.id);

  if (!saved) {
    throw new Error("Tournament not found.");
  }

  return saved;
}

export async function cancelTournament(
  tournamentId: string
): Promise<SavedTournament> {
  await removeTournamentRecordedRatings(
    tournamentId
  );

  const { error } = await supabase
    .from("tournaments")
    .update({
      status: "cancelled",
      allow_sign_up: false,
    })
    .eq("id", tournamentId)
    .not("status", "eq", "cancelled");

  if (error) {
    throw error;
  }

  const saved = await getTournament(tournamentId);

  if (!saved) {
    throw new Error("Tournament not found.");
  }

  return saved;
}

export async function deleteTournament(
  tournamentId: string
) {
  await removeTournamentRecordedRatings(
    tournamentId
  );

  const { error } = await supabase
    .from("tournaments")
    .delete()
    .eq("id", tournamentId);

  if (error) {
    throw error;
  }

  await deleteEvent(tournamentId);
}

export async function signUpForTournament(
  tournamentId: string,
  playerId: string
): Promise<SavedTournament> {
  const tournament =
    await getTournament(tournamentId);

  if (!tournament) {
    throw new Error("Tournament not found.");
  }

  if (!tournament.settings.allowSignUp) {
    throw new Error(
      "This tournament is not open for sign ups."
    );
  }

  if (
    tournament.status === "completed" ||
    tournament.status === "cancelled"
  ) {
    throw new Error(
      "This tournament is not open for sign ups."
    );
  }

  if (
    tournament.settings.signUpClosesAt &&
    new Date(tournament.settings.signUpClosesAt) <
      new Date(new Date().toISOString().slice(0, 10))
  ) {
    throw new Error(
      "Sign ups have closed for this tournament."
    );
  }

  if (
    tournament.pools.length > 0 ||
    tournament.matches.length > 0 ||
    tournament.knockout.length > 0
  ) {
    throw new Error(
      "Sign ups are closed once the draw has been built."
    );
  }

  if (
    tournament.players.some(
      player => player.id === playerId
    )
  ) {
    return tournament;
  }

  if (
    tournament.settings.playerLimitEnabled &&
    tournament.players.length >=
    tournament.settings.playerCount
  ) {
    throw new Error("This tournament is full.");
  }

  const player = await getPlayer(playerId);

  if (!player) {
    throw new Error(
      "Linked player account was not found."
    );
  }

  if (
    tournament.settings.ttrLimitEnabled &&
    player.rating > tournament.settings.ttrLimit
  ) {
    throw new Error(
      "Your TTR is above this tournament limit."
    );
  }

  await throwIfError(
    await supabase
      .from("tournament_players")
      .insert(
        toTournamentPlayerInsert(
          tournament.id,
          player,
          tournament.players.length
        )
      )
  );

  const saved = await getTournament(tournamentId);

  if (!saved) {
    throw new Error("Tournament not found.");
  }

  return saved;
}

async function ensureTournamentEvent(
  tournament: TournamentRow
) {
  const { error } = await supabase
    .from("events")
    .upsert({
      id: tournament.id,
      club_id: tournament.club_id,
      name: tournament.name,
      event_date: tournament.tournament_date,
      created_at: tournament.created_at,
    });

  if (error) {
    throw error;
  }

  return tournament.id;
}

async function insertNormalMatchSets(
  matchId: string,
  sets: MatchSet[]
) {
  if (sets.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("match_sets")
    .insert(
      sets.map((set, index) => ({
        match_id: matchId,
        set_number: index + 1,
        player1_score: set.player1Score,
        player2_score: set.player2Score,
      }))
    );

  if (error) {
    throw error;
  }
}

function tournamentMatchPlayedAt(
  tournament: TournamentRow,
  match: TournamentMatchRow,
  index: number
) {
  const date = new Date(
    `${tournament.tournament_date}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  const stageOffset =
    match.stage === "knockout" ? 5000 : 0;
  const roundOffset =
    (match.round_number ?? 0) * 1000;
  const positionOffset =
    match.position ?? index + 1;

  date.setMilliseconds(
    stageOffset + roundOffset + positionOffset
  );

  return date.toISOString();
}

async function getRecordedTournamentMatchIds(
  tournamentId: string
) {
  const { data, error } = await supabase
    .from("tournament_matches")
    .select("recorded_match_id")
    .eq("tournament_id", tournamentId)
    .not("recorded_match_id", "is", null);

  if (error) {
    throw error;
  }

  return (data as Array<{
    recorded_match_id: string | null;
  }>)
    .map(row => row.recorded_match_id)
    .filter(Boolean) as string[];
}

async function removeTournamentRecordedRatings(
  tournamentId: string
) {
  const recordedMatchIds =
    await getRecordedTournamentMatchIds(
      tournamentId
    );

  await removeRecordedTtrMatchesAndReplay(
    recordedMatchIds
  );

  return recordedMatchIds.length;
}

async function addRatingHistoryRows(
  result: ReturnType<typeof buildMatch>
) {
  const winnerHistory: RatingHistory = {
    id: crypto.randomUUID(),
    playerId: result.winner.id,
    matchId: result.match.id,
    ratingBefore: result.match.winnerRatingBefore,
    ratingAfter: result.match.winnerRatingAfter,
    ratingChange: result.match.winnerRatingChange,
    recordedAt: result.match.playedAt,
  };

  const loserHistory: RatingHistory = {
    id: crypto.randomUUID(),
    playerId: result.loser.id,
    matchId: result.match.id,
    ratingBefore: result.match.loserRatingBefore,
    ratingAfter: result.match.loserRatingAfter,
    ratingChange: result.match.loserRatingChange,
    recordedAt: result.match.playedAt,
  };

  await addRatingHistory(winnerHistory);
  await addRatingHistory(loserHistory);
}

export async function finishTournamentAndRecordRatings(
  tournamentId: string
) {
  const { data: tournamentData, error: tournamentError } =
    await supabase
      .from("tournaments")
      .select("*")
      .eq("id", tournamentId)
      .maybeSingle();

  if (tournamentError) {
    throw tournamentError;
  }

  if (!tournamentData) {
    throw new Error("Tournament not found.");
  }

  const tournament = tournamentData as TournamentRow;

  if (tournament.status === "completed") {
    return;
  }

  if (tournament.social_play || tournament.format === "doubles") {
    await throwIfError(
      await supabase
        .from("tournaments")
        .update({
          status: "completed",
        })
        .eq("id", tournamentId)
    );

    return;
  }

  const { data: matchData, error: matchError } =
    await supabase
      .from("tournament_matches")
      .select("*")
      .eq("tournament_id", tournamentId)
      .eq("completed", true)
      .is("recorded_match_id", null)
      .order("created_at");

  if (matchError) {
    throw matchError;
  }

  const matchesToRecord =
    matchData as TournamentMatchRow[];

  const details =
    await loadTournamentDetails(tournamentId);
  const totalMatches =
    details.matches.length + details.knockout.length;
  const completedMatches = [
    ...details.matches,
    ...details.knockout,
  ].filter(match => match.completed).length;

  if (
    totalMatches === 0 ||
    completedMatches < totalMatches
  ) {
    throw new Error(
      "Tournament must be fully completed before ratings are updated."
    );
  }

  const eventId =
    await ensureTournamentEvent(tournament);
  const recordedPlayedAt: string[] = [];

  for (const [
    index,
    tournamentMatch,
  ] of matchesToRecord.entries()) {
    if (
      !tournamentMatch.player_one_id ||
      !tournamentMatch.player_two_id
    ) {
      continue;
    }

    const [
      playerOneLink,
      playerTwoLink,
      setResult,
    ] = await Promise.all([
      supabase
        .from("tournament_players")
        .select("player_id")
        .eq("id", tournamentMatch.player_one_id)
        .single(),
      supabase
        .from("tournament_players")
        .select("player_id")
        .eq("id", tournamentMatch.player_two_id)
        .single(),
      supabase
        .from("tournament_match_sets")
        .select("*")
        .eq("tournament_match_id", tournamentMatch.id)
        .order("set_number"),
    ]);

    await throwIfError(playerOneLink);
    await throwIfError(playerTwoLink);
    await throwIfError(setResult);

    const playerOneId =
      playerOneLink.data?.player_id;
    const playerTwoId =
      playerTwoLink.data?.player_id;

    if (!playerOneId || !playerTwoId) {
      throw new Error(
        "Only real player matches can update ratings."
      );
    }

    const playerOne = await getPlayer(playerOneId);
    const playerTwo = await getPlayer(playerTwoId);

    if (!playerOne || !playerTwo) {
      throw new Error("Players not found.");
    }

    const sets = parseMatchSets(
      (setResult.data as TournamentMatchSetRow[])
        .map(row => row.raw_score)
    );

    if (sets.length === 0) {
      throw new Error(
        "Every tournament match needs set scores before ratings are updated."
      );
    }

    const result = buildMatch(
      eventId,
      playerOne,
      playerTwo,
      sets
    );
    result.match.playedAt =
      tournamentMatchPlayedAt(
        tournament,
        tournamentMatch,
        index
      );

    const selectedWinnerId =
      tournamentMatch.winner_id === tournamentMatch.player_one_id
        ? playerOneId
        : tournamentMatch.winner_id === tournamentMatch.player_two_id
          ? playerTwoId
          : null;

    if (
      selectedWinnerId &&
      result.match.winnerId !== selectedWinnerId
    ) {
      throw new Error(
        "A tournament match winner does not match the entered set scores."
      );
    }

    await updatePlayer(result.winner);
    await updatePlayer(result.loser);
    await addMatch(result.match);
    await insertNormalMatchSets(
      result.match.id,
      sets
    );
    await addRatingHistoryRows(result);
    recordedPlayedAt.push(result.match.playedAt);

    await throwIfError(
      await supabase
        .from("tournament_matches")
        .update({
          recorded_match_id: result.match.id,
        })
        .eq("id", tournamentMatch.id)
    );
  }

  if (recordedPlayedAt.length > 0) {
    await replayTtrMatchesFrom(
      recordedPlayedAt.sort()[0]
    );
  }

  await throwIfError(
    await supabase
      .from("tournaments")
      .update({
        status: "completed",
      })
      .eq("id", tournamentId)
  );
}
