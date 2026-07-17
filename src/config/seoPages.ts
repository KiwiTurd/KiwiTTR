export type SeoPageDefinition = {
  path: string;
  label: string;
  title: string;
  description: string;
  keywords: [string, string, string];
};

export const SEO_PAGES: SeoPageDefinition[] = [
  { path: "/", label: "Home", title: "KiwiTTR | NZ Table Tennis Rankings and Ratings", description: "Discover KiwiTTR, the transparent New Zealand table tennis rating platform for players, clubs, events, results and NZ rankings.", keywords: ["NZ table tennis", "NZ rankings", "KiwiTTR"] },
  { path: "/dashboard", label: "Dashboard", title: "Dashboard | KiwiTTR", description: "View your KiwiTTR player snapshot, club activity, ratings, events and competition tools from your personal dashboard.", keywords: ["KiwiTTR dashboard", "player rating", "club activity"] },
  { path: "/rankings", label: "Rankings", title: "NZ Table Tennis Rankings | KiwiTTR", description: "Explore current NZ table tennis rankings, compare player ratings and follow performance across New Zealand clubs and competitions.", keywords: ["NZ rankings", "table tennis rankings", "player ratings"] },
  { path: "/clubs", label: "Clubs", title: "New Zealand Table Tennis Clubs | KiwiTTR", description: "Discover table tennis clubs across New Zealand, view club players, ratings, contact details and recent competitive activity.", keywords: ["table tennis clubs NZ", "NZ clubs", "KiwiTTR clubs"] },
  { path: "/clubs/:id", label: "Club profile", title: "Table Tennis Club Profile | KiwiTTR", description: "View this New Zealand table tennis club's players, ratings, location, contact information and latest KiwiTTR activity.", keywords: ["NZ table tennis club", "club rankings", "club players"] },
  { path: "/players/:id", label: "Player profile", title: "NZ Table Tennis Player Profile | KiwiTTR", description: "View a player's KiwiTTR rating, match history, performance trend and position in New Zealand table tennis rankings.", keywords: ["player rating", "NZ table tennis player", "match history"] },
  { path: "/events", label: "Events", title: "NZ Table Tennis Events | KiwiTTR", description: "Browse New Zealand table tennis events, results and rated matches recorded through the KiwiTTR competition platform.", keywords: ["NZ table tennis events", "table tennis results", "rated matches"] },
  { path: "/events/:id", label: "Event profile", title: "Table Tennis Event Results | KiwiTTR", description: "See event details, match results and KiwiTTR rating changes from this New Zealand table tennis competition.", keywords: ["event results", "NZ table tennis", "rating changes"] },
  { path: "/tournaments", label: "Tournaments", title: "NZ Table Tennis Tournaments | KiwiTTR", description: "Manage and follow New Zealand table tennis tournaments, player draws, pools, knockout rounds and live results.", keywords: ["NZ tournaments", "table tennis draws", "tournament results"] },
  { path: "/tournaments/:id/viewer", label: "Tournament viewer", title: "Live Table Tennis Tournament | KiwiTTR", description: "Follow live pools, knockout draws, standings and results from a New Zealand table tennis tournament on KiwiTTR.", keywords: ["live tournament", "table tennis draw", "NZ results"] },
  { path: "/team-games", label: "Team games", title: "NZ Table Tennis Team Games | KiwiTTR", description: "Organise and follow interclub table tennis team games, line-ups, individual matches and live team scores across New Zealand.", keywords: ["team table tennis", "NZ interclub", "team scores"] },
  { path: "/club-events", label: "Club events", title: "Club Events | KiwiTTR", description: "View table tennis club nights, round robins and upcoming events for your associated club.", keywords: ["club night", "round robin", "club events"] },
  { path: "/team-games/:id/live", label: "Live team game", title: "Live Table Tennis Team Score | KiwiTTR", description: "Follow live team scores, player matchups and completed results from a KiwiTTR New Zealand interclub fixture.", keywords: ["live team score", "NZ interclub", "table tennis results"] },
  { path: "/simulator", label: "TTR calculator", title: "Table Tennis Rating Calculator | KiwiTTR", description: "Estimate rating changes for any matchup with the KiwiTTR calculator, built for transparent New Zealand table tennis ratings.", keywords: ["rating calculator", "table tennis rating", "TTR calculator"] },
  { path: "/about", label: "About us", title: "About KiwiTTR | NZ Table Tennis Rankings", description: "Learn how KiwiTTR connects New Zealand table tennis players, clubs, matches and events through clear, responsive NZ rankings.", keywords: ["about KiwiTTR", "NZ rankings", "NZ table tennis"] },
  { path: "/how-we-calculate", label: "How we calculate", title: "How KiwiTTR Ratings Work | NZ Table Tennis", description: "Learn how KiwiTTR calculates expected outcomes, rating changes and provisional ratings for New Zealand table tennis players.", keywords: ["rating calculation", "provisional rating", "NZ table tennis"] },
  { path: "/login", label: "Login", title: "Log In | KiwiTTR", description: "Log in to KiwiTTR to manage your table tennis profile, club competitions, match results and New Zealand player rating.", keywords: ["KiwiTTR login", "player login", "club login"] },
  { path: "/register", label: "Register", title: "Create a KiwiTTR Account", description: "Join KiwiTTR to connect with New Zealand table tennis, access your player profile and follow ratings, clubs and events.", keywords: ["join KiwiTTR", "table tennis account", "NZ player"] },
  { path: "/tournaments/viewer", label: "Tournament viewer (current)", title: "Tournament Viewer | KiwiTTR", description: "View the current KiwiTTR tournament pools, knockout draw, standings and results.", keywords: ["tournament viewer", "live draw", "table tennis standings"] },
  { path: "/flappy-bat", label: "Flappy Bat", title: "Flappy Bat | KiwiTTR", description: "Play KiwiTTR's table tennis-inspired Flappy Bat game.", keywords: ["Flappy Bat", "table tennis game", "KiwiTTR game"] },
];

export function pathMatches(pattern: string, pathname: string) {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);

  return patternParts.length === pathParts.length && patternParts.every(
    (part, index) => part.startsWith(":") || part === pathParts[index]
  );
}
