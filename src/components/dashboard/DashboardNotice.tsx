import { useEffect, useState } from "react";
import { Bell, Megaphone, X } from "lucide-react";

import { getLatestNotice } from "../../services/supabase/noticeService";
import type { Notice } from "../../types/notice";

const DISMISSED_KEY = "kiwittr-dismissed-notices";

function getDismissedNotices(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export default function DashboardNotice() {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void getLatestNotice()
      .then((latest) => {
        setNotice(latest);
        setOpen(Boolean(latest && !getDismissedNotices().includes(latest.id)));
      })
      .catch((error) => console.warn("Unable to load dashboard notice.", error));
  }, []);

  function dismiss() {
    if (!notice) return;
    const dismissed = new Set(getDismissedNotices());
    dismissed.add(notice.id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissed].slice(-50)));
    setOpen(false);
  }

  if (!notice) return null;

  return (
    <div className="fixed bottom-24 right-4 z-50 md:bottom-5 md:right-5">
      {open && (
        <aside className="absolute bottom-12 right-0 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" aria-label="Notice board">
          <div className="flex items-start gap-3 bg-slate-900 px-4 py-3 text-white">
            <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Notice board</p>
              <h2 className="text-balance break-words text-sm font-bold leading-5">
                {notice.title}
              </h2>
            </div>
            <button aria-label="Close notice" className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white" onClick={dismiss} type="button">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-4 py-3">
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{notice.message}</p>
            <p className="mt-3 text-[11px] text-slate-400">
              {new Intl.DateTimeFormat("en-NZ", { day: "numeric", month: "short", year: "numeric" }).format(new Date(notice.publishedAt))}
            </p>
          </div>
        </aside>
      )}

      <button aria-label={open ? "Hide notice" : "Open notice board"} className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-white shadow-lg transition hover:scale-105 hover:bg-slate-700" onClick={() => setOpen((current) => !current)} title="Notice board" type="button">
        <Bell className="h-4 w-4" />
      </button>
    </div>
  );
}
