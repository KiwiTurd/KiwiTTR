import { supabase } from "../../lib/supabase";
import type { TeamGameStatus } from "./teamEngine";
import {
  classicTeamTargetScore,
  type Classic6Game,
  type Classic6Match,
  type Classic6Player,
  type Classic6Team,
  type CustomTeamSettings,
} from "./teamEngine";

type TeamGameRow = {
  id: string;
  event_id: string | null;
  home_club_id: string;
  away_club_id: string;
  location_club_id: string | null;
  name: string;
  event_description: string;
  game_date: string;
  start_time: string | null;
  format: Classic6Game["format"];
  status: "draft" | "live" | "submitted" | "completed" | "cancelled";
  target_score: number;
  players_per_team: number;
  ordering: CustomTeamSettings["ordering"];
  event_level: CustomTeamSettings["eventLevel"];
  match_mode: "first-to" | CustomTeamSettings["matchMode"];
  total_games: number;
  doubles_included: boolean;
  settings: Record<string, unknown>;
  home_confirmed: boolean;
  away_confirmed: boolean;
  submitted: boolean;
};

type TeamGamePlayerRow = {
  id: string;
  team_game_id: string;
  app_player_id: string;
  player_id: string | null;
  profile_id: string | null;
  club_id: string;
  side: "home" | "away";
  position: number;
  slot_label: string;
  first_name: string;
  last_name: string;
  rating: number;
  highest_rating: number;
  wins: number;
  losses: number;
  matches_played: number;
  provisional_matches_remaining: number;
  rating_reliability: number;
  is_active: boolean;
  is_club_sub: boolean;
  source_created_at: string | null;
};

type TeamGameDoublesPairRow = {
  team_game_id: string;
  side: "home" | "away";
  pair_number: number;
  player_one_id: string | null;
  player_two_id: string | null;
  label: string;
};

type TeamGameMatchRow = {
  id: string;
  team_game_id: string;
  app_match_id: string;
  order_number: number;
  phase: Classic6Match["phase"];
  label: string;
  status: Classic6Match["status"];
  winner_side: Classic6Match["winner"];
  counts_for_ttr: boolean;
  counts_for_team_score: boolean;
  recorded_match_id: string | null;
};

type TeamGameMatchPlayerRow = {
  team_game_match_id: string;
  team_game_player_id: string;
  side: "home" | "away";
  position: number;
};

type TeamGameMatchSetRow = {
  team_game_match_id: string;
  set_number: number;
  raw_score: string;
  home_score: number;
  away_score: number;
};

type TeamGameSummary = {
  id: string;
  name: string;
  clubName: string;
  date: string;
  status: TeamGameStatus;
  format: Classic6Game["format"];
  matchesPlayed: number;
  totalMatches: number;
};

type JoinedClubRow = TeamGameRow & {
  home_club?: { name: string | null } | null;
  away_club?: { name: string | null } | null;
  location_club?: { name: string | null } | null;
};

async function throwIfError(result: {
  error: unknown;
}) {
  if (result.error) {
    throw result.error;
  }
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  const firstName = parts.shift() ?? "";

  return {
    firstName,
    lastName: parts.join(" "),
  };
}

function playerToInsert(
  teamGameId: string,
  player: Classic6Player,
  side: "home" | "away",
  sideClubId: string,
  position: number
) {
  const { firstName, lastName } = splitName(
    player.name
  );

  return {
    team_game_id: teamGameId,
    app_player_id: player.id,
    player_id: player.id,
    profile_id: null,
    club_id: player.clubId,
    side,
    position,
    slot_label: String(position),
    first_name: firstName || player.name,
    last_name: lastName,
    rating: player.rating,
    highest_rating: player.rating,
    wins: 0,
    losses: 0,
    matches_played: 0,
    provisional_matches_remaining: 0,
    rating_reliability: 0,
    is_active: true,
    is_club_sub: player.clubId !== sideClubId,
    source_created_at: null,
  };
}

function toTeamGameRow(game: Classic6Game) {
  const settings = game.customSettings ?? {};
  const playerCount =
    game.customSettings?.playersPerTeam ??
    game.home.players.length;

  return {
    id: game.id,
    event_id: game.eventId ?? null,
    home_club_id: game.home.clubId,
    away_club_id: game.away.clubId,
    location_club_id:
      game.locationClubId ?? game.home.clubId,
    name: game.name,
    event_description: game.description ?? "",
    game_date: game.date,
    start_time: game.startTime || null,
    format: game.format ?? "classic-6",
    status: game.status,
    target_score: classicTeamTargetScore(
      game.format ?? "classic-6",
      game.customSettings
    ),
    players_per_team: playerCount,
    ordering:
      game.customSettings?.ordering ?? "ttr-auto",
    event_level:
      game.customSettings?.eventLevel ?? "ttr",
    match_mode:
      game.customSettings?.matchMode ??
      (game.format === "abc-123"
        ? "play-through"
        : "first-to"),
    total_games: game.matches.length,
    doubles_included:
      game.matches.some(
        (match) => match.phase === "doubles"
      ) || Boolean(game.customSettings?.doublesIncluded),
    settings,
    home_confirmed: game.homeConfirmed,
    away_confirmed: game.awayConfirmed,
    submitted: game.submitted,
    submitted_at: game.submitted
      ? new Date().toISOString()
      : null,
  };
}

function rowStatus(
  row: Pick<TeamGameRow, "status" | "submitted">
): Classic6Game["status"] {
  if (row.submitted || row.status === "submitted") {
    return "submitted";
  }

  return row.status === "live" ? "live" : "draft";
}

function summaryStatus(row: TeamGameRow): TeamGameStatus {
  if (row.status === "submitted" || row.status === "completed") {
    return "completed";
  }

  if (row.status === "live") {
    return "live";
  }

  return row.game_date >= new Date().toISOString().slice(0, 10)
    ? "upcoming"
    : "draft";
}

function rowToPlayer(
  row: TeamGamePlayerRow,
  clubName: string
): Classic6Player {
  return {
    id: row.app_player_id,
    name: `${row.first_name} ${row.last_name}`.trim(),
    rating: row.rating,
    clubId: row.club_id,
    clubName,
  };
}

function rowsToDoubles(
  side: "home" | "away",
  pairRows: TeamGameDoublesPairRow[],
  playerRowsByDbId: Map<string, TeamGamePlayerRow>
): Classic6Team["doubles"] {
  const pairs: Classic6Team["doubles"] = [
    ["", ""],
    ["", ""],
    ["", ""],
  ];

  pairRows
    .filter((row) => row.side === side)
    .forEach((row) => {
      const index = row.pair_number - 1;

      if (index < 0 || index > 2) {
        return;
      }

      pairs[index] = [
        row.player_one_id
          ? playerRowsByDbId.get(row.player_one_id)
              ?.app_player_id ?? ""
          : "",
        row.player_two_id
          ? playerRowsByDbId.get(row.player_two_id)
              ?.app_player_id ?? ""
          : "",
      ];
    });

  return pairs;
}

async function clearTeamGameDetails(teamGameId: string) {
  const tables = [
    "team_game_confirmations",
    "team_game_match_sets",
    "team_game_match_players",
    "team_game_matches",
    "team_game_doubles_pairs",
    "team_game_players",
  ];

  for (const table of tables) {
    await throwIfError(
      await supabase
        .from(table)
        .delete()
        .eq("team_game_id", teamGameId)
    );
  }
}

export async function saveTeamGame(
  game: Classic6Game
): Promise<Classic6Game> {
  const { data, error } = await supabase
    .from("team_games")
    .upsert(toTeamGameRow(game))
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  const savedGameId = (data as TeamGameRow).id;

  await clearTeamGameDetails(savedGameId);

  const playerRows = [
    ...game.home.players.map((player, index) =>
      playerToInsert(
        savedGameId,
        player,
        "home",
        game.home.clubId,
        index + 1
      )
    ),
    ...game.away.players.map((player, index) =>
      playerToInsert(
        savedGameId,
        player,
        "away",
        game.away.clubId,
        index + 1
      )
    ),
  ];

  const savedPlayers =
    playerRows.length > 0
      ? await supabase
          .from("team_game_players")
          .insert(playerRows)
          .select("*")
      : { data: [], error: null };

  await throwIfError(savedPlayers);

  const playerRowByAppKey = new Map(
    (savedPlayers.data as TeamGamePlayerRow[]).map(
      (row) => [`${row.side}:${row.app_player_id}`, row]
    )
  );

  const doublesRows = [
    ...game.home.doubles.map((pair, index) => ({
      team_game_id: savedGameId,
      side: "home" as const,
      pair_number: index + 1,
      player_one_id:
        playerRowByAppKey.get(`home:${pair[0]}`)?.id ??
        null,
      player_two_id:
        playerRowByAppKey.get(`home:${pair[1]}`)?.id ??
        null,
      label: `D${index + 1}`,
    })),
    ...game.away.doubles.map((pair, index) => ({
      team_game_id: savedGameId,
      side: "away" as const,
      pair_number: index + 1,
      player_one_id:
        playerRowByAppKey.get(`away:${pair[0]}`)?.id ??
        null,
      player_two_id:
        playerRowByAppKey.get(`away:${pair[1]}`)?.id ??
        null,
      label: `D${index + 1}`,
    })),
  ];

  if (doublesRows.length > 0) {
    await throwIfError(
      await supabase
        .from("team_game_doubles_pairs")
        .insert(doublesRows)
    );
  }

  const savedMatches =
    game.matches.length > 0
      ? await supabase
          .from("team_game_matches")
          .insert(
            game.matches.map((match) => ({
              team_game_id: savedGameId,
              app_match_id: match.id,
              order_number: match.order,
              phase: match.phase,
              label: match.label,
              status: match.status,
              winner_side: match.winner,
              counts_for_ttr: match.countsForTTR,
              counts_for_team_score:
                match.countsForTeamScore,
              recorded_match_id:
                match.recordedMatchId ?? null,
              completed_at:
                match.status === "completed"
                  ? new Date().toISOString()
                  : null,
            }))
          )
          .select("*")
      : { data: [], error: null };

  await throwIfError(savedMatches);

  const matchRowByAppId = new Map(
    (savedMatches.data as TeamGameMatchRow[]).map(
      (row) => [row.app_match_id, row]
    )
  );

  const matchPlayerRows =
    game.matches.flatMap((match) => {
      const savedMatch = matchRowByAppId.get(match.id);

      if (!savedMatch) {
        return [];
      }

      return [
        ...match.homePlayerIds.map((playerId, index) => ({
          team_game_id: savedGameId,
          team_game_match_id: savedMatch.id,
          team_game_player_id:
            playerRowByAppKey.get(`home:${playerId}`)
              ?.id,
          side: "home" as const,
          position: index + 1,
        })),
        ...match.awayPlayerIds.map((playerId, index) => ({
          team_game_id: savedGameId,
          team_game_match_id: savedMatch.id,
          team_game_player_id:
            playerRowByAppKey.get(`away:${playerId}`)
              ?.id,
          side: "away" as const,
          position: index + 1,
        })),
      ].filter(
        (row) => row.team_game_player_id
      );
    });

  if (matchPlayerRows.length > 0) {
    await throwIfError(
      await supabase
        .from("team_game_match_players")
        .insert(matchPlayerRows)
    );
  }

  const setRows = game.matches.flatMap((match) => {
    const savedMatch = matchRowByAppId.get(match.id);

    if (!savedMatch) {
      return [];
    }

    return match.sets.map((set, index) => ({
      team_game_id: savedGameId,
      team_game_match_id: savedMatch.id,
      set_number: index + 1,
      raw_score: `${set.home}-${set.away}`,
      home_score: set.home,
      away_score: set.away,
    }));
  });

  if (setRows.length > 0) {
    await throwIfError(
      await supabase
        .from("team_game_match_sets")
        .insert(setRows)
    );
  }

  if (game.homeConfirmed || game.awayConfirmed) {
    const confirmationRows = [
      game.homeConfirmed
        ? {
            team_game_id: savedGameId,
            side: "home" as const,
          }
        : null,
      game.awayConfirmed
        ? {
            team_game_id: savedGameId,
            side: "away" as const,
          }
        : null,
    ].filter(
      (
        row
      ): row is {
        team_game_id: string;
        side: "home" | "away";
      } => Boolean(row)
    );

    await throwIfError(
      await supabase
        .from("team_game_confirmations")
        .insert(confirmationRows)
    );
  }

  return {
    ...game,
    id: savedGameId,
  };
}

export async function getTeamGames(): Promise<
  TeamGameSummary[]
> {
  const { data, error } = await supabase
    .from("team_games")
    .select(
      `
      *,
      home_club:clubs!team_games_home_club_id_fkey(name),
      away_club:clubs!team_games_away_club_id_fkey(name),
      location_club:clubs!team_games_location_club_id_fkey(name)
    `
    )
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = data as JoinedClubRow[];

  if (rows.length === 0) {
    return [];
  }

  const { data: matchRows, error: matchError } =
    await supabase
      .from("team_game_matches")
      .select("team_game_id,status")
      .in(
        "team_game_id",
        rows.map((row) => row.id)
      );

  if (matchError) {
    throw matchError;
  }

  const matchStats = new Map<
    string,
    { completed: number; total: number }
  >();

  (
    matchRows as Array<{
      team_game_id: string;
      status: Classic6Match["status"];
    }>
  ).forEach((match) => {
    const current =
      matchStats.get(match.team_game_id) ?? {
        completed: 0,
        total: 0,
      };

    current.total += 1;

    if (match.status === "completed") {
      current.completed += 1;
    }

    matchStats.set(match.team_game_id, current);
  });

  return rows.map((row) => {
    const stats =
      matchStats.get(row.id) ?? {
        completed: 0,
        total: 0,
      };

    return {
      id: row.id,
      name: row.name,
      clubName:
        row.location_club?.name ??
        row.home_club?.name ??
        "",
      date: row.game_date,
      status: summaryStatus(row),
      format: row.format,
      matchesPlayed: stats.completed,
      totalMatches: stats.total,
    };
  });
}

export async function getTeamGame(
  id: string
): Promise<Classic6Game | null> {
  const { data, error } = await supabase
    .from("team_games")
    .select(
      `
      *,
      home_club:clubs!team_games_home_club_id_fkey(name),
      away_club:clubs!team_games_away_club_id_fkey(name),
      location_club:clubs!team_games_location_club_id_fkey(name)
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const row = data as JoinedClubRow;
  const [
    playerResult,
    pairResult,
    matchResult,
    matchPlayerResult,
    setResult,
  ] = await Promise.all([
    supabase
      .from("team_game_players")
      .select("*")
      .eq("team_game_id", id)
      .order("position"),
    supabase
      .from("team_game_doubles_pairs")
      .select("*")
      .eq("team_game_id", id)
      .order("pair_number"),
    supabase
      .from("team_game_matches")
      .select("*")
      .eq("team_game_id", id)
      .order("order_number"),
    supabase
      .from("team_game_match_players")
      .select("*")
      .eq("team_game_id", id)
      .order("position"),
    supabase
      .from("team_game_match_sets")
      .select("*")
      .eq("team_game_id", id)
      .order("set_number"),
  ]);

  await Promise.all([
    throwIfError(playerResult),
    throwIfError(pairResult),
    throwIfError(matchResult),
    throwIfError(matchPlayerResult),
    throwIfError(setResult),
  ]);

  const playerRows =
    playerResult.data as TeamGamePlayerRow[];
  const pairRows =
    pairResult.data as TeamGameDoublesPairRow[];
  const matchRows =
    matchResult.data as TeamGameMatchRow[];
  const matchPlayerRows =
    matchPlayerResult.data as TeamGameMatchPlayerRow[];
  const setRows =
    setResult.data as TeamGameMatchSetRow[];
  const playerRowsByDbId = new Map(
    playerRows.map((player) => [
      player.id,
      player,
    ])
  );
  const homeClubName =
    row.home_club?.name ?? "Home Team";
  const awayClubName =
    row.away_club?.name ?? "Away Team";

  const homePlayers = playerRows
    .filter((player) => player.side === "home")
    .sort((a, b) => a.position - b.position)
    .map((player) =>
      rowToPlayer(player, homeClubName)
    );
  const awayPlayers = playerRows
    .filter((player) => player.side === "away")
    .sort((a, b) => a.position - b.position)
    .map((player) =>
      rowToPlayer(player, awayClubName)
    );

  const home: Classic6Team = {
    id: "home",
    name: "Home Team",
    clubId: row.home_club_id,
    clubName: homeClubName,
    players: homePlayers,
    doubles: rowsToDoubles(
      "home",
      pairRows,
      playerRowsByDbId
    ),
  };
  const away: Classic6Team = {
    id: "away",
    name: "Away Team",
    clubId: row.away_club_id,
    clubName: awayClubName,
    players: awayPlayers,
    doubles: rowsToDoubles(
      "away",
      pairRows,
      playerRowsByDbId
    ),
  };

  const matchPlayersByMatchId = new Map<
    string,
    TeamGameMatchPlayerRow[]
  >();

  matchPlayerRows.forEach((matchPlayer) => {
    matchPlayersByMatchId.set(
      matchPlayer.team_game_match_id,
      [
        ...(matchPlayersByMatchId.get(
          matchPlayer.team_game_match_id
        ) ?? []),
        matchPlayer,
      ]
    );
  });

  const setsByMatchId = new Map<
    string,
    TeamGameMatchSetRow[]
  >();

  setRows.forEach((set) => {
    setsByMatchId.set(set.team_game_match_id, [
      ...(setsByMatchId.get(
        set.team_game_match_id
      ) ?? []),
      set,
    ]);
  });

  const matches = matchRows.map(
    (match): Classic6Match => {
      const matchPlayers =
        matchPlayersByMatchId.get(match.id) ?? [];

      return {
        id: match.app_match_id,
        order: match.order_number,
        phase: match.phase,
        label: match.label,
        homePlayerIds: matchPlayers
          .filter(
            (matchPlayer) =>
              matchPlayer.side === "home"
          )
          .sort((a, b) => a.position - b.position)
          .map(
            (matchPlayer) =>
              playerRowsByDbId.get(
                matchPlayer.team_game_player_id
              )?.app_player_id
          )
          .filter(Boolean) as string[],
        awayPlayerIds: matchPlayers
          .filter(
            (matchPlayer) =>
              matchPlayer.side === "away"
          )
          .sort((a, b) => a.position - b.position)
          .map(
            (matchPlayer) =>
              playerRowsByDbId.get(
                matchPlayer.team_game_player_id
              )?.app_player_id
          )
          .filter(Boolean) as string[],
        sets: (
          setsByMatchId.get(match.id) ?? []
        )
          .sort(
            (a, b) => a.set_number - b.set_number
          )
          .map((set) => ({
            home: set.home_score,
            away: set.away_score,
          })),
        status: match.status,
        winner: match.winner_side,
        countsForTTR: match.counts_for_ttr,
        countsForTeamScore:
          match.counts_for_team_score,
        recordedMatchId:
          match.recorded_match_id ?? undefined,
      };
    }
  );

  const customSettings =
    row.format === "custom"
      ? (row.settings as CustomTeamSettings)
      : undefined;

  return {
    id: row.id,
    eventId: row.event_id ?? undefined,
    name: row.name,
    description: row.event_description,
    format: row.format,
    customSettings,
    date: row.game_date,
    startTime: row.start_time ?? undefined,
    locationClubId:
      row.location_club_id ?? undefined,
    locationClubName:
      row.location_club?.name ?? undefined,
    status: rowStatus(row),
    home,
    away,
    matches,
    homeConfirmed: row.home_confirmed,
    awayConfirmed: row.away_confirmed,
    submitted: row.submitted,
  };
}

export async function createTeamGameDraft(args: {
  name: string;
  description?: string;
  format?: Classic6Game["format"];
  customSettings?: CustomTeamSettings;
  date: string;
  startTime?: string;
  locationClubId?: string;
  locationClubName?: string;
  home: Classic6Team;
  away: Classic6Team;
  matches: Classic6Match[];
}) {
  return saveTeamGame({
    id: crypto.randomUUID(),
    name: args.name,
    description: args.description,
    format: args.format ?? "classic-6",
    customSettings: args.customSettings,
    date: args.date,
    startTime: args.startTime,
    locationClubId: args.locationClubId,
    locationClubName: args.locationClubName,
    status: "draft",
    home: args.home,
    away: args.away,
    matches: args.matches,
    homeConfirmed: false,
    awayConfirmed: false,
    submitted: false,
  });
}

export async function deleteTeamGame(
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("team_games")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}
