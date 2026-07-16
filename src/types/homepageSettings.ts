export type HomepageHeroSlide = {
  id: string;
  eyebrowText: string;
  headingText: string;
  subheadingText: string;
  primaryButtonText: string;
  primaryButtonUrl: string;
  secondaryButtonText: string;
  secondaryButtonUrl: string;
  heroImageUrl: string;
  mobileHeroImageUrl: string;
  slateFade: boolean;
  showKoru: boolean;
};

export type HomepageSettings = {
  heroSlides: HomepageHeroSlide[];
};

export const DEFAULT_HOMEPAGE_HERO_SLIDE: HomepageHeroSlide = {
  id: "primary",
  eyebrowText: "Table tennis ratings for Aotearoa",
  headingText: "Every match tells a player's story.",
  subheadingText:
    "KiwiTTR brings New Zealand table tennis rankings, players, clubs, events and results together in one transparent rating platform.",
  primaryButtonText: "Explore rankings",
  primaryButtonUrl: "/rankings",
  secondaryButtonText: "Create an account",
  secondaryButtonUrl: "/register",
  heroImageUrl: "",
  mobileHeroImageUrl: "",
  slateFade: true,
  showKoru: true,
};

export const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettings = {
  heroSlides: [{ ...DEFAULT_HOMEPAGE_HERO_SLIDE }],
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizeSlide(
  value: unknown,
  index: number
): HomepageHeroSlide {
  const slide = asRecord(value);

  return {
    id: asString(slide.id, `slide-${index + 1}`),
    eyebrowText: asString(slide.eyebrowText),
    headingText: asString(slide.headingText),
    subheadingText: asString(slide.subheadingText),
    primaryButtonText: asString(slide.primaryButtonText),
    primaryButtonUrl: asString(slide.primaryButtonUrl),
    secondaryButtonText: asString(slide.secondaryButtonText),
    secondaryButtonUrl: asString(slide.secondaryButtonUrl),
    heroImageUrl: asString(slide.heroImageUrl),
    mobileHeroImageUrl: asString(slide.mobileHeroImageUrl),
    slateFade:
      typeof slide.slateFade === "boolean"
        ? slide.slateFade
        : true,
    showKoru:
      typeof slide.showKoru === "boolean"
        ? slide.showKoru
        : true,
  };
}

export function normalizeHomepageSettings(
  value: unknown
): HomepageSettings {
  const settings = asRecord(value);
  const rawSlides = Array.isArray(settings.heroSlides)
    ? settings.heroSlides
    : [];

  if (rawSlides.length > 0) {
    return {
      heroSlides: rawSlides.map(normalizeSlide),
    };
  }

  const hasLegacySettings =
    typeof settings.headingText === "string";

  if (hasLegacySettings) {
    return {
      heroSlides: [
        normalizeSlide(
          {
            id: "primary",
            eyebrowText: settings.eyebrowText,
            headingText: settings.headingText,
            subheadingText: settings.subheadingText,
            primaryButtonText: settings.primaryButtonText,
            primaryButtonUrl: settings.primaryButtonUrl,
            secondaryButtonText: settings.secondaryButtonText,
            secondaryButtonUrl: settings.secondaryButtonUrl,
            heroImageUrl: settings.heroImageUrl,
            slateFade: true,
            showKoru: true,
          },
          0
        ),
      ],
    };
  }

  return {
    heroSlides: [{ ...DEFAULT_HOMEPAGE_HERO_SLIDE }],
  };
}
