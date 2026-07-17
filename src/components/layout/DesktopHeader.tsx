import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Building2,
  Calculator,
  CalendarDays,
  ChevronDown,
  ClipboardPen,
  LayoutDashboard,
  LogIn,
  LogOut,
  Medal,
  Paperclip,
  Podium,
  Settings,
  Trophy,
  User,
  UserPlus,
  Users,
  UsersRound,
  Wrench,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import FullLogo from "../../assets/KIWITTR - Logo Full.svg?react";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import useRole from "../../hooks/useRole";
import { supabase } from "../../lib/supabase";
import GlobalSearch from "./GlobalSearch";
import NavigationProfilePicture from "./NavigationProfilePicture";

type MenuName = "my-club" | "competition" | "management" | "tools";

type HeaderLink = {
  to: string;
  label: string;
  description: string;
  icon: ReactNode;
  colour: string;
};

export default function DesktopHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { profile } = useProfile();
  const { isAdmin, isClubLeader } = useRole();
  const [openMenu, setOpenMenu] = useState<MenuName | null>(null);
  const [displayMenu, setDisplayMenu] = useState<MenuName>("competition");
  const [accountOpen, setAccountOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOpenMenu(null);
      setAccountOpen(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
        setAccountOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenu(null);
        setAccountOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const competitionLinks: HeaderLink[] = [
    { to: "/rankings", label: "Rankings", description: "National player standings", icon: <Podium className="h-5 w-5" />, colour: "bg-amber-100 text-amber-700" },
    { to: "/clubs", label: "Clubs", description: "Explore registered clubs", icon: <Building2 className="h-5 w-5" />, colour: "bg-indigo-100 text-indigo-700" },
    { to: "/events", label: "Events", description: "Fixtures and results", icon: <CalendarDays className="h-5 w-5" />, colour: "bg-emerald-100 text-emerald-700" },
  ];

  if (session) {
    competitionLinks.push({ to: "/tournaments", label: "Tournaments", description: "Draws and live competition", icon: <Trophy className="h-5 w-5" />, colour: "bg-blue-100 text-blue-700" });
  }

  if (isAdmin || isClubLeader) {
    competitionLinks.push({ to: "/team-games", label: "Team Games", description: "Interclub team fixtures", icon: <UsersRound className="h-5 w-5" />, colour: "bg-cyan-100 text-cyan-700" });
  }

  const managementLinks: HeaderLink[] = [
    { to: "/matches", label: "Match Input", description: "Choose and enter match results", icon: <ClipboardPen className="h-5 w-5" />, colour: "bg-green-100 text-green-700" },
    { to: "/players", label: "Player Management", description: "Create and manage players", icon: <Users className="h-5 w-5" />, colour: "bg-violet-100 text-violet-700" },
  ];

  const toolLinks: HeaderLink[] = [
    { to: "/simulator", label: "TTR Calculator", description: "Preview rating changes", icon: <Calculator className="h-5 w-5" />, colour: "bg-sky-100 text-sky-700" },
    { to: "/settings", label: "Settings", description: "Navigation preferences", icon: <Settings className="h-5 w-5" />, colour: "bg-slate-200 text-slate-700" },
  ];

  const myClubLinks: HeaderLink[] = [
    { to: "/my-club", label: "Club Profile", description: "View your associated club", icon: <Building2 className="h-5 w-5" />, colour: "bg-indigo-100 text-indigo-700" },
    { to: "/club-events", label: "Club Events", description: "Club nights and round robins", icon: <CalendarDays className="h-5 w-5" />, colour: "bg-emerald-100 text-emerald-700" },
  ];

  const menus: Record<MenuName, { title: string; icon: ReactNode; links: HeaderLink[] }> = {
    "my-club": { title: "My Club", icon: <Building2 className="h-4 w-4" />, links: myClubLinks },
    competition: { title: "Competition", icon: <Medal className="h-4 w-4" />, links: competitionLinks },
    management: { title: "Management", icon: <Paperclip className="h-4 w-4" />, links: managementLinks },
    tools: { title: "Tools", icon: <Wrench className="h-4 w-4" />, links: toolLinks },
  };

  function initials() {
    const value = `${profile?.first_name?.trim()?.[0] ?? ""}${profile?.last_name?.trim()?.[0] ?? ""}`.toUpperCase();
    return value || session?.user.email?.[0]?.toUpperCase() || "?";
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <header ref={headerRef} className="relative z-50 hidden shrink-0 border-b border-slate-200 bg-white shadow-sm md:block">
      <div className="mx-auto flex h-18 max-w-[1800px] items-center gap-5 px-6 lg:px-8">
        <Link aria-label="KiwiTTR home" className="shrink-0 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-100" to="/">
          <FullLogo className="h-9 w-auto" />
        </Link>

        <Link className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${pathname === "/dashboard" ? "bg-blue-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`} to="/dashboard">
          <LayoutDashboard className="h-4 w-4" /> Dashboard
        </Link>

        {session && (
          <Link className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${pathname === "/my-profile" ? "bg-blue-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`} to="/my-profile">
            <User className="h-4 w-4" /> My Profile
          </Link>
        )}

        <nav aria-label="Main navigation" className="flex items-center gap-1">
          {(Object.keys(menus) as MenuName[]).map((name) => {
            if (name === "my-club" && !session) return null;
            if (name === "management" && !(isAdmin || isClubLeader)) return null;
            const menu = menus[name];
            const isOpen = openMenu === name;
            return (
              <button
                aria-expanded={isOpen}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${isOpen ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}
                key={name}
                onClick={() => {
                  if (!isOpen) setDisplayMenu(name);
                  setOpenMenu(isOpen ? null : name);
                  setAccountOpen(false);
                }}
                type="button"
              >
                {menu.icon} {menu.title}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
              </button>
            );
          })}
        </nav>

        <div className="ml-auto hidden min-w-0 w-full max-w-56 lg:block xl:max-w-xs"><GlobalSearch /></div>

        <div className="relative shrink-0">
          {session ? (
            <button className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-blue-900 text-sm font-bold text-white ring-offset-2 transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-700" onClick={() => { setAccountOpen((current) => !current); setOpenMenu(null); }} type="button">
              <NavigationProfilePicture
                avatarUrl={profile?.avatar_url}
                className="h-full w-full"
                fallback={initials()}
              />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Link className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100" to="/login"><LogIn className="h-4 w-4" /> Sign in</Link>
              <Link className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800" to="/register"><UserPlus className="h-4 w-4" /> Register</Link>
            </div>
          )}

          {session && accountOpen && (
            <div className="absolute right-0 top-12 w-64 origin-top-right animate-in fade-in zoom-in-95 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl duration-200">
              <div className="border-b border-slate-100 px-3 pb-3">
                <p className="truncate font-semibold">{`${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || "KiwiTTR member"}</p>
                <p className="truncate text-xs text-slate-500">{session.user.email}</p>
              </div>
              <Link className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-slate-100" to="/my-profile">
                <User className="h-4 w-4" /> My Profile
              </Link>
              <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50" onClick={() => void handleLogout()} type="button"><LogOut className="h-4 w-4" /> Sign Out</button>
            </div>
          )}
        </div>
      </div>

      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${openMenu ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <div className="flex h-56 items-center border-t border-slate-100 bg-slate-50/95 px-8 lg:h-36 xl:h-24">
            <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-5">
                {menus[displayMenu].links.map((item) => (
                  <Link
                    className="group flex h-14 items-center gap-3 rounded-xl bg-transparent p-3 outline-none transition duration-200 hover:bg-white hover:ring-1 hover:ring-slate-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-slate-500"
                    key={item.to}
                    to={item.to}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center text-slate-500 transition-colors duration-200 group-hover:text-slate-900">{item.icon}</span>
                    <span className="font-bold text-slate-800">{item.label}</span>
                  </Link>
                ))}
              </div>
          </div>
        </div>
      </div>
    </header>
  );
}
