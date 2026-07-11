export type HomepageSettings = {
  eyebrowText: string;
  headingText: string;
  subheadingText: string;
  primaryButtonText: string;
  primaryButtonUrl: string;
  secondaryButtonText: string;
  secondaryButtonUrl: string;
  heroImageUrl: string;
};

export const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettings = {
  eyebrowText: "Table tennis ratings for Aotearoa",
  headingText: "Every match tells a player's story.",
  subheadingText: "KiwiTTR brings New Zealand table tennis rankings, players, clubs, events and results together in one transparent rating platform.",
  primaryButtonText: "Explore rankings",
  primaryButtonUrl: "/rankings",
  secondaryButtonText: "Create an account",
  secondaryButtonUrl: "/register",
  heroImageUrl: "",
};
