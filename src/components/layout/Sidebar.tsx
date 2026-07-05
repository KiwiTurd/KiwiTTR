import { useState } from "react";

import {
  PanelLeft,
  PanelLeftClose,
  LayoutDashboard,
  Trophy,
  User,
  Building2,
  CalendarDays,
  Users,
  ClipboardPen,
  Calculator,
  Settings,
  Medal,
  Wrench,
  Swords,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import { useSidebar } from "../../context/SidebarContext";

import GlobalSearch from "./GlobalSearch";

import useRole from "../../hooks/useRole";

import SidebarLink from "./SidebarLink";

export default function Sidebar() {
  const {
    isAdmin,
    isClubLeader,
  } = useRole();
  const {
  collapsed,
  toggle,
} = useSidebar();

  const [competitionOpen, setCompetitionOpen] = useState(true);
  const [matchCentreOpen, setMatchCentreOpen] = useState(true);
  const [toolsOpen, setToolsOpen] = useState(false);

  ({ isActive }: { isActive: boolean }) =>
  `flex items-center ${
    collapsed
      ? "justify-center px-0"
      : "gap-3 px-4"
  } py-3 rounded-lg transition font-medium ${
    isActive
      ? "bg-blue-900 text-white"
      : "text-slate-800 hover:bg-slate-100"
  }`;

({ isActive }: { isActive: boolean }) =>
  `flex items-center ${
    collapsed
      ? "justify-center px-0"
      : "gap-3 px-4"
  } py-3 rounded-lg transition font-medium ${
    isActive
      ? "bg-blue-900 text-white"
      : "text-slate-700 hover:bg-slate-100"
  }`;

  return (
    <aside
  className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-200 flex flex-col shadow-sm z-40 transition-all duration-200 ${
    collapsed
      ? "w-20"
      : "w-72"
  }`}
>

      <div className="px-4 py-5 border-b flex items-center justify-between">

  {!collapsed && (
    <h1 className="text-2xl font-bold tracking-tight">
      KiwiTTR
    </h1>
  )}

  <button
    onClick={toggle}
    className="rounded-lg p-2 hover:bg-slate-100 transition"
  >
    {collapsed ? (
      <PanelLeft className="w-5 h-5 text-slate-600" />
    ) : (
      <PanelLeftClose className="w-5 h-5 text-slate-600" />
    )}
  </button>

</div>

      <nav className="flex-1 px-4 py-4 overflow-y-auto">

        <SidebarLink
  to="/"
  label="Dashboard"
  icon={<LayoutDashboard className="w-5 h-5" />}
  collapsed={collapsed}
/>

        {!collapsed && (

  <div className="mt-6 mb-6">

    <GlobalSearch />

  </div>

)}

        {/* Competition */}

        <div className="mb-3">

          <button
            onClick={() => setCompetitionOpen(!competitionOpen)}
            className="flex w-full items-center justify-between rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:bg-slate-100 transition"
          >
            <div className="flex items-center gap-2">

  <Medal className="w-4 h-4" />

  {!collapsed && (
    <span>Competition</span>
  )}

</div>

{!collapsed &&
  (competitionOpen ? (
    <ChevronDown className="w-4 h-4" />
  ) : (
    <ChevronRight className="w-4 h-4" />
  ))}
          </button>

          {competitionOpen && (

            <div className="mt-1 space-y-1">

             <SidebarLink
  to="/rankings"
  label="Rankings"
  icon={<Trophy className="w-4 h-4" />}
  collapsed={collapsed}
/>

<SidebarLink
  to="/my-profile"
  label="My Profile"
  icon={<User className="w-4 h-4" />}
  collapsed={collapsed}
/>

             <SidebarLink
  to="/clubs"
  label="Clubs"
  icon={<Building2 className="w-4 h-4" />}
  collapsed={collapsed}
/>

              <SidebarLink
  to="/events"
  label="Events"
  icon={<CalendarDays className="w-4 h-4" />}
  collapsed={collapsed}
/>

              {isAdmin && (

                <SidebarLink
  to="/players"
  label="Player Management"
  icon={<Users className="w-4 h-4" />}
  collapsed={collapsed}
/>

              )}

            </div>

          )}

        </div>

        {/* Match Centre */}

        {(isAdmin || isClubLeader) && (

          <div className="mb-3">

            <button
              onClick={() => setMatchCentreOpen(!matchCentreOpen)}
              className="flex w-full items-center justify-between rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:bg-slate-100 transition"
            >
              <div className="flex items-center gap-2">

  <Swords className="w-4 h-4" />

  {!collapsed && (
    <span>Match Centre</span>
  )}

</div>

{!collapsed &&
  (matchCentreOpen ? (
    <ChevronDown className="w-4 h-4" />
  ) : (
    <ChevronRight className="w-4 h-4" />
  ))}

            </button>

            {matchCentreOpen && (

              <div className="mt-1 space-y-1">

                <SidebarLink
  to="/matches"
  label="Record Match"
  icon={<ClipboardPen className="w-4 h-4" />}
  collapsed={collapsed}
/>

              </div>

            )}

          </div>

        )}

        {/* Tools */}

        <div className="mb-3">

          <button
            onClick={() => setToolsOpen(!toolsOpen)}
            className="flex w-full items-center justify-between rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:bg-slate-100 transition"
          >
            <div className="flex items-center gap-2">

  <Wrench className="w-4 h-4" />

  {!collapsed && (
    <span>Tools</span>
  )}

</div>

{!collapsed &&
  (toolsOpen ? (
    <ChevronDown className="w-4 h-4" />
  ) : (
    <ChevronRight className="w-4 h-4" />
  ))}

          </button>

          {toolsOpen && (

            <div className="mt-1 space-y-1">

              <SidebarLink
  to="/simulator"
  label="TTR Calculator"
  icon={<Calculator className="w-4 h-4" />}
  collapsed={collapsed}
/>

              {isAdmin && (

                <SidebarLink
  to="/settings"
  label="Settings"
  icon={<Settings className="w-4 h-4" />}
  collapsed={collapsed}
/>

              )}

            </div>

          )}

        </div>

      </nav>

      <div className="border-t px-4 py-4 text-xs text-slate-400 text-center">
  {collapsed
    ? `v${__APP_VERSION__}`
    : `KiwiTTR v${__APP_VERSION__}`}
</div>

    </aside>
  );
}