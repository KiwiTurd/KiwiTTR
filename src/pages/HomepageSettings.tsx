import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { Link } from "react-router-dom";

import { notify } from "../services/notificationService";
import {
  getHomepageSettings,
  saveHomepageSettings,
} from "../services/supabase/homepageSettingsService";
import {
  DEFAULT_HOMEPAGE_SETTINGS,
  normalizeHomepageSettings,
  type HomepageHeroSlide,
  type HomepageSettings,
} from "../types/homepageSettings";
import useFormDraftState, {
  hasFormDraft,
} from "../hooks/useFormDraftState";
import LoadingScreen from "../components/shared/LoadingScreen";
import KiwiTtrIcon from "../assets/KIWITTR - Logo.svg?react";
import SlateImagePageHeader from "../components/shared/SlateImagePageHeader";

function resizeHeroImage(
  file: File,
  targetWidth: number,
  targetHeight: number
) {
  return new Promise<string>((resolve, reject) => {
    const image = new window.Image();
    const source = URL.createObjectURL(file);

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const context = canvas.getContext("2d");

      if (!context) {
        URL.revokeObjectURL(source);
        reject(new Error("Canvas is unavailable."));
        return;
      }

      const scale = Math.max(
        targetWidth / image.width,
        targetHeight / image.height
      );
      const width = image.width * scale;
      const height = image.height * scale;
      context.drawImage(
        image,
        (targetWidth - width) / 2,
        (targetHeight - height) / 2,
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

export default function HomepageSettingsPage() {
  const [draftSettings, setDraftSettings] =
    useFormDraftState<HomepageSettings>(
      "settings.homepage",
      DEFAULT_HOMEPAGE_SETTINGS
    );
  const settings = useMemo(
    () => normalizeHomepageSettings(draftSettings),
    [draftSettings]
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      if (hasFormDraft("settings.homepage")) return;
      setDraftSettings(await getHomepageSettings());
    } catch (error) {
      console.error(error);
      notify.fault(
        "Unable to load homepage settings. Showing the defaults."
      );
    } finally {
      setLoading(false);
    }
  }, [setDraftSettings]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => void loadSettings(),
      0
    );
    return () => window.clearTimeout(timer);
  }, [loadSettings]);

  function setSlides(
    update: (
      slides: HomepageHeroSlide[]
    ) => HomepageHeroSlide[]
  ) {
    setDraftSettings((current) => {
      const normalized = normalizeHomepageSettings(current);
      return {
        heroSlides: update(normalized.heroSlides),
      };
    });
  }

  function updateSlide<K extends keyof HomepageHeroSlide>(
    slideId: string,
    key: K,
    value: HomepageHeroSlide[K]
  ) {
    setSlides((slides) =>
      slides.map((slide) =>
        slide.id === slideId
          ? { ...slide, [key]: value }
          : slide
      )
    );
  }

  function addSlide() {
    setSlides((slides) => {
      const template =
        slides[slides.length - 1] ??
        DEFAULT_HOMEPAGE_SETTINGS.heroSlides[0];

      return [
        ...slides,
        {
          ...template,
          id: crypto.randomUUID(),
          headingText: "New rotating header",
        },
      ];
    });
  }

  function removeSlide(slideId: string) {
    setSlides((slides) =>
      slides.length > 1
        ? slides.filter((slide) => slide.id !== slideId)
        : slides
    );
  }

  function moveSlide(index: number, direction: -1 | 1) {
    setSlides((slides) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= slides.length) {
        return slides;
      }

      const next = [...slides];
      [next[index], next[nextIndex]] = [
        next[nextIndex],
        next[index],
      ];
      return next;
    });
  }

  async function handleImage(
    slideId: string,
    field: "heroImageUrl" | "mobileHeroImageUrl",
    file?: File
  ) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notify.timeout("Please select an image file.");
      return;
    }

    const mobile = field === "mobileHeroImageUrl";

    try {
      const imageUrl = await resizeHeroImage(
        file,
        mobile ? 900 : 1920,
        mobile ? 1000 : 900
      );
      updateSlide(slideId, field, imageUrl);
      notify.service(
        mobile
          ? "Mobile image cropped and compressed to 900 × 1000 WebP."
          : "Desktop image cropped and compressed to 1920 × 900 WebP."
      );
    } catch (error) {
      console.error(error);
      notify.fault("Unable to process the header image.");
    }
  }

  async function handleSave() {
    const incompleteSlide = settings.heroSlides.find(
      (slide) =>
        [
          slide.eyebrowText,
          slide.headingText,
          slide.subheadingText,
          slide.primaryButtonText,
          slide.primaryButtonUrl,
          slide.secondaryButtonText,
          slide.secondaryButtonUrl,
        ].some((value) => !value.trim())
    );

    if (incompleteSlide) {
      notify.timeout(
        "Complete every header text and button field before saving."
      );
      return;
    }

    setSaving(true);
    try {
      await saveHomepageSettings(settings);
      notify.edgeBall("Homepage settings saved.");
    } catch (error) {
      console.error(error);
      notify.fault(
        "Unable to save homepage settings. Ensure the rotating headers migration has been applied."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingScreen label="Loading homepage settings..." />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <SlateImagePageHeader pageKey="homepage-settings" title="Homepage Settings" subtitle="Add, order and preview the rotating homepage headers." />
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900" to="/settings">
        <ArrowLeft className="h-4 w-4" /> Settings
      </Link>

      <div className="space-y-8">
        {settings.heroSlides.map((slide, index) => (
          <section
            key={slide.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50 px-5 py-4">
              <div>
                <h2 className="text-xl font-bold">
                  Header {index + 1}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {index === 0
                    ? "The first header uses the page H1."
                    : "This rotating header uses an H2."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={`Move header ${index + 1} up`}
                  disabled={index === 0}
                  onClick={() => moveSlide(index, -1)}
                  className="rounded-lg border bg-white p-2 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Move header ${index + 1} down`}
                  disabled={
                    index === settings.heroSlides.length - 1
                  }
                  onClick={() => moveSlide(index, 1)}
                  className="rounded-lg border bg-white p-2 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Remove header ${index + 1}`}
                  disabled={settings.heroSlides.length === 1}
                  onClick={() => removeSlide(slide.id)}
                  className="rounded-lg border border-red-200 bg-white p-2 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div
              className="relative min-h-96 bg-slate-900 bg-cover bg-center p-8 text-white md:p-12"
              style={{
                backgroundImage: slide.heroImageUrl
                  ? `url(${slide.heroImageUrl})`
                  : "url('/kiwittr-home-hero.jpg')",
              }}
            >
              {slide.slateFade && (
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/15" />
              )}
              {slide.showKoru && (
                <KiwiTtrIcon
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-[22%] top-1/2 z-[1] w-[min(58rem,75vw)] max-w-none -translate-y-1/2 fill-slate-500 opacity-40 mix-blend-multiply"
                  focusable="false"
                />
              )}
              <div className="relative z-10 max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-widest text-blue-300">
                  {slide.eyebrowText}
                </p>
                <h3 className="mt-4 text-5xl font-normal leading-tight">
                  {slide.headingText}
                </h3>
                <p className="mt-4 text-lg leading-8 text-slate-200">
                  {slide.subheadingText}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <span className="rounded-xl bg-white px-4 py-2 font-semibold text-slate-950">
                    {slide.primaryButtonText}
                  </span>
                  <span className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 font-semibold">
                    {slide.secondaryButtonText}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-5 border-t p-5 lg:grid-cols-2">
              <ImageControl
                description="Recommended: 1920 × 900 or larger, landscape."
                hasImage={Boolean(slide.heroImageUrl)}
                label="Desktop header image"
                onClear={() =>
                  updateSlide(slide.id, "heroImageUrl", "")
                }
                onImage={(file) =>
                  void handleImage(
                    slide.id,
                    "heroImageUrl",
                    file
                  )
                }
              />
              <ImageControl
                description="Recommended: 900 × 1000 or larger, portrait. Falls back to desktop when empty."
                hasImage={Boolean(slide.mobileHeroImageUrl)}
                label="Mobile header image"
                onClear={() =>
                  updateSlide(
                    slide.id,
                    "mobileHeroImageUrl",
                    ""
                  )
                }
                onImage={(file) =>
                  void handleImage(
                    slide.id,
                    "mobileHeroImageUrl",
                    file
                  )
                }
              />
            </div>

            <div className="grid gap-5 border-t p-6 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border bg-slate-50 p-4">
                <input
                  type="checkbox"
                  checked={slide.slateFade}
                  onChange={(event) =>
                    updateSlide(
                      slide.id,
                      "slateFade",
                      event.target.checked
                    )
                  }
                  className="h-5 w-5"
                />
                <span>
                  <strong className="block">Slate image fade</strong>
                  <span className="text-sm text-slate-500">
                    Add the dark left-to-right overlay behind the text.
                  </span>
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-xl border bg-slate-50 p-4">
                <input
                  type="checkbox"
                  checked={slide.showKoru}
                  onChange={(event) =>
                    updateSlide(
                      slide.id,
                      "showKoru",
                      event.target.checked
                    )
                  }
                  className="h-5 w-5"
                />
                <span>
                  <strong className="block">Show koru</strong>
                  <span className="text-sm text-slate-500">
                    Display the KiwiTTR koru behind the header content.
                  </span>
                </span>
              </label>

              <TextField
                className="md:col-span-2"
                label="Text above heading"
                maxLength={100}
                onChange={(value) =>
                  updateSlide(slide.id, "eyebrowText", value)
                }
                value={slide.eyebrowText}
              />
              <TextField
                className="md:col-span-2"
                label="Heading"
                maxLength={120}
                onChange={(value) =>
                  updateSlide(slide.id, "headingText", value)
                }
                value={slide.headingText}
              />
              <label className="text-sm font-semibold text-slate-700 md:col-span-2">
                Subheading
                <textarea
                  className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                  maxLength={300}
                  onChange={(event) =>
                    updateSlide(
                      slide.id,
                      "subheadingText",
                      event.target.value
                    )
                  }
                  value={slide.subheadingText}
                />
              </label>
              <TextField
                label="Primary button text"
                maxLength={50}
                onChange={(value) =>
                  updateSlide(
                    slide.id,
                    "primaryButtonText",
                    value
                  )
                }
                value={slide.primaryButtonText}
              />
              <TextField
                label="Primary button link"
                onChange={(value) =>
                  updateSlide(
                    slide.id,
                    "primaryButtonUrl",
                    value
                  )
                }
                placeholder="/rankings"
                value={slide.primaryButtonUrl}
              />
              <TextField
                label="Secondary button text"
                maxLength={50}
                onChange={(value) =>
                  updateSlide(
                    slide.id,
                    "secondaryButtonText",
                    value
                  )
                }
                value={slide.secondaryButtonText}
              />
              <TextField
                label="Secondary button link"
                onChange={(value) =>
                  updateSlide(
                    slide.id,
                    "secondaryButtonUrl",
                    value
                  )
                }
                placeholder="/register"
                value={slide.secondaryButtonUrl}
              />
            </div>
          </section>
        ))}
      </div>

      <button
        type="button"
        onClick={addSlide}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white px-5 py-5 font-semibold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50"
      >
        <Plus className="h-5 w-5" /> Add rotating header
      </button>

      <div className="flex justify-between gap-3">
        <button
          className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-200"
          onClick={() =>
            setDraftSettings({
              heroSlides:
                DEFAULT_HOMEPAGE_SETTINGS.heroSlides.map(
                  (slide) => ({ ...slide })
                ),
            })
          }
          type="button"
        >
          <RotateCcw className="h-4 w-4" /> Reset fields
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
          disabled={saving}
          onClick={() => void handleSave()}
          type="button"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save page headers"}
        </button>
      </div>
    </div>
  );
}

function ImageControl({
  description,
  hasImage,
  label,
  onClear,
  onImage,
}: {
  description: string;
  hasImage: boolean;
  label: string;
  onClear: () => void;
  onImage: (file?: File) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="font-bold">{label}</h3>
        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700">
          <Upload className="h-4 w-4" /> Upload
          <input
            accept="image/*"
            className="hidden"
            onChange={(event) =>
              onImage(event.target.files?.[0])
            }
            type="file"
          />
        </label>
        {hasImage && (
          <button
            className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold hover:bg-slate-200"
            onClick={onClear}
            type="button"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

function TextField({
  className = "",
  label,
  maxLength,
  onChange,
  placeholder,
  value,
}: {
  className?: string;
  label: string;
  maxLength?: number;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label
      className={`text-sm font-semibold text-slate-700 ${className}`}
    >
      {label}
      <input
        className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}
