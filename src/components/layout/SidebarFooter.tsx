import {
  LogOut,
  Shield,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { supabase } from "../../lib/supabase";

import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import { useSidebar } from "../../context/SidebarContext";

export default function SidebarFooter() {

  const navigate = useNavigate();

  const { session, loading } = useAuth();

  const { profile } = useProfile();

  const { collapsed } = useSidebar();

  async function handleLogout() {

    await supabase.auth.signOut();

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

      case "club_leader":
        return "Club Leader";

      case "player":
        return "Player";

      default:
        return "Member";

    }

  }

  return (

    <div className="border-t bg-white p-4">

      {loading ? (

        <div className="text-center text-sm text-slate-500">

          Loading...

        </div>

      ) : (

        <>

          {/* User Card */}

          <div
            className={`
              rounded-2xl
              border
              border-slate-200
              bg-slate-50

              ${
                collapsed
                  ? "p-3"
                  : "p-4"
              }
            `}
          >

            <div
              className={`flex items-center ${
                collapsed
                  ? "justify-center"
                  : "gap-3"
              }`}
            >

              <div
                className="
                  h-11
                  w-11

                  rounded-full

                  bg-blue-900

                  flex
                  items-center
                  justify-center

                  text-white

                  font-bold
                  text-sm

                  shrink-0
                "
              >

                {initials()}

              </div>

              {!collapsed && (

                <div className="min-w-0 flex-1">

                  <p className="font-semibold truncate">

                    {displayName()}

                  </p>

                  <p className="text-xs text-slate-500 truncate mt-0.5">

                    {session?.user.email}

                  </p>

                  <div
                    className="
                      inline-flex
                      items-center
                      gap-1

                      mt-2

                      rounded-full

                      bg-blue-100

                      px-2
                      py-1

                      text-[11px]
                      font-medium

                      text-blue-800
                    "
                  >

                    <Shield className="w-3 h-3" />

                    {roleName()}

                  </div>

                </div>

              )}

            </div>

          </div>

          {/* Logout */}

          <button
            onClick={handleLogout}
            className={`
              mt-3

              flex
              items-center

              ${
                collapsed
                  ? "justify-center"
                  : "justify-center gap-2"
              }

              w-full

              rounded-xl

              border

              py-2.5

              text-slate-600

              transition-all
              duration-200

              hover:border-red-300
              hover:bg-red-50
              hover:text-red-700
            `}
          >

            <LogOut className="w-4 h-4" />

            {!collapsed && (

              <span className="font-medium">

                Sign Out

              </span>

            )}

          </button>

          {/* Version */}

          <div
            className="
              mt-4
              border-t
              pt-3
              text-center
              text-xs
              text-slate-400
            "
          >

            {collapsed

              ? `v${__APP_VERSION__}`

              : `KiwiTTR v${__APP_VERSION__}`}

          </div>

        </>

      )}

    </div>

  );

}