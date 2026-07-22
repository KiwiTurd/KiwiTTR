import { supabase } from "../../lib/supabase";
import {
  DEFAULT_PAGE_HEADER_SETTINGS,
  normalizePageHeaderSettings,
  type PageHeaderSettings,
} from "../../types/pageHeaderSettings";

const LOCAL_STORAGE_KEY = "kiwittr-page-header-settings";

function readLocalSettings(): PageHeaderSettings {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored
      ? normalizePageHeaderSettings(JSON.parse(stored))
      : DEFAULT_PAGE_HEADER_SETTINGS;
  } catch {
    return DEFAULT_PAGE_HEADER_SETTINGS;
  }
}

export async function getPageHeaderSettings(): Promise<PageHeaderSettings> {
  const { data, error } = await supabase
    .from("page_header_settings")
    .select("settings")
    .eq("id", "main")
    .maybeSingle();

  if (error) return readLocalSettings();
  return data?.settings
    ? normalizePageHeaderSettings(data.settings)
    : readLocalSettings();
}

export async function savePageHeaderSettings(settings: PageHeaderSettings) {
  const normalized = normalizePageHeaderSettings(settings);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));

  const { error } = await supabase.from("page_header_settings").upsert(
    {
      id: "main",
      settings: normalized,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) throw error;
  return normalized;
}
