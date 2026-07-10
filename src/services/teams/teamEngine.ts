export type TeamGameStatus =
  | "draft"
  | "live"
  | "upcoming"
  | "completed";

export type TeamGameFormat =
  | "classic-6"
  | "classic-3"
  | "abc-123"
  | "custom"
  | "teams"
  | "relay"
  | "round-robin";

export type ClassicTeamFormat =
  | "classic-6"
  | "classic-3"
  | "abc-123"
  | "custom";

export type CustomTeamSettings = {
  playersPerTeam: number;
  ordering: "ttr-auto" | "manual";
  eventLevel: "ttr" | "social";
  matchMode: "play-through" | "best-of";
  totalGames: number;
  doublesIncluded: boolean;
  doublesGames?: number;
};

export type TeamGameTeam = {
  id: string;
  name: string;
  score: number;
  players: string[];
};

export type TeamGame = {
  id: string;
  name: string;
  clubName: string;
  date: string;
  status: TeamGameStatus;
  format: TeamGameFormat;
  teams: TeamGameTeam[];
  matchesPlayed: number;
  totalMatches: number;
};

export type Classic6Player = {
  id: string;
  name: string;
  rating: number;
  clubId: string;
  clubName: string;
};

export type Classic6Team = {
  id: "home" | "away";
  name: string;
  clubId: string;
  clubName: string;
  players: Classic6Player[];
  doubles: [
    [string, string],
    [string, string],
    [string, string],
  ];
};

export type Classic6Set = {
  home: number;
  away: number;
};

export type Classic6Match = {
  id: string;
  order: number;
  phase:
    | "doubles"
    | "singles-one"
    | "singles-two";
  label: string;
  homePlayerIds: string[];
  awayPlayerIds: string[];
  sets: Classic6Set[];
  status:
    | "pending"
    | "live"
    | "completed";
  winner:
    | "home"
    | "away"
    | null;
  countsForTTR: boolean;
  countsForTeamScore: boolean;
  recordedMatchId?: string;
};

export type Classic6Game = {
  id: string;
  eventId?: string;
  name: string;
  description?: string;
  format?: ClassicTeamFormat;
  customSettings?: CustomTeamSettings;
  date: string;
  startTime?: string;
  locationClubId?: string;
  locationClubName?: string;
  status: "draft" | "live" | "submitted";
  home: Classic6Team;
  away: Classic6Team;
  matches: Classic6Match[];
  homeConfirmed: boolean;
  awayConfirmed: boolean;
  submitted: boolean;
};

const emptyDoubles: Classic6Team["doubles"] = [
  ["", ""],
  ["", ""],
  ["", ""],
];

function pairLabel(index: number) {
  return `D${index + 1}`;
}

export function sortClassic6Players(
  players: Classic6Player[]
) {
  return [...players].sort(
    (a, b) => b.rating - a.rating
  );
}

export function createClassic6Team(
  id: "home" | "away",
  clubId: string,
  clubName: string,
  players: Classic6Player[],
  doubles: Classic6Team["doubles"] = emptyDoubles,
  teamSize = 6,
  preserveOrder = false
): Classic6Team {
  return {
    id,
    name:
      id === "home"
        ? "Home Team"
        : "Away Team",
    clubId,
    clubName,
    players: (preserveOrder
      ? players
      : sortClassic6Players(players)
    ).slice(0, teamSize),
    doubles,
  };
}

export function classicTeamFormatLabel(
  format: ClassicTeamFormat | undefined
) {
  return format === "classic-3"
    ? "Classic 3"
    : format === "abc-123"
      ? "ABC v 123"
    : format === "custom"
      ? "Custom"
    : "Classic 6";
}

export function classicTeamTargetScore(
  format: ClassicTeamFormat | undefined,
  customSettings?: CustomTeamSettings
) {
  if (format === "classic-3") {
    return 3;
  }

  if (format === "abc-123") {
    return 12;
  }

  if (format === "custom") {
    const totalGames =
      customSettings?.totalGames ?? 1;

    return customSettings?.matchMode === "best-of"
      ? Math.floor(totalGames / 2) + 1
      : totalGames;
  }

  return 9;
}

export function classicTeamPlayerCount(
  format: ClassicTeamFormat | undefined,
  customSettings?: CustomTeamSettings
) {
  if (format === "classic-3") {
    return 3;
  }

  if (format === "abc-123") {
    return 3;
  }

  if (format === "custom") {
    return customSettings?.playersPerTeam ?? 4;
  }

  return 6;
}

export function classicTeamDoublesCount(
  format: ClassicTeamFormat | undefined,
  customSettings?: CustomTeamSettings
) {
  if (format === "classic-3") {
    return 1;
  }

  if (format === "abc-123") {
    return 0;
  }

  if (format === "custom") {
    return Math.min(
      3,
      Math.max(
        0,
        customSettings?.doublesGames ??
          (customSettings?.doublesIncluded ? 1 : 0)
      )
    );
  }

  return 3;
}

export function buildClassicMatches(
  format: ClassicTeamFormat,
  home: Classic6Team,
  away: Classic6Team,
  customSettings?: CustomTeamSettings
): Classic6Match[] {
  if (format === "classic-3") {
    return buildClassic3Matches(home, away);
  }

  if (format === "abc-123") {
    return buildAbc123Matches(home, away);
  }

  if (format === "custom") {
    return buildCustomTeamMatches(
      home,
      away,
      customSettings
    );
  }

  return buildClassic6Matches(home, away);
}

export function buildAbc123Matches(
  home: Classic6Team,
  away: Classic6Team
): Classic6Match[] {
  const homeOrder = home.players.slice(0, 3);
  const awayOrder = away.players.slice(0, 3);
  const matchMap: Array<{
    label: string;
    homeIndexes: number[];
    awayIndexes: number[];
    doubles: boolean;
  }> = [
    {
      label: "A v 3",
      homeIndexes: [0],
      awayIndexes: [2],
      doubles: false,
    },
    {
      label: "B v 1",
      homeIndexes: [1],
      awayIndexes: [0],
      doubles: false,
    },
    {
      label: "C v 2",
      homeIndexes: [2],
      awayIndexes: [1],
      doubles: false,
    },
    {
      label: "B+C v 2+3",
      homeIndexes: [1, 2],
      awayIndexes: [1, 2],
      doubles: true,
    },
    {
      label: "A v 2",
      homeIndexes: [0],
      awayIndexes: [1],
      doubles: false,
    },
    {
      label: "B v 3",
      homeIndexes: [1],
      awayIndexes: [2],
      doubles: false,
    },
    {
      label: "C v 1",
      homeIndexes: [2],
      awayIndexes: [0],
      doubles: false,
    },
    {
      label: "A+C v 1+3",
      homeIndexes: [0, 2],
      awayIndexes: [0, 2],
      doubles: true,
    },
    {
      label: "A v 1",
      homeIndexes: [0],
      awayIndexes: [0],
      doubles: false,
    },
    {
      label: "B v 2",
      homeIndexes: [1],
      awayIndexes: [1],
      doubles: false,
    },
    {
      label: "C v 3",
      homeIndexes: [2],
      awayIndexes: [2],
      doubles: false,
    },
    {
      label: "A+B v 1+2",
      homeIndexes: [0, 1],
      awayIndexes: [0, 1],
      doubles: true,
    },
  ];

  return matchMap.map((match, index) => ({
    id: `abc123-match-${index + 1}`,
    order: index + 1,
    phase: match.doubles
      ? "doubles"
      : "singles-one",
    label: match.label,
    homePlayerIds: match.homeIndexes
      .map((playerIndex) => homeOrder[playerIndex]?.id)
      .filter(Boolean) as string[],
    awayPlayerIds: match.awayIndexes
      .map((playerIndex) => awayOrder[playerIndex]?.id)
      .filter(Boolean) as string[],
    sets: [],
    status: "pending",
    winner: null,
    countsForTTR: !match.doubles,
    countsForTeamScore: true,
  }));
}

export function buildCustomTeamMatches(
  home: Classic6Team,
  away: Classic6Team,
  settings: CustomTeamSettings = {
    playersPerTeam: 4,
    ordering: "ttr-auto",
    eventLevel: "social",
    matchMode: "play-through",
    totalGames: 5,
    doublesIncluded: false,
    doublesGames: 0,
  }
): Classic6Match[] {
  const playerCount =
    Math.max(1, settings.playersPerTeam);
  const totalGames =
    Math.max(1, settings.totalGames);
  const homeOrder =
    home.players.slice(0, playerCount);
  const awayOrder =
    away.players.slice(0, playerCount);
  const doublesGames = Math.min(
    totalGames,
    Math.max(
      0,
      settings.doublesGames ??
        (settings.doublesIncluded ? 1 : 0)
    )
  );
  const firstDoublesOrder =
    totalGames - doublesGames + 1;

  return Array.from(
    { length: totalGames },
    (_, index): Classic6Match => {
      const order = index + 1;
      const isDoubles =
        doublesGames > 0 &&
        order >= firstDoublesOrder;

      if (isDoubles) {
        const doublesIndex =
          (order - firstDoublesOrder) % 3;

        return {
          id: `custom-doubles-${order}`,
          order,
          phase: "doubles",
          label: `D${doublesIndex + 1} v D${doublesIndex + 1}`,
          homePlayerIds: home.doubles[doublesIndex],
          awayPlayerIds: away.doubles[doublesIndex],
          sets: [],
          status: "pending",
          winner: null,
          countsForTTR: false,
          countsForTeamScore: true,
        };
      }

      const homePlayer =
        homeOrder[index % homeOrder.length];
      const awayPlayer =
        awayOrder[index % awayOrder.length];

      return {
        id: `custom-singles-${order}`,
        order,
        phase: "singles-one",
        label: `Game ${order}`,
        homePlayerIds: homePlayer
          ? [homePlayer.id]
          : [],
        awayPlayerIds: awayPlayer
          ? [awayPlayer.id]
          : [],
        sets: [],
        status: "pending",
        winner: null,
        countsForTTR:
          settings.eventLevel === "ttr",
        countsForTeamScore: true,
      };
    }
  );
}

export function buildClassic3Matches(
  home: Classic6Team,
  away: Classic6Team
): Classic6Match[] {
  const homeOrder =
    sortClassic6Players(home.players).slice(0, 3);
  const awayOrder =
    sortClassic6Players(away.players).slice(0, 3);
  const awayOpeningOrder = [1, 0, 2];

  const openingSingles = homeOrder.map(
    (homePlayer, index) => {
      const awayPlayer =
        awayOrder[awayOpeningOrder[index]];

      return {
        id: `classic3-singles-${index + 1}`,
        order: index + 1,
        phase: "singles-one" as const,
        label: `Singles ${index + 1}`,
        homePlayerIds: homePlayer
          ? [homePlayer.id]
          : [],
        awayPlayerIds: awayPlayer
          ? [awayPlayer.id]
          : [],
        sets: [],
        status: "pending" as const,
        winner: null,
        countsForTTR: true,
        countsForTeamScore: true,
      };
    }
  );

  return [
    ...openingSingles,
    {
      id: "classic3-top-singles",
      order: 4,
      phase: "singles-two",
      label: "1 v 1",
      homePlayerIds: homeOrder[0]
        ? [homeOrder[0].id]
        : [],
      awayPlayerIds: awayOrder[0]
        ? [awayOrder[0].id]
        : [],
      sets: [],
      status: "pending",
      winner: null,
      countsForTTR: true,
      countsForTeamScore: true,
    },
    {
      id: "classic3-decider-doubles",
      order: 5,
      phase: "doubles",
      label: "D1 v D1",
      homePlayerIds: home.doubles[0],
      awayPlayerIds: away.doubles[0],
      sets: [],
      status: "pending",
      winner: null,
      countsForTTR: false,
      countsForTeamScore: true,
    },
  ];
}

export function buildClassic6Matches(
  home: Classic6Team,
  away: Classic6Team
): Classic6Match[] {
  const homeOrder =
    sortClassic6Players(home.players);
  const awayOrder =
    sortClassic6Players(away.players);
  const awayFirstRoundOrder = [
    1,
    0,
    3,
    2,
    5,
    4,
  ];

  const doublesMap = [
    [0, 1],
    [1, 0],
    [2, 2],
  ];

  const doubles = doublesMap.map(
    ([homePair, awayPair], index) => ({
      id: `classic6-doubles-${index + 1}`,
      order: index + 1,
      phase: "doubles" as const,
      label: `${pairLabel(homePair)} v ${pairLabel(awayPair)}`,
      homePlayerIds: home.doubles[homePair],
      awayPlayerIds: away.doubles[awayPair],
      sets: [],
      status: "pending" as const,
      winner: null,
      countsForTTR: false,
      countsForTeamScore: true,
    })
  );

  const firstSingles = homeOrder.map(
    (homePlayer, index) => {
      const awayPlayer =
        awayOrder[awayFirstRoundOrder[index]];

      return {
        id: `classic6-singles-one-${index + 1}`,
        order: doubles.length + index + 1,
        phase: "singles-one" as const,
        label: `Singles ${index + 1}`,
        homePlayerIds: homePlayer
          ? [homePlayer.id]
          : [],
        awayPlayerIds: awayPlayer
          ? [awayPlayer.id]
          : [],
        sets: [],
        status: "pending" as const,
        winner: null,
        countsForTTR: true,
        countsForTeamScore: true,
      };
    }
  );

  const secondSingles = homeOrder.map(
    (homePlayer, index) => {
      const awayPlayer = awayOrder[index];

      return {
        id: `classic6-singles-two-${index + 1}`,
        order:
          doubles.length +
          firstSingles.length +
          index +
          1,
        phase: "singles-two" as const,
        label: `Reverse Singles ${index + 1}`,
        homePlayerIds: homePlayer
          ? [homePlayer.id]
          : [],
        awayPlayerIds: awayPlayer
          ? [awayPlayer.id]
          : [],
        sets: [],
        status: "pending" as const,
        winner: null,
        countsForTTR: true,
        countsForTeamScore: true,
      };
    }
  );

  const finalDoubles: Classic6Match = {
    id: "classic6-final-doubles",
    order:
      doubles.length +
      firstSingles.length +
      secondSingles.length +
      1,
    phase: "doubles",
    label: "D1 v D1",
    homePlayerIds: home.doubles[0],
    awayPlayerIds: away.doubles[0],
    sets: [],
    status: "pending",
    winner: null,
    countsForTTR: false,
    countsForTeamScore: true,
  };

  return [
    ...doubles,
    ...firstSingles,
    ...secondSingles,
    finalDoubles,
  ];
}

export function calculateClassic6Score(
  matches: Classic6Match[],
  format: ClassicTeamFormat = "classic-6",
  customSettings?: CustomTeamSettings
) {
  let home = 0;
  let away = 0;
  let decided = false;
  const targetScore =
    classicTeamTargetScore(
      format,
      customSettings
    );

  return matches
    .sort((a, b) => a.order - b.order)
    .reduce(
      (score, match) => {
        if (
          decided ||
          !match.countsForTeamScore ||
          match.status !== "completed" ||
          !match.winner
        ) {
          return score;
        }

        if (match.winner === "home") {
          home += 1;
        } else {
          away += 1;
        }

        if (
          format !== "abc-123" &&
          (format !== "custom" ||
            customSettings?.matchMode !== "play-through") &&
          (home === targetScore ||
          away === targetScore ||
          (format === "classic-6" &&
            home === 8 &&
            away === 8))
        ) {
          decided = true;
        }

        return {
          home,
          away,
        };
      },
      {
        home,
        away,
      }
    );
}

export function classic6NextMatchId(
  matches: Classic6Match[],
  format: ClassicTeamFormat = "classic-6",
  customSettings?: CustomTeamSettings
) {
  const score =
    calculateClassic6Score(
      matches,
      format,
      customSettings
    );
  const targetScore =
    classicTeamTargetScore(
      format,
      customSettings
    );

  if (
    format !== "abc-123" &&
    (format !== "custom" ||
      customSettings?.matchMode !== "play-through") &&
    (score.home === targetScore ||
      score.away === targetScore ||
      (format === "classic-6" &&
        score.home === 8 &&
        score.away === 8))
  ) {
    return null;
  }

  return [...matches]
    .sort((a, b) => a.order - b.order)
    .find((match) => match.status !== "completed")
    ?.id ?? null;
}

export function getClassic6DemoGame(
  id = "team-game-demo-1"
): Classic6Game {
  if (id === "team-game-demo-classic-3") {
    return getClassic3DemoGame(id);
  }

  const homePlayers: Classic6Player[] = [
    ["h1", "Home 1", 1840],
    ["h2", "Home 2", 1760],
    ["h3", "Home 3", 1690],
    ["h4", "Home 4", 1610],
    ["h5", "Home 5", 1540],
    ["h6", "Home 6", 1480],
  ].map(([playerId, name, rating]) => ({
    id: String(playerId),
    name: String(name),
    rating: Number(rating),
    clubId: "home-club",
    clubName: "Home Club",
  }));
  const awayPlayers: Classic6Player[] = [
    ["a1", "Away 1", 1810],
    ["a2", "Away 2", 1780],
    ["a3", "Away 3", 1660],
    ["a4", "Away 4", 1625],
    ["a5", "Away 5", 1510],
    ["a6", "Away 6", 1440],
  ].map(([playerId, name, rating]) => ({
    id: String(playerId),
    name: String(name),
    rating: Number(rating),
    clubId: "away-club",
    clubName: "Away Club",
  }));
  const home = createClassic6Team(
    "home",
    "home-club",
    "Home Club",
    homePlayers,
    [
      ["h1", "h4"],
      ["h2", "h5"],
      ["h3", "h6"],
    ]
  );
  const away = createClassic6Team(
    "away",
    "away-club",
    "Away Club",
    awayPlayers,
    [
      ["a1", "a4"],
      ["a2", "a5"],
      ["a3", "a6"],
    ]
  );
  const matches = buildClassic6Matches(
    home,
    away
  ).map((match, index) => {
    if (index === 0) {
      return {
        ...match,
        status: "completed" as const,
        winner: "home" as const,
        sets: [
          { home: 11, away: 8 },
          { home: 9, away: 11 },
          { home: 11, away: 7 },
        ],
      };
    }

    if (index === 1) {
      return {
        ...match,
        status: "completed" as const,
        winner: "away" as const,
        sets: [
          { home: 7, away: 11 },
          { home: 10, away: 12 },
        ],
      };
    }

    if (index === 2) {
      return {
        ...match,
        status: "live" as const,
        sets: [
          { home: 11, away: 6 },
          { home: 5, away: 8 },
        ],
      };
    }

    return match;
  });

  return {
    id,
    name: "Classic 6 Demo",
    format: "classic-6",
    date: new Date().toISOString().slice(0, 10),
    startTime: "19:00",
    locationClubId: "home-club",
    locationClubName: "Home Club",
    status: "live",
    home,
    away,
    matches,
    homeConfirmed: false,
    awayConfirmed: false,
    submitted: false,
  };
}

export function getClassic3DemoGame(
  id = "team-game-demo-classic-3"
): Classic6Game {
  const homePlayers: Classic6Player[] = [
    ["h1", "Home 1", 1840],
    ["h2", "Home 2", 1760],
    ["h3", "Home 3", 1690],
  ].map(([playerId, name, rating]) => ({
    id: String(playerId),
    name: String(name),
    rating: Number(rating),
    clubId: "home-club",
    clubName: "Home Club",
  }));
  const awayPlayers: Classic6Player[] = [
    ["a1", "Away 1", 1810],
    ["a2", "Away 2", 1780],
    ["a3", "Away 3", 1660],
  ].map(([playerId, name, rating]) => ({
    id: String(playerId),
    name: String(name),
    rating: Number(rating),
    clubId: "away-club",
    clubName: "Away Club",
  }));
  const home = createClassic6Team(
    "home",
    "home-club",
    "Home Club",
    homePlayers,
    [
      ["h1", "h2"],
      ["", ""],
      ["", ""],
    ],
    3
  );
  const away = createClassic6Team(
    "away",
    "away-club",
    "Away Club",
    awayPlayers,
    [
      ["a1", "a2"],
      ["", ""],
      ["", ""],
    ],
    3
  );

  return {
    id,
    name: "Classic 3 Demo",
    format: "classic-3",
    date: new Date().toISOString().slice(0, 10),
    startTime: "19:00",
    locationClubId: "home-club",
    locationClubName: "Home Club",
    status: "live",
    home,
    away,
    matches: buildClassic3Matches(home, away),
    homeConfirmed: false,
    awayConfirmed: false,
    submitted: false,
  };
}

export function teamGameStatusLabel(
  status: TeamGameStatus
) {
  switch (status) {
    case "completed":
      return "Completed";

    case "draft":
      return "Draft";

    case "live":
      return "Live";

    case "upcoming":
      return "Upcoming";
  }
}

export function teamGameFormatLabel(
  format: TeamGameFormat
) {
  switch (format) {
    case "classic-6":
      return "Classic 6";

    case "classic-3":
      return "Classic 3";

    case "abc-123":
      return "ABC v 123";

    case "custom":
      return "Custom";

    case "relay":
      return "Relay";

    case "round-robin":
      return "Round Robin";

    case "teams":
      return "Teams";
  }
}
