import { supabase } from "../../lib/supabase";
import {
  DEFAULT_HOMEPAGE_SETTINGS,
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
};

function fromRow(row: HomepageSettingsRow): HomepageSettings {
  return {
    eyebrowText: row.eyebrow_text,
    headingText: row.heading_text,
    subheadingText: row.subheading_text,
    primaryButtonText: row.primary_button_text,
    primaryButtonUrl: row.primary_button_url,
    secondaryButtonText: row.secondary_button_text,
    secondaryButtonUrl: row.secondary_button_url,
    heroImageUrl: row.hero_image_url ?? "",
  };
}

export async function getHomepageSettings(): Promise<HomepageSettings> {
  const { data, error } = await supabase
    .from("homepage_settings")
    .select("*")
    .eq("id", "main")
    .maybeSingle();

  if (error) throw error;
  return data ? fromRow(data as HomepageSettingsRow) : DEFAULT_HOMEPAGE_SETTINGS;
}

export async function saveHomepageSettings(settings: HomepageSettings) {
  const { error } = await supabase.from("homepage_settings").upsert({
    id: "main",
    eyebrow_text: settings.eyebrowText.trim(),
    heading_text: settings.headingText.trim(),
    subheading_text: settings.subheadingText.trim(),
    primary_button_text: settings.primaryButtonText.trim(),
    primary_button_url: settings.primaryButtonUrl.trim(),
    secondary_button_text: settings.secondaryButtonText.trim(),
    secondary_button_url: settings.secondaryButtonUrl.trim(),
    hero_image_url: settings.heroImageUrl || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" });

  if (error) throw error;
}
