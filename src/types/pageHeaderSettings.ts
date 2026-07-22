export const PAGE_HEADER_CATALOG = [
  { key: "dashboard", label: "Dashboard" },
  { key: "rankings", label: "Rankings" },
  { key: "clubs", label: "Clubs" },
  { key: "events", label: "Events" },
  { key: "tournaments", label: "Tournaments" },
  { key: "team-games", label: "Team Games" },
  { key: "club-events", label: "Club Events" },
  { key: "players", label: "Player Management" },
  { key: "matches", label: "Match Input" },
  { key: "simulator", label: "Rating Simulator" },
  { key: "settings", label: "Settings" },
  { key: "customise-pages", label: "Customise Pages" },
  { key: "club-settings", label: "Club Settings" },
  { key: "user-management", label: "User Management" },
  { key: "seo-settings", label: "SEO Metadata" },
  { key: "notice-settings", label: "Notices and News" },
  { key: "homepage-settings", label: "Homepage Settings" },
  { key: "new-tournament", label: "New Tournament" },
  { key: "tournament-players", label: "Tournament Player Selection" },
  { key: "team-game-type", label: "Team Match Type" },
  { key: "team-game-builder", label: "Team Game Builder" },
  { key: "club-event-type", label: "Club Event Type" },
  { key: "club-round-robin", label: "Club Round Robin Builder" },
  { key: "club-round-robin-players", label: "Club Round Robin Players" },
  { key: "admin", label: "Admin Console" },
] as const;

export type PageHeaderKey = (typeof PAGE_HEADER_CATALOG)[number]["key"];

export const PAGE_HEADER_GROUPS: ReadonlyArray<{
  id: string;
  label: string;
  description: string;
  pages: readonly PageHeaderKey[];
}> = [
  {
    id: "general",
    label: "General Pages",
    description: "Dashboard, discovery, players and tools",
    pages: ["dashboard", "rankings", "events", "players", "matches", "simulator"],
  },
  {
    id: "clubs",
    label: "Clubs",
    description: "Club listings, events, settings and builders",
    pages: ["clubs", "club-events", "club-settings", "club-event-type", "club-round-robin", "club-round-robin-players"],
  },
  {
    id: "tournaments",
    label: "Tournaments",
    description: "Tournament centre and tournament wizard",
    pages: ["tournaments", "new-tournament", "tournament-players"],
  },
  {
    id: "team-games",
    label: "Team Games",
    description: "Team game listings and setup flows",
    pages: ["team-games", "team-game-type", "team-game-builder"],
  },
  {
    id: "settings",
    label: "Settings and Admin",
    description: "Site configuration and administration",
    pages: ["settings", "customise-pages", "user-management", "seo-settings", "notice-settings", "homepage-settings", "admin"],
  },
];

export type PageHeaderStyle = {
  imageUrl: string;
  fadeEnabled: boolean;
  fadeColor: string;
  height: "thin" | "standard" | "thick";
};

export type PageHeaderSettings = Record<PageHeaderKey, PageHeaderStyle>;

export const DEFAULT_PAGE_HEADER_STYLE: PageHeaderStyle = {
  imageUrl: "/kiwittr-home-hero.jpg",
  fadeEnabled: true,
  fadeColor: "#0f172a",
  height: "standard",
};

export const DEFAULT_PAGE_HEADER_SETTINGS = Object.fromEntries(
  PAGE_HEADER_CATALOG.map(({ key }) => [key, { ...DEFAULT_PAGE_HEADER_STYLE }])
) as PageHeaderSettings;

function validColour(value: unknown) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

export function normalizePageHeaderSettings(
  value: unknown
): PageHeaderSettings {
  const source = value && typeof value === "object"
    ? value as Partial<Record<PageHeaderKey, Partial<PageHeaderStyle>>>
    : {};

  return Object.fromEntries(
    PAGE_HEADER_CATALOG.map(({ key }) => {
      const item = source[key];
      return [key, {
        imageUrl: typeof item?.imageUrl === "string"
          ? item.imageUrl
          : DEFAULT_PAGE_HEADER_STYLE.imageUrl,
        fadeEnabled: typeof item?.fadeEnabled === "boolean"
          ? item.fadeEnabled
          : DEFAULT_PAGE_HEADER_STYLE.fadeEnabled,
        fadeColor: validColour(item?.fadeColor)
          ? item!.fadeColor!
          : DEFAULT_PAGE_HEADER_STYLE.fadeColor,
        height: item?.height === "thin" || item?.height === "thick"
          ? item.height
          : DEFAULT_PAGE_HEADER_STYLE.height,
      }];
    })
  ) as PageHeaderSettings;
}
