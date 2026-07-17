import {
  ChevronDown,
  LogIn,
  LogOut,
  Shield,
  User,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import { useSidebar } from "../../context/SidebarContext";
import { supabase } from "../../lib/supabase";
import NavigationProfilePicture from "./NavigationProfilePicture";

export default function SidebarFooter() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const { profile } = useProfile();
  const { collapsed } = useSidebar();
  const [accountOpen, setAccountOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  function initials() {
    const value = `${profile?.first_name?.trim()?.[0] ?? ""}${profile?.last_name?.trim()?.[0] ?? ""}`.toUpperCase();
    return value || session?.user.email?.charAt(0).toUpperCase() || "?";
  }

  function displayName() {
    const name = `${profile?.first_name?.trim() ?? ""} ${profile?.last_name?.trim() ?? ""}`.trim();
    return name || session?.user.email || "Unknown User";
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

  return (
    <div className="border-t bg-white p-3">
      {loading ? (
        <div className="py-2 text-center text-sm text-slate-500">Loading...</div>
      ) : session ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <button
            type="button"
            aria-expanded={accountOpen}
            aria-label={accountOpen ? "Collapse account options" : "Expand account options"}
            onClick={() => setAccountOpen((open) => !open)}
            className={`flex w-full items-center p-2.5 text-left transition hover:bg-slate-100 ${collapsed ? "justify-center" : "gap-2.5"}`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-900 text-sm font-bold text-white">
              <NavigationProfilePicture avatarUrl={profile?.avatar_url} className="h-full w-full" fallback={initials()} />
            </span>
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-800">{displayName()}</span>
                  <span className="block truncate text-xs text-slate-500">Account</span>
                </span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${accountOpen ? "rotate-180" : ""}`} />
              </>
            )}
          </button>

          <div className={`grid transition-[grid-template-rows,opacity] duration-200 ${accountOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
            <div className="overflow-hidden">
              <div className="border-t border-slate-200 p-2">
                {!collapsed && (
                  <div className="mb-1 px-2 py-1.5">
                    <p className="truncate text-xs text-slate-500">{session.user.email}</p>
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-blue-800">
                      <Shield className="h-3 w-3" />
                      {roleName()}
                    </p>
                  </div>
                )}
                <Link
                  to="/my-profile"
                  className={`flex items-center rounded-lg px-2.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-white ${collapsed ? "justify-center" : "gap-2"}`}
                >
                  <User className="h-4 w-4" />
                  {!collapsed && "My Profile"}
                </Link>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className={`flex w-full items-center rounded-lg px-2.5 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 ${collapsed ? "justify-center" : "gap-2"}`}
                >
                  <LogOut className="h-4 w-4" />
                  {!collapsed && "Sign Out"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <button
            type="button"
            aria-expanded={accountOpen}
            onClick={() => setAccountOpen((open) => !open)}
            className={`flex w-full items-center p-2.5 text-left transition hover:bg-slate-100 ${collapsed ? "justify-center" : "gap-2.5"}`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-900 text-white">
              <LogIn className="h-4 w-4" />
            </span>
            {!collapsed && (
              <>
                <span className="flex-1 text-sm font-semibold text-slate-800">Account</span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${accountOpen ? "rotate-180" : ""}`} />
              </>
            )}
          </button>

          <div className={`grid transition-[grid-template-rows,opacity] duration-200 ${accountOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
            <div className="overflow-hidden">
              <div className="space-y-1 border-t border-slate-200 p-2">
                <Link to="/login" className={`flex items-center rounded-lg bg-blue-900 px-2.5 py-2 text-sm font-medium text-white hover:bg-blue-800 ${collapsed ? "justify-center" : "gap-2"}`}>
                  <LogIn className="h-4 w-4" />
                  {!collapsed && "Sign In"}
                </Link>
                <Link to="/register" className={`flex items-center rounded-lg px-2.5 py-2 text-sm font-medium text-slate-700 hover:bg-white ${collapsed ? "justify-center" : "gap-2"}`}>
                  <UserPlus className="h-4 w-4" />
                  {!collapsed && "Create Account"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-2 text-center text-[11px] text-slate-400">
        {collapsed ? `v${__APP_VERSION__}` : `KiwiTTR v${__APP_VERSION__}`}
      </div>
    </div>
  );
}
