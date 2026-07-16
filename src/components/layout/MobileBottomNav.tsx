import {
  ArrowLeft,
  Building2,
  Calculator,
  CalendarDays,
  ClipboardPen,
  LayoutDashboard,
  LogIn,
  LogOut,
  Medal,
  Paperclip,
  Podium,
  Search,
  Settings,
  Shield,
  Trophy,
  User,
  UserPlus,
  Users,
  UsersRound,
  Wrench,
} from "lucide-react";

import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import IconLogo from "../../assets/KIWITTR - Logo.svg?react";

import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import useRole from "../../hooks/useRole";
import { supabase } from "../../lib/supabase";
import GlobalSearch from "./GlobalSearch";
import NavigationProfilePicture from "./NavigationProfilePicture";

type Panel =
  | "home"
  | "competition"
  | "match-centre"
  | "tools"
  | "search"
  | "profile"
  | "account";

type MobileNavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
};

type StandaloneNavigator = Navigator & {
  standalone?: boolean;
};

function isInstalledApp() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)")
      .matches ||
    (window.navigator as StandaloneNavigator)
      .standalone === true
  );
}

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const { session, loading } = useAuth();
  const { profile } = useProfile();

  const {
    isAdmin,
    isClubLeader,
  } = useRole();

  const [activePanel, setActivePanel] =
    useState<Panel | null>(null);

  const [panelOpen, setPanelOpen] =
    useState(false);

  const [installedApp, setInstalledApp] =
    useState(isInstalledApp);

  const closeTimerRef =
    useRef<number | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current === null) {
      return;
    }

    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  }, []);

  const openPanel = useCallback((panel: Panel) => {
    clearCloseTimer();
    setActivePanel(panel);
    setPanelOpen(true);
  }, [clearCloseTimer]);

  const closePanel = useCallback(() => {
    clearCloseTimer();
    setPanelOpen(false);

    closeTimerRef.current = window.setTimeout(
      () => {
        setActivePanel(null);
        closeTimerRef.current = null;
      },
      250
    );
  }, [clearCloseTimer]);

  useEffect(() => {
    const routeCloseTimer =
      window.setTimeout(closePanel, 0);

    return () => {
      window.clearTimeout(routeCloseTimer);
    };
  }, [closePanel, location.pathname]);

  useEffect(() => {
    return clearCloseTimer;
  }, [clearCloseTimer]);

  useEffect(() => {
    const displayMode = window.matchMedia(
      "(display-mode: standalone)"
    );

    function updateInstalledMode() {
      setInstalledApp(isInstalledApp());
    }

    displayMode.addEventListener(
      "change",
      updateInstalledMode
    );

    return () => {
      displayMode.removeEventListener(
        "change",
        updateInstalledMode
      );
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    closePanel();
    navigate("/login");
  }

  function initials() {
    const first =
      profile?.first_name?.trim()?.[0] ?? "";

    const last =
      profile?.last_name?.trim()?.[0] ?? "";

    const value =
      `${first}${last}`.toUpperCase();

    if (value.length > 0) {
      return value;
    }

    return (
      session?.user.email?.charAt(0).toUpperCase()
      ?? "?"
    );
  }

  function displayName() {
    const first =
      profile?.first_name?.trim() ?? "";

    const last =
      profile?.last_name?.trim() ?? "";

    const name =
      `${first} ${last}`.trim();

    if (name.length > 0) {
      return name;
    }

    return session?.user.email ?? "Unknown User";
  }

  function roleName() {
    switch (profile?.role) {
      case "admin":
        return "Administrator";

      case "club_admin":
        return "Club Admin";

      case "player":
        return "Player";

      default:
        return "Member";
    }
  }

  const competitionItems: MobileNavItem[] = [
    {
      to: "/rankings",
      label: "Rankings",
      icon: <Podium className="h-6 w-6" />,
    },
    {
      to: "/clubs",
      label: "Clubs",
      icon: <Building2 className="h-6 w-6" />,
    },
    {
      to: "/events",
      label: "Events",
      icon: <CalendarDays className="h-6 w-6" />,
    },
  ];

  if (session) {
    competitionItems.push({
      to: "/tournaments",
      label: "Tournaments",
      icon: <Trophy className="h-6 w-6" />,
    });
  }

  if (isAdmin || isClubLeader) {
    competitionItems.push({
      to: "/team-games",
      label: "Team Games",
      icon: <UsersRound className="h-6 w-6" />,
    });
  }

  const matchCentreItems: MobileNavItem[] =
    isAdmin || isClubLeader
      ? [
          {
            to: "/matches",
            label: "Record Match",
            icon: <ClipboardPen className="h-6 w-6" />,
          },
          {
            to: "/players",
            label: "Player Management",
            icon: <Users className="h-6 w-6" />,
          },
        ]
      : [];

  const toolItems: MobileNavItem[] = [
    {
      to: "/simulator",
      label: "TTR Calculator",
      icon: <Calculator className="h-6 w-6" />,
    },
    {
      to: "/settings",
      label: "Settings",
      icon: <Settings className="h-6 w-6" />,
    },
  ];

  function renderPanelTitle() {
    switch (activePanel) {
      case "home":
        return "KiwiTTR";

      case "competition":
        return "Competition";

      case "match-centre":
        return "Management";

      case "tools":
        return "Tools";

      case "search":
        return "Search";

      case "profile":
        return "Profile";

      case "account":
        return "Account";

      default:
        return "";
    }
  }

  function renderLinks(
    items: MobileNavItem[]
  ) {
    return (
      <div className="grid gap-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition ${
                isActive
                  ? "bg-blue-900 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    );
  }

  function renderAccountPanel() {
    if (loading) {
      return (
        <p className="px-4 py-3 text-sm text-slate-500">
          Loading...
        </p>
      );
    }

    if (!session) {
      return (
        <div className="grid gap-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-semibold">Welcome</h3>
            <p className="mt-1 text-sm text-slate-500">
              Sign in to access your profile, ratings and competitions.
            </p>
          </div>

          <Link
            to="/login"
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 py-3 font-medium text-white transition hover:bg-blue-800"
          >
            <LogIn className="h-6 w-6" />
            Sign In
          </Link>

          <Link
            to="/register"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <UserPlus className="h-6 w-6" />
            Create Account
          </Link>
        </div>
      );
    }

    return (
      <div className="grid gap-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-900 text-sm font-bold text-white">
              <NavigationProfilePicture
                avatarUrl={profile?.avatar_url}
                className="h-full w-full"
                fallback={initials()}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">
                {displayName()}
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {session.user.email}
              </p>
              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-[11px] font-medium text-blue-800">
                <Shield className="h-3 w-3" />
                {roleName()}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="h-6 w-6" />
          Sign Out
        </button>
      </div>
    );
  }

  function renderPanelContent() {
    switch (activePanel) {
      case "home":
        return renderLinks([
          {
            to: "/",
            label: "Home",
            icon: <LayoutDashboard className="h-6 w-6" />,
          },
        ]);

      case "competition":
        return renderLinks(competitionItems);

      case "match-centre":
        if (matchCentreItems.length > 0) {
          return renderLinks(matchCentreItems);
        }

        return (
          <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            Match centre is available for admins and club admins.
          </p>
        );

      case "tools":
        return renderLinks(toolItems);

      case "search":
        return (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <GlobalSearch resultsPlacement="up" />
          </div>
        );

      case "profile":
        return renderLinks([
          {
            to: "/dashboard",
            label: "Dashboard",
            icon: <LayoutDashboard className="h-6 w-6" />,
          },
          {
            to: "/my-profile",
            label: "My Profile",
            icon: <User className="h-6 w-6" />,
          },
        ]);

      case "account":
        return renderAccountPanel();

      default:
        return null;
    }
  }

  function navButton(
    panel: Panel,
    label: string,
    icon: React.ReactNode
  ) {
    const pathname = location.pathname;
    const active =
      activePanel === panel ||
      (
        panel === "home" &&
        pathname === "/"
      ) ||
      (
        panel === "competition" &&
        [
          "/rankings",
          "/clubs",
          "/events",
          "/tournaments",
          "/team-games",
        ].some((path) =>
          pathname === path ||
          pathname.startsWith(`${path}/`)
        )
      ) ||
      (
        panel === "match-centre" &&
        ["/matches", "/players"].some(
          (path) =>
            pathname === path ||
            pathname.startsWith(`${path}/`)
        )
      ) ||
      (
        panel === "tools" &&
        ["/simulator", "/settings"].some(
          (path) =>
            pathname === path ||
            pathname.startsWith(`${path}/`)
        )
      ) ||
      (
        panel === "profile" &&
        ["/dashboard", "/my-profile"].includes(
          pathname
        )
      ) ||
      (
        panel === "account" &&
        ["/login", "/register"].includes(pathname)
      );

    return (
      <button
        type="button"
        onClick={() => {
          if (panel === "home") {
            closePanel();
            navigate("/");
            return;
          }

          openPanel(panel);
        }}
        aria-label={label}
        className={`flex h-14 min-w-0 flex-1 items-center justify-center text-slate-700 transition hover:bg-slate-100 hover:text-black focus:outline-none focus:ring-4 focus:ring-blue-100 sm:max-w-14 ${
          installedApp
            ? `rounded-[1.4rem] ${
                active
                  ? "bg-slate-100 text-blue-900"
                  : ""
              }`
            : "rounded-xl"
        }`}
      >
        {icon}
      </button>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 md:hidden">
      <div
        aria-hidden={!panelOpen}
        inert={!panelOpen}
        className={`absolute inset-x-0 bottom-0 transform-gpu border-t border-slate-200 bg-white px-4 pb-4 pt-3 shadow-[0_-12px_30px_rgba(15,23,42,0.12)] transition-all duration-300 ease-out ${
          panelOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-full opacity-0"
        }`}
      >
        <div className="mb-3 flex items-center gap-3">
          <button
            type="button"
            onClick={closePanel}
            aria-label="Back to navigation"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100 hover:text-black focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>

          <h2 className="truncate text-base font-bold">
            {renderPanelTitle()}
          </h2>
        </div>

        <div
          className={`max-h-[52vh] pb-[env(safe-area-inset-bottom)] ${
            activePanel === "search"
              ? "overflow-visible"
              : "overflow-y-auto"
          }`}
        >
          {renderPanelContent()}
        </div>
      </div>

      <nav
        aria-hidden={panelOpen}
        inert={panelOpen}
        className={`${
          installedApp
            ? "mx-auto mb-[calc(0.75rem+env(safe-area-inset-bottom))] w-[calc(100%-1.5rem)] max-w-xl rounded-[2.25rem] border border-white/65 bg-white/55 px-3 py-2 shadow-[0_12px_40px_rgba(15,23,42,0.20)] backdrop-blur-2xl backdrop-saturate-150"
            : "border-t border-slate-200 bg-white px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.10)]"
        } transition-all duration-300 ease-out ${
          panelOpen
            ? "pointer-events-none translate-y-3 opacity-0"
            : "translate-y-0 opacity-100"
        }`}
      >
        <div className="relative mx-auto flex max-w-lg items-center justify-between gap-0.5 opacity-100">
          {navButton(
            "home",
            "KiwiTTR",
            <IconLogo className="h-10 w-10" />
          )}

          {session && (
            <div
              aria-hidden="true"
              className="mx-1 h-8 w-px shrink-0 bg-slate-200"
            />
          )}

          {navButton(
            "search",
            "Search",
            <Search className="h-7 w-7" />
          )}

          {session && (
            navButton(
              "profile",
              "Profile",
              <User className="h-7 w-7" />
            )
          )}

          {navButton(
            "competition",
            "Competition",
            <Medal className="h-7 w-7" />
          )}

          {(isAdmin || isClubLeader) && navButton(
            "match-centre",
            "Management",
            <Paperclip className="h-7 w-7" />
          )}

          {navButton(
            "tools",
            "Tools",
            <Wrench className="h-7 w-7" />
          )}

          {navButton(
            "account",
            "Account",
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-blue-900 text-sm font-bold text-white">
              {session ? (
                <NavigationProfilePicture
                  avatarUrl={profile?.avatar_url}
                  className="h-full w-full"
                  fallback={initials()}
                />
              ) : (
                <LogIn className="h-7 w-7" />
              )}
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
