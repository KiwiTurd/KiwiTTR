import { useState } from "react";

import {
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
} from "lucide-react";

import { useSidebar } from "../../context/SidebarContext";

import useRole from "../../hooks/useRole";

import GlobalSearch from "./GlobalSearch";
import SidebarHeader from "./SidebarHeader";
import SidebarFooter from "./SidebarFooter";
import SidebarSection from "./SidebarSection";
import SidebarLink from "./SidebarLink";

export default function Sidebar() {
  const { collapsed } = useSidebar();

  const {
    isAdmin,
    isClubLeader,
  } = useRole();

  const [competitionOpen, setCompetitionOpen] =
    useState(true);

  const [matchCentreOpen, setMatchCentreOpen] =
    useState(true);

  const [toolsOpen, setToolsOpen] =
    useState(false);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-200 flex flex-col shadow-sm z-40 transition-all duration-300 ${
        collapsed
          ? "w-20"
          : "w-72"
      }`}
    >
      <SidebarHeader />

      {!collapsed && (
        <div className="px-4 py-5 border-b">
          <GlobalSearch />
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-4 py-4">

        <SidebarLink
          to="/"
          label="Dashboard"
          icon={<LayoutDashboard className="w-5 h-5" />}
          collapsed={collapsed}
        />

        <SidebarSection
          title="Competition"
          icon={<Medal className="w-4 h-4" />}
          open={competitionOpen}
          onToggle={() =>
            setCompetitionOpen(!competitionOpen)
          }
        >

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

        </SidebarSection>

        {(isAdmin || isClubLeader) && (

          <SidebarSection
            title="Match Centre"
            icon={<Swords className="w-4 h-4" />}
            open={matchCentreOpen}
            onToggle={() =>
              setMatchCentreOpen(!matchCentreOpen)
            }
          >

            <SidebarLink
              to="/matches"
              label="Record Match"
              icon={<ClipboardPen className="w-4 h-4" />}
              collapsed={collapsed}
            />

          </SidebarSection>

        )}

        <SidebarSection
          title="Tools"
          icon={<Wrench className="w-4 h-4" />}
          open={toolsOpen}
          onToggle={() =>
            setToolsOpen(!toolsOpen)
          }
        >

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

        </SidebarSection>

      </nav>

      <SidebarFooter />

    </aside>
  );
}