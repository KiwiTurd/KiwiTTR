import { useEffect, useState, type ChangeEvent } from "react";
import {
  ArrowLeft,
  ChevronDown,
  Image as ImageIcon,
  RotateCcw,
  Save,
  Upload,
} from "lucide-react";
import { Link } from "react-router-dom";

import LoadingScreen from "../components/shared/LoadingScreen";
import SlateImagePageHeader from "../components/shared/SlateImagePageHeader";
import { usePageHeaderSettings } from "../context/PageHeaderSettingsContext";
import { notify } from "../services/notificationService";
import {
  getPageHeaderSettings,
  savePageHeaderSettings,
} from "../services/supabase/pageHeaderSettingsService";
import {
  DEFAULT_PAGE_HEADER_STYLE,
  PAGE_HEADER_CATALOG,
  PAGE_HEADER_GROUPS,
  type PageHeaderKey,
  type PageHeaderSettings,
} from "../types/pageHeaderSettings";

function resizeHeaderImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const image = new window.Image();
    const source = URL.createObjectURL(file);

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1920;
      canvas.height = 700;
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(source);
        reject(new Error("Canvas is unavailable."));
        return;
      }

      const scale = Math.max(canvas.width / image.width, canvas.height / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      context.drawImage(
        image,
        (canvas.width - width) / 2,
        (canvas.height - height) / 2,
        width,
        height
      );
      URL.revokeObjectURL(source);
      resolve(canvas.toDataURL("image/webp", 0.76));
    };

    image.onerror = () => {
      URL.revokeObjectURL(source);
      reject(new Error("Unable to decode the image."));
    };
    image.src = source;
  });
}

function previewGradient(colour: string) {
  const value = Number.parseInt(colour.slice(1), 16);
  const rgb = `${value >> 16}, ${(value >> 8) & 255}, ${value & 255}`;
  return `linear-gradient(90deg, rgba(${rgb}, .92), rgba(${rgb}, .72), rgba(${rgb}, .58))`;
}

const HEIGHT_OPTIONS = [
  { value: "thin", label: "Thin", description: "Compact" },
  { value: "standard", label: "Standard", description: "Current" },
  { value: "thick", label: "Thick", description: "Feature" },
] as const;

export default function PageHeaderSettingsPage() {
  const { replaceSettings } = usePageHeaderSettings();
  const [settings, setSettings] = useState<PageHeaderSettings | null>(null);
  const [openPage, setOpenPage] = useState<PageHeaderKey | null>("dashboard");
  const [openGroup, setOpenGroup] = useState<string | null>("general");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPageHeaderSettings()
      .then(setSettings)
      .catch(() => notify.fault("Unable to load page header settings."));
  }, []);

  function update(key: PageHeaderKey, values: Partial<PageHeaderSettings[PageHeaderKey]>) {
    setSettings((current) => current ? {
      ...current,
      [key]: { ...current[key], ...values },
    } : current);
  }

  async function upload(key: PageHeaderKey, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      update(key, { imageUrl: await resizeHeaderImage(file) });
      notify.service("Image cropped and compressed to 1920 × 700 WebP.");
    } catch (error) {
      console.error(error);
      notify.fault("Unable to process the header image.");
    }
  }

  async function save() {
    if (!settings) return;
    setSaving(true);
    try {
      const saved = await savePageHeaderSettings(settings);
      replaceSettings(saved);
      notify.edgeBall("Page headers saved.");
    } catch (error) {
      console.error(error);
      notify.fault("Unable to save page headers. Ensure the latest database migration is applied.");
    } finally {
      setSaving(false);
    }
  }

  if (!settings) return <LoadingScreen label="Loading page headers..." />;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <SlateImagePageHeader
        pageKey="customise-pages"
        title="Customise Pages"
        subtitle="Choose the image and fade treatment used by each page header."
      />

      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900" to="/settings">
        <ArrowLeft className="h-4 w-4" /> Back to Settings
      </Link>

      <div className="space-y-3">
        {PAGE_HEADER_GROUPS.map((group) => {
          const groupOpen = openGroup === group.id;

          return (
            <section key={group.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                aria-expanded={groupOpen}
                onClick={() => setOpenGroup(groupOpen ? null : group.id)}
                className="flex w-full items-center gap-4 px-6 py-5 text-left transition hover:bg-slate-50"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-lg font-bold text-blue-800">
                  {group.pages.length}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-slate-950">{group.label}</h2>
                  <p className="mt-1 text-sm text-slate-500">{group.description}</p>
                </div>
                <ChevronDown className={`h-5 w-5 text-slate-400 transition ${groupOpen ? "rotate-180" : ""}`} />
              </button>

              {groupOpen && (
                <div className="space-y-3 border-t border-slate-200 bg-slate-50/60 p-3 md:p-4">
                  {group.pages.map((key) => {
          const label = PAGE_HEADER_CATALOG.find((page) => page.key === key)!.label;
          const item = settings[key];
          const open = openPage === key;
          const backgroundImage = item.fadeEnabled
            ? `${previewGradient(item.fadeColor)}, url('${item.imageUrl}')`
            : `url('${item.imageUrl}')`;

          return (
            <section key={key} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenPage(open ? null : key)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-slate-50"
              >
                <div className="h-12 w-20 shrink-0 rounded-lg bg-slate-900 bg-cover bg-center" style={{ backgroundImage }} />
                <div className="flex-1">
                  <h2 className="font-bold text-slate-950">{label}</h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {item.fadeEnabled ? `Fade ${item.fadeColor}` : "Fade off"}
                  </p>
                </div>
                <ChevronDown className={`h-5 w-5 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
              </button>

              {open && (
                <div className="grid gap-6 border-t border-slate-200 p-5 lg:grid-cols-[1.35fr_1fr]">
                  <div
                    className={`relative flex items-end rounded-xl bg-slate-900 bg-cover bg-center p-6 text-white transition-[min-height] ${
                      item.height === "thin"
                        ? "min-h-36"
                        : item.height === "thick"
                          ? "min-h-64"
                          : "min-h-48"
                    }`}
                    style={{ backgroundImage }}
                  >
                    {item.height !== "thin" && (
                      <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-950/65 px-3 py-2 text-xs font-semibold text-white shadow-sm backdrop-blur-md">
                        ← Back
                      </span>
                    )}
                    <div>
                      <p className="text-3xl font-normal">{label}</p>
                      <p className="mt-2 text-sm text-white/80">Page header preview</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <fieldset>
                      <legend className="text-sm font-semibold text-slate-700">Header height</legend>
                      <div className="mt-2 grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1.5">
                        {HEIGHT_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            aria-pressed={item.height === option.value}
                            onClick={() => update(key, { height: option.value })}
                            className={`rounded-lg px-2 py-2.5 text-center transition ${
                              item.height === option.value
                                ? "bg-white text-blue-900 shadow-sm ring-1 ring-slate-200"
                                : "text-slate-500 hover:text-slate-900"
                            }`}
                          >
                            <span className="block text-sm font-bold">{option.label}</span>
                            <span className="block text-[11px] opacity-70">{option.description}</span>
                          </button>
                        ))}
                      </div>
                    </fieldset>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold">Colour fade</p>
                        <p className="text-sm text-slate-500">Add contrast behind the header text.</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={item.fadeEnabled}
                        onClick={() => update(key, { fadeEnabled: !item.fadeEnabled })}
                        className={`relative h-7 w-12 rounded-full transition ${item.fadeEnabled ? "bg-blue-700" : "bg-slate-300"}`}
                      >
                        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${item.fadeEnabled ? "left-6" : "left-1"}`} />
                      </button>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">Fade colour</span>
                      <div className="flex gap-3">
                        <input
                          type="color"
                          value={item.fadeColor}
                          disabled={!item.fadeEnabled}
                          onChange={(event) => update(key, { fadeColor: event.target.value })}
                          className="h-11 w-14 rounded-lg border border-slate-300 bg-white p-1 disabled:opacity-40"
                        />
                        <input
                          type="text"
                          value={item.fadeColor}
                          disabled={!item.fadeEnabled}
                          onChange={(event) => /^#[0-9a-f]{0,6}$/i.test(event.target.value) && update(key, { fadeColor: event.target.value })}
                          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 uppercase disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </div>
                    </label>

                    <div className="flex flex-wrap gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
                        <Upload className="h-4 w-4" /> Change picture
                        <input className="sr-only" type="file" accept="image/*" onChange={(event) => upload(key, event)} />
                      </label>
                      <button
                        type="button"
                        onClick={() => update(key, { ...DEFAULT_PAGE_HEADER_STYLE })}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <RotateCcw className="h-4 w-4" /> Reset
                      </button>
                    </div>
                    <p className="flex items-center gap-2 text-xs text-slate-500">
                      <ImageIcon className="h-4 w-4" /> Images are cropped to a wide 1920 × 700 header.
                    </p>
                  </div>
                </div>
              )}
            </section>
          );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="sticky bottom-5 flex justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white shadow-lg hover:bg-blue-800 disabled:opacity-60"
        >
          <Save className="h-5 w-5" /> {saving ? "Saving..." : "Save page headers"}
        </button>
      </div>
    </div>
  );
}
