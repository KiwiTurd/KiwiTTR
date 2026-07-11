import { supabase } from "../../lib/supabase";
import type { Notice } from "../../types/notice";

type NoticeRow = {
  id: string;
  title: string;
  message: string;
  is_active: boolean;
  published_at: string;
  created_at: string;
};

function fromRow(row: NoticeRow): Notice {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    isActive: row.is_active,
    publishedAt: row.published_at,
    createdAt: row.created_at,
  };
}

export async function getLatestNotice(): Promise<Notice | null> {
  const { data, error } = await supabase
    .from("notices")
    .select("*")
    .eq("is_active", true)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? fromRow(data as NoticeRow) : null;
}

export async function getNotices(): Promise<Notice[]> {
  const { data, error } = await supabase
    .from("notices")
    .select("*")
    .order("published_at", { ascending: false });

  if (error) throw error;
  return (data as NoticeRow[]).map(fromRow);
}

export async function createNotice(input: { title: string; message: string }) {
  const { error } = await supabase.from("notices").insert({
    title: input.title.trim(),
    message: input.message.trim(),
    is_active: true,
    published_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export async function setNoticeActive(id: string, isActive: boolean) {
  const { error } = await supabase
    .from("notices")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteNotice(id: string) {
  const { error } = await supabase.from("notices").delete().eq("id", id);
  if (error) throw error;
}
