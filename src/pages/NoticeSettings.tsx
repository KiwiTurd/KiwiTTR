import { useCallback, useEffect, useState } from "react";
import { Bell, Megaphone, Plus, Trash2 } from "lucide-react";
import { useOutletContext } from "react-router-dom";

import { createNotice, deleteNotice, getNotices, setNoticeActive } from "../services/supabase/noticeService";
import { notify } from "../services/notificationService";
import type { Notice } from "../types/notice";
import type { AppLayoutOutletContext } from "./AppLayout";

export default function NoticeSettings() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const { noticeDraft: draft, setNoticeDraft: setDraft } =
    useOutletContext<AppLayoutOutletContext>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { title, message } = draft;

  function updateDraft(changes: Partial<typeof draft>) {
    setDraft((current) => {
      return { ...current, ...changes };
    });
  }

  const loadNotices = useCallback(async () => {
    try {
      setNotices(await getNotices());
    } catch (error) {
      console.error(error);
      notify.fault("Unable to load notices. Ensure the notices migration has been applied.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadNotices(), 0);
    return () => window.clearTimeout(timer);
  }, [loadNotices]);

  async function publishNotice() {
    if (!title.trim() || !message.trim()) {
      notify.timeout("Add both a title and message before publishing.");
      return;
    }

    setSaving(true);
    try {
      await createNotice({ title, message });
      setDraft({ title: "", message: "" });
      await loadNotices();
      notify.edgeBall("The notice is now live on everyone's dashboard.");
    } catch (error) {
      console.error(error);
      notify.fault("Unable to publish the notice.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleNotice(notice: Notice) {
    try {
      await setNoticeActive(notice.id, !notice.isActive);
      await loadNotices();
    } catch (error) {
      console.error(error);
      notify.fault("Unable to update the notice.");
    }
  }

  async function removeNotice(notice: Notice) {
    if (!window.confirm(`Delete “${notice.title}”?`)) return;
    try {
      await deleteNotice(notice.id);
      await loadNotices();
      notify.edgeBall("Notice deleted.");
    } catch (error) {
      console.error(error);
      notify.fault("Unable to delete the notice.");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
          <Megaphone className="h-4 w-4" /> Communications
        </div>
        <h1 className="mt-4 text-4xl font-normal tracking-tight text-slate-900 md:text-5xl">Notices and News</h1>
        <p className="mt-3 text-lg text-slate-500">Publish a compact announcement to everyone visiting the KiwiTTR dashboard.</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">New notice</h2>
        <div className="mt-5 space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            Title
            <input className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100" maxLength={100} onChange={(event) => updateDraft({ title: event.target.value })} placeholder="Competition update" value={title} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Message
            <textarea className="mt-2 min-h-32 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100" maxLength={1000} onChange={(event) => updateDraft({ message: event.target.value })} placeholder="Share news, maintenance information or an important update…" value={message} />
            <span className="mt-1 block text-right text-xs text-slate-400">{message.length}/1000</span>
          </label>
          <button className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60" disabled={saving} onClick={() => void publishNotice()} type="button">
            <Plus className="h-4 w-4" /> {saving ? "Publishing…" : "Publish notice"}
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold">Previous notices</h2>
        <div className="mt-4 space-y-3">
          {loading ? <p className="text-slate-500">Loading notices…</p> : notices.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">No notices have been published yet.</div>
          ) : notices.map((notice) => (
            <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start" key={notice.id}>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${notice.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                <Bell className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold">{notice.title}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${notice.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{notice.isActive ? "Live" : "Hidden"}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">{notice.message}</p>
                <p className="mt-2 text-xs text-slate-400">Published {new Date(notice.publishedAt).toLocaleString("en-NZ")}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold hover:bg-slate-200" onClick={() => void toggleNotice(notice)} type="button">{notice.isActive ? "Hide" : "Make live"}</button>
                <button aria-label={`Delete ${notice.title}`} className="rounded-lg bg-red-50 p-2 text-red-700 hover:bg-red-100" onClick={() => void removeNotice(notice)} type="button"><Trash2 className="h-4 w-4" /></button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
