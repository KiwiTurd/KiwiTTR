import { supabase } from "../../lib/supabase";
import {
  DEFAULT_HOMEPAGE_SETTINGS,
  normalizeHomepageSettings,
  type HomepageHeroSlide,
  type HomepageSettings,
} from "../../types/homepageSettings";

type HomepageSettingsRow = {
  eyebrow_text: string;
  heading_text: string;
  subheading_text: string;
  primary_button_text: string;
  primary_button_url: string;
  secondary_button_text: string;
  secondary_button_url: string;
  hero_image_url: string | null;
  hero_slides?: unknown;
};

function legacySlide(row: HomepageSettingsRow): HomepageHeroSlide {
  return {
    id: "primary",
    eyebrowText: row.eyebrow_text,
    headingText: row.heading_text,
    subheadingText: row.subheading_text,
    primaryButtonText: row.primary_button_text,
    primaryButtonUrl: row.primary_button_url,
    secondaryButtonText: row.secondary_button_text,
    secondaryButtonUrl: row.secondary_button_url,
    heroImageUrl: row.hero_image_url ?? "",
    mobileHeroImageUrl: "",
    slateFade: true,
    showKoru: true,
  };
}

function fromRow(row: HomepageSettingsRow): HomepageSettings {
  if (
    Array.isArray(row.hero_slides) &&
    row.hero_slides.length > 0
  ) {
    return normalizeHomepageSettings({
      heroSlides: row.hero_slides,
    });
  }

  return {
    heroSlides: [legacySlide(row)],
  };
}

export async function getHomepageSettings(): Promise<HomepageSettings> {
  const { data, error } = await supabase
    .from("homepage_settings")
    .select("*")
    .eq("id", "main")
    .maybeSingle();

  if (error) throw error;
  return data
    ? fromRow(data as HomepageSettingsRow)
    : DEFAULT_HOMEPAGE_SETTINGS;
}

export async function saveHomepageSettings(settings: HomepageSettings) {
  const normalized = normalizeHomepageSettings(settings);
  const slides = normalized.heroSlides.map((slide) => ({
    ...slide,
    eyebrowText: slide.eyebrowText.trim(),
    headingText: slide.headingText.trim(),
    subheadingText: slide.subheadingText.trim(),
    primaryButtonText: slide.primaryButtonText.trim(),
    primaryButtonUrl: slide.primaryButtonUrl.trim(),
    secondaryButtonText: slide.secondaryButtonText.trim(),
    secondaryButtonUrl: slide.secondaryButtonUrl.trim(),
  }));
  const first = slides[0];

  const { error } = await supabase.from("homepage_settings").upsert(
    {
      id: "main",
      eyebrow_text: first.eyebrowText,
      heading_text: first.headingText,
      subheading_text: first.subheadingText,
      primary_button_text: first.primaryButtonText,
      primary_button_url: first.primaryButtonUrl,
      secondary_button_text: first.secondaryButtonText,
      secondary_button_url: first.secondaryButtonUrl,
      hero_image_url: first.heroImageUrl || null,
      hero_slides: slides,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) throw error;
}
