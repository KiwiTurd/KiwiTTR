import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useSidebar } from "../../context/SidebarContext";
import { usePageHeaderSettings } from "../../context/PageHeaderSettingsContext";
import type { PageHeaderKey } from "../../types/pageHeaderSettings";

type Props = {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  pageKey: PageHeaderKey;
};

function rgba(hex: string, alpha: number) {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgba(${value >> 16}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

export default function SlateImagePageHeader({
  title,
  subtitle,
  actions,
  pageKey,
}: Props) {
  const navigate = useNavigate();
  const { collapsed, navigationLayout } = useSidebar();
  const { settings } = usePageHeaderSettings();
  const style = settings[pageKey];
  const heightClassName = {
    thin: "min-h-36 py-5 md:min-h-48 md:py-8",
    standard: "min-h-48 py-6 md:min-h-64 md:py-12",
    thick: "min-h-60 py-8 md:min-h-96 md:py-16",
  }[style.height];
  const widthClassName = navigationLayout === "sidebar"
    ? collapsed
      ? "md:w-[calc(100dvw-5rem)]"
      : "md:w-[calc(100dvw-18rem)]"
    : "md:w-dvw";

  return (
    <section
      className={`relative left-1/2 -mt-4 flex w-dvw -translate-x-1/2 items-end overflow-hidden bg-slate-900 text-white shadow-sm md:-mt-8 ${heightClassName} ${widthClassName}`}
      style={{
        backgroundImage: style.fadeEnabled
          ? `linear-gradient(90deg, ${rgba(style.fadeColor, 0.92)}, ${rgba(style.fadeColor, 0.72)}, ${rgba(style.fadeColor, 0.58)}), url('${style.imageUrl}')`
          : `url('${style.imageUrl}')`,
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      {style.height !== "thin" && (
        <div className="absolute inset-x-0 top-4 z-10 mx-auto w-full max-w-7xl px-4 md:top-8 md:px-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/65 px-3 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-md transition duration-200 hover:scale-105 hover:bg-slate-950/80 focus-visible:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 active:scale-95 md:px-4 md:py-2.5 md:text-base"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      )}

      <div className="slate-image-page-header-copy mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 md:flex-row md:items-end md:justify-between md:gap-6 md:px-8">
        <div>
          <h1 className="text-4xl font-normal tracking-tight text-white md:text-5xl">
            {title}
          </h1>
          <p className="mt-3 text-lg text-white/80">
            {subtitle}
          </p>
        </div>

        {actions}
      </div>
    </section>
  );
}
