import { supabase } from "../../lib/supabase";
import type { SeoMetadata } from "../../types/seoMetadata";

type SeoMetadataRow = {
  path: string;
  title_tag: string;
  meta_description: string;
  keywords: string[] | null;
  meta_image_url: string | null;
};

function fromRow(row: SeoMetadataRow): SeoMetadata {
  const keywords = [...(row.keywords ?? [])].slice(0, 3);
  while (keywords.length < 3) keywords.push("");

  return {
    path: row.path,
    title: row.title_tag,
    description: row.meta_description,
    keywords: keywords as [string, string, string],
    imageUrl: row.meta_image_url ?? "",
  };
}

export async function getSeoMetadata(): Promise<SeoMetadata[]> {
  const { data, error } = await supabase.from("seo_metadata").select("*");
  if (error) throw error;
  return (data as SeoMetadataRow[]).map(fromRow);
}

export async function saveSeoMetadata(metadata: SeoMetadata) {
  const { error } = await supabase.from("seo_metadata").upsert({
    path: metadata.path,
    title_tag: metadata.title.trim(),
    meta_description: metadata.description.trim(),
    keywords: metadata.keywords.map((keyword) => keyword.trim()).filter(Boolean),
    meta_image_url: metadata.imageUrl || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "path" });

  if (error) throw error;
}
