import KiwiTtrIcon from "../../assets/KIWITTR - Logo.svg?react";

type Props = {
  label?: string;
};

export function KiwiTtrLoadingAnimation() {
  return (
    <div className="relative flex h-32 w-32 items-end justify-center">
      <KiwiTtrIcon
        aria-hidden="true"
        className="kiwittr-loading-icon absolute bottom-5 h-16 w-16 fill-blue-800"
        focusable="false"
      />
      <div
        aria-hidden="true"
        className="kiwittr-loading-shadow mb-2 h-2 w-12 rounded-full bg-slate-900/20 blur-sm"
      />
    </div>
  );
}

export default function LoadingScreen({
  label = "Loading...",
}: Props) {
  return (
    <div
      aria-live="polite"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-100"
      role="status"
    >
      <KiwiTtrLoadingAnimation />
      <span className="sr-only">{label}</span>
    </div>
  );
}
