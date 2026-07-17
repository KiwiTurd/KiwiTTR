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
  Podium,
  Wrench,
  Paperclip,
  UsersRound,
} from "lucide-react";

import { useSidebar } from "../../context/SidebarContext";
import { useAuth } from "../../context/AuthContext";

import useRole from "../../hooks/useRole";

import GlobalSearch from "./GlobalSearch";
import SidebarHeader from "./SidebarHeader";
import SidebarFooter from "./SidebarFooter";
import SidebarSection from "./SidebarSection";
import SidebarLink from "./SidebarLink";

type SidebarDropdown =
  | "my-club"
  | "competition"
  | "management"
  | "tools";

export default function Sidebar() {
  const { collapsed } = useSidebar();
  const { session } = useAuth();

  const {
    isAdmin,
    isClubLeader,
  } = useRole();

  const [openDropdown, setOpenDropdown] =
    useState<SidebarDropdown | null>("competition");

  function toggleDropdown(dropdown: SidebarDropdown) {
    setOpenDropdown((current) =>
      current === dropdown ? null : dropdown
    );
  }

  return (
    <aside
      className={`fixed left-0 top-0 hidden h-screen bg-white border-r border-slate-200 md:flex flex-col shadow-sm z-40 transition-all duration-300 ${
        collapsed
          ? "w-20"
          : "w-72"
      }`}
    >
      <SidebarHeader />

      {!collapsed && (
        <div className="border-b px-4 py-4">
          <GlobalSearch />
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-4 py-3">

        <SidebarLink
          to="/dashboard"
          label="Dashboard"
          icon={
            <LayoutDashboard className="h-5 w-5" />
          }
          collapsed={collapsed}
        />

        {session && (
          <SidebarLink
            to="/my-profile"
            label="My Profile"
            icon={
              <User className="h-5 w-5" />
            }
            collapsed={collapsed}
          />
        )}

        {session && (
          <SidebarSection
            title="My Club"
            icon={<Building2 className="h-4 w-4" />}
            open={openDropdown === "my-club"}
            onToggle={() => toggleDropdown("my-club")}
          >
            <SidebarLink
              to="/my-club"
              label="Club Profile"
              icon={<Building2 className="h-4 w-4" />}
              collapsed={collapsed}
            />
            <SidebarLink
              to="/club-events"
              label="Club Events"
              icon={<CalendarDays className="h-4 w-4" />}
              collapsed={collapsed}
            />
          </SidebarSection>
        )}

        <SidebarSection
          title="Competition"
          icon={<Medal className="h-4 w-4" />}
          open={openDropdown === "competition"}
          onToggle={() => toggleDropdown("competition")}
        >

          <SidebarLink
            to="/rankings"
            label="Rankings"
            icon={
              <Podium className="h-4 w-4" />
            }
            collapsed={collapsed}
          />

          <SidebarLink
            to="/clubs"
            label="Clubs"
            icon={
              <Building2 className="h-4 w-4" />
            }
            collapsed={collapsed}
          />

          <SidebarLink
            to="/events"
            label="Events"
            icon={
              <CalendarDays className="h-4 w-4" />
            }
            collapsed={collapsed}
          />

          {session && (
            <SidebarLink
              to="/tournaments"
              label="Tournaments"
              icon={<Trophy className="h-4 w-4" />}
              collapsed={collapsed}
            />
          )}

          {(isAdmin || isClubLeader) && (
            <SidebarLink
              to="/team-games"
              label="Team Games"
              icon={<UsersRound className="h-4 w-4" />}
              collapsed={collapsed}
            />
          )}

        </SidebarSection>

        {(isAdmin || isClubLeader) && (

          <SidebarSection
            title="Management"
            icon={
              <Paperclip className="h-4 w-4" />
            }
            open={openDropdown === "management"}
            onToggle={() => toggleDropdown("management")}
          >

            <SidebarLink
              to="/matches"
              label="Match Input"
              icon={
                <ClipboardPen className="h-4 w-4" />
              }
              collapsed={collapsed}
            />

            <SidebarLink
              to="/players"
              label="Player Management"
              icon={
                <Users className="h-4 w-4" />
              }
              collapsed={collapsed}
            />

          </SidebarSection>

        )}

        <SidebarSection
          title="Tools"
          icon={
            <Wrench className="h-4 w-4" />
          }
          open={openDropdown === "tools"}
          onToggle={() => toggleDropdown("tools")}
        >

          <SidebarLink
            to="/simulator"
            label="TTR Calculator"
            icon={
              <Calculator className="h-4 w-4" />
            }
            collapsed={collapsed}
          />

          <SidebarLink
            to="/settings"
            label="Settings"
            icon={
              <Settings className="h-4 w-4" />
            }
            collapsed={collapsed}
          />

        </SidebarSection>

      </nav>

      <SidebarFooter />

    </aside>
  );
}
