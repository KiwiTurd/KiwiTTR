import { useCallback, useEffect, useState } from "react";
import { Image, RotateCcw, Save, Upload } from "lucide-react";

import { SEO_PAGES } from "../config/seoPages";
import { getSeoMetadata, saveSeoMetadata } from "../services/supabase/seoMetadataService";
import { notify } from "../services/notificationService";
import type { SeoMetadata } from "../types/seoMetadata";
import useFormDraftState, { hasFormDraft } from "../hooks/useFormDraftState";
import LoadingScreen from "../components/shared/LoadingScreen";
import SlateImagePageHeader from "../components/shared/SlateImagePageHeader";

type SeoEditorRow = SeoMetadata & { label: string };

function defaultRows(): SeoEditorRow[] {
  return SEO_PAGES.map((page) => ({
    path: page.path,
    label: page.label,
    title: page.title,
    description: page.description,
    keywords: [...page.keywords],
    imageUrl: "",
  }));
}

function resizeSeoImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const image = new window.Image();
    const source = URL.createObjectURL(file);

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 420;
      const context = canvas.getContext("2d");

      if (!context) {
        URL.revokeObjectURL(source);
        reject(new Error("Canvas is unavailable."));
        return;
      }

      const scale = Math.max(800 / image.width, 420 / image.height);
      const width = image.width * scale;
      const height = image.height * scale;

      context.drawImage(image, (800 - width) / 2, (420 - height) / 2, width, height);
      URL.revokeObjectURL(source);
      resolve(canvas.toDataURL("image/webp", 0.78));
    };

    image.onerror = () => {
      URL.revokeObjectURL(source);
      reject(new Error("Unable to decode the selected image."));
    };

    image.src = source;
  });
}

export default function SeoMetadataSettings() {
  const [rows, setRows] = useFormDraftState<SeoEditorRow[]>("settings.seo.rows", defaultRows);
  const [loading, setLoading] = useState(true);
  const [savingPath, setSavingPath] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      if (hasFormDraft("settings.seo.rows")) return;
      const saved = await getSeoMetadata();
      setRows(defaultRows().map((row) => {
        const custom = saved.find((item) => item.path === row.path);
        return custom ? { ...row, ...custom } : row;
      }));
    } catch (error) {
      console.error(error);
      notify.fault("Unable to load saved SEO metadata. Showing the generated defaults.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  function updateRow(path: string, changes: Partial<SeoEditorRow>) {
    setRows((current) => current.map((row) => row.path === path ? { ...row, ...changes } : row));
  }

  function updateKeyword(row: SeoEditorRow, index: number, value: string) {
    const keywords: [string, string, string] = [...row.keywords];
    keywords[index] = value;
    updateRow(row.path, { keywords });
  }

  async function handleImage(path: string, file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notify.timeout("Please select an image file.");
      return;
    }

    try {
      updateRow(path, { imageUrl: await resizeSeoImage(file) });
      notify.service("Image cropped and compressed to 800 × 420 WebP.");
    } catch (error) {
      console.error(error);
      notify.fault("Unable to process that image.");
    }
  }

  async function handleSave(row: SeoEditorRow) {
    if (!row.title.trim()) {
      notify.timeout("A title tag is required.");
      return;
    }

    setSavingPath(row.path);
    try {
      await saveSeoMetadata(row);
      notify.edgeBall(`${row.label} metadata has been saved.`);
    } catch (error) {
      console.error(error);
      notify.fault("Unable to save SEO metadata. Ensure the SEO migration has been applied.");
    } finally {
      setSavingPath(null);
    }
  }

  function restoreDefaults(path: string) {
    const row = defaultRows().find((item) => item.path === path);
    if (row) updateRow(path, { ...row, imageUrl: "" });
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-8">
      <SlateImagePageHeader pageKey="seo-settings" title="SEO Metadata" subtitle="Edit how each KiwiTTR page appears in search and social previews." />

      {loading ? (
        <LoadingScreen label="Loading metadata..." />
      ) : (
        <div className="space-y-5">
          {rows.map((row) => (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" key={row.path}>
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
                <div>
                  <h2 className="font-bold text-slate-900">{row.label}</h2>
                  <code className="text-xs text-slate-500">{row.path}</code>
                </div>
                <div className="flex gap-2">
                  <button className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200" onClick={() => restoreDefaults(row.path)} type="button">
                    <RotateCcw className="h-4 w-4" /> Reset
                  </button>
                  <button className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60" disabled={savingPath === row.path} onClick={() => void handleSave(row)} type="button">
                    <Save className="h-4 w-4" /> {savingPath === row.path ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>

              <div className="grid gap-5 p-5 xl:grid-cols-[1.1fr_1.5fr_1.15fr_0.9fr]">
                <label className="block text-sm font-semibold text-slate-700">
                  1. Title Tag
                  <input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100" maxLength={70} onChange={(event) => updateRow(row.path, { title: event.target.value })} value={row.title} />
                  <span className="mt-1 block text-right text-xs text-slate-400">{row.title.length}/70</span>
                </label>

                <label className="block text-sm font-semibold text-slate-700">
                  2. Meta Description
                  <textarea className="mt-2 min-h-24 w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100" maxLength={150} onChange={(event) => updateRow(row.path, { description: event.target.value })} value={row.description} />
                  <span className="mt-1 block text-right text-xs text-slate-400">{row.description.length}/150</span>
                </label>

                <fieldset>
                  <legend className="text-sm font-semibold text-slate-700">3. Key Words</legend>
                  <div className="mt-2 space-y-2">
                    {row.keywords.map((keyword, index) => (
                      <input aria-label={`Keyword ${index + 1}`} className="w-full rounded-xl border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100" key={index} onChange={(event) => updateKeyword(row, index, event.target.value)} placeholder={`Keyword ${index + 1}`} value={keyword} />
                    ))}
                  </div>
                </fieldset>

                <div>
                  <p className="text-sm font-semibold text-slate-700">4. Meta Image</p>
                  <div className="mt-2 flex aspect-[40/21] items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
                    {row.imageUrl ? <img alt="SEO preview" className="h-full w-full object-cover" src={row.imageUrl} /> : <Image className="h-8 w-8 text-slate-300" />}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <label className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700">
                      <Upload className="h-3.5 w-3.5" /> Upload
                      <input accept="image/*" className="hidden" onChange={(event) => void handleImage(row.path, event.target.files?.[0])} type="file" />
                    </label>
                    {row.imageUrl && <button className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold hover:bg-slate-200" onClick={() => updateRow(row.path, { imageUrl: "" })} type="button">Remove</button>}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Auto-cropped to 800 × 420</p>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
