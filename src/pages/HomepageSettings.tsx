import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Home, RotateCcw, Save, Upload } from "lucide-react";
import { Link } from "react-router-dom";

import { notify } from "../services/notificationService";
import {
  getHomepageSettings,
  saveHomepageSettings,
} from "../services/supabase/homepageSettingsService";
import {
  DEFAULT_HOMEPAGE_SETTINGS,
  type HomepageSettings,
} from "../types/homepageSettings";
import useFormDraftState, { hasFormDraft } from "../hooks/useFormDraftState";
import LoadingScreen from "../components/shared/LoadingScreen";

function resizeHeroImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const image = new window.Image();
    const source = URL.createObjectURL(file);

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1920;
      canvas.height = 900;
      const context = canvas.getContext("2d");

      if (!context) {
        URL.revokeObjectURL(source);
        reject(new Error("Canvas is unavailable."));
        return;
      }

      const scale = Math.max(1920 / image.width, 900 / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      context.drawImage(image, (1920 - width) / 2, (900 - height) / 2, width, height);
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

export default function HomepageSettingsPage() {
  const [settings, setSettings] = useFormDraftState<HomepageSettings>("settings.homepage", DEFAULT_HOMEPAGE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      if (hasFormDraft("settings.homepage")) return;
      setSettings(await getHomepageSettings());
    } catch (error) {
      console.error(error);
      notify.fault("Unable to load homepage settings. Showing the defaults.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadSettings(), 0);
    return () => window.clearTimeout(timer);
  }, [loadSettings]);

  function update<K extends keyof HomepageSettings>(key: K, value: HomepageSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function handleImage(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notify.timeout("Please select an image file.");
      return;
    }

    try {
      update("heroImageUrl", await resizeHeroImage(file));
      notify.service("Hero image cropped and compressed to 1920 × 900 WebP.");
    } catch (error) {
      console.error(error);
      notify.fault("Unable to process the hero image.");
    }
  }

  async function handleSave() {
    const required = [
      settings.eyebrowText,
      settings.headingText,
      settings.subheadingText,
      settings.primaryButtonText,
      settings.primaryButtonUrl,
      settings.secondaryButtonText,
      settings.secondaryButtonUrl,
    ];

    if (required.some((value) => !value.trim())) {
      notify.timeout("Complete every homepage text and button field before saving.");
      return;
    }

    setSaving(true);
    try {
      await saveHomepageSettings(settings);
      notify.edgeBall("Homepage settings saved.");
    } catch (error) {
      console.error(error);
      notify.fault("Unable to save homepage settings. Ensure the homepage migration has been applied.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingScreen label="Loading homepage settings..." />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900" to="/settings">
          <ArrowLeft className="h-4 w-4" /> Settings
        </Link>
        <div className="mt-5 flex items-center gap-3 text-blue-700">
          <Home className="h-6 w-6" />
          <span className="text-sm font-semibold uppercase tracking-widest">Public website</span>
        </div>
        <h1 className="mt-3 text-5xl font-normal tracking-tight text-slate-900">Home Page</h1>
        <p className="mt-3 text-lg text-slate-500">Edit the content shown in the full-width homepage hero.</p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div
          className="relative min-h-96 bg-slate-900 bg-cover bg-center p-8 text-white md:p-12"
          style={{ backgroundImage: settings.heroImageUrl ? `url(${settings.heroImageUrl})` : "url('/kiwittr-home-hero.jpg')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/15" />
          <div className="relative max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-300">{settings.eyebrowText}</p>
            <h2 className="mt-4 text-5xl font-normal leading-tight">{settings.headingText}</h2>
            <p className="mt-4 text-lg leading-8 text-slate-200">{settings.subheadingText}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-xl bg-white px-4 py-2 font-semibold text-slate-950">{settings.primaryButtonText}</span>
              <span className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 font-semibold">{settings.secondaryButtonText}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold">Hero image</h2>
            <p className="mt-1 text-sm text-slate-500">Recommended: 1920 × 900 or larger, landscape. Images are center-cropped and compressed to WebP.</p>
          </div>
          <div className="flex gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-700">
              <Upload className="h-4 w-4" /> Upload image
              <input accept="image/*" className="hidden" onChange={(event) => void handleImage(event.target.files?.[0])} type="file" />
            </label>
            {settings.heroImageUrl && (
              <button className="rounded-xl bg-slate-100 px-4 py-3 font-semibold hover:bg-slate-200" onClick={() => update("heroImageUrl", "")} type="button">Use default</button>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700 md:col-span-2">Text above heading
          <input className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100" maxLength={100} onChange={(event) => update("eyebrowText", event.target.value)} value={settings.eyebrowText} />
        </label>
        <label className="text-sm font-semibold text-slate-700 md:col-span-2">Heading
          <input className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100" maxLength={120} onChange={(event) => update("headingText", event.target.value)} value={settings.headingText} />
        </label>
        <label className="text-sm font-semibold text-slate-700 md:col-span-2">Subheading
          <textarea className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100" maxLength={300} onChange={(event) => update("subheadingText", event.target.value)} value={settings.subheadingText} />
        </label>
        <label className="text-sm font-semibold text-slate-700">Primary button text
          <input className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100" maxLength={50} onChange={(event) => update("primaryButtonText", event.target.value)} value={settings.primaryButtonText} />
        </label>
        <label className="text-sm font-semibold text-slate-700">Primary button link
          <input className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100" onChange={(event) => update("primaryButtonUrl", event.target.value)} placeholder="/rankings" value={settings.primaryButtonUrl} />
        </label>
        <label className="text-sm font-semibold text-slate-700">Secondary button text
          <input className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100" maxLength={50} onChange={(event) => update("secondaryButtonText", event.target.value)} value={settings.secondaryButtonText} />
        </label>
        <label className="text-sm font-semibold text-slate-700">Secondary button link
          <input className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100" onChange={(event) => update("secondaryButtonUrl", event.target.value)} placeholder="/register" value={settings.secondaryButtonUrl} />
        </label>
      </section>

      <div className="flex justify-between gap-3">
        <button className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-200" onClick={() => setSettings(DEFAULT_HOMEPAGE_SETTINGS)} type="button">
          <RotateCcw className="h-4 w-4" /> Reset fields
        </button>
        <button className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60" disabled={saving} onClick={() => void handleSave()} type="button">
          <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save home page"}
        </button>
      </div>
    </div>
  );
}
