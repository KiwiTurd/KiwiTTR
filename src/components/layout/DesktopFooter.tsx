import { Link } from "react-router-dom";

export default function DesktopFooter() {
  return (
    <footer className="hidden shrink-0 border-t border-slate-700 bg-slate-800 px-8 py-2.5 text-xs text-slate-300 md:flex md:items-center md:justify-between">
      <p>
        &copy; {new Date().getFullYear()} KiwiTTR. Table tennis ratings for
        Aotearoa New Zealand.
      </p>

      <nav aria-label="Information" className="flex items-center gap-5">
        <Link
          className="transition-colors hover:text-white"
          to="/about"
        >
          About us
        </Link>
        <Link
          className="transition-colors hover:text-white"
          to="/how-we-calculate"
        >
          How we calculate
        </Link>
        <Link
          className="transition-colors hover:text-white"
          to="/rankings"
        >
          NZ rankings
        </Link>
      </nav>
    </footer>
  );
}
