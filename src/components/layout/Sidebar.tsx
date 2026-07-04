import { useState } from "react";
import { NavLink } from "react-router-dom";

import GlobalSearch from "./GlobalSearch";

import useRole from "../../hooks/useRole";

export default function Sidebar() {
  const {
    isAdmin,
    isClubLeader,
  } = useRole();

  const [competitionOpen, setCompetitionOpen] = useState(true);
  const [matchCentreOpen, setMatchCentreOpen] = useState(true);
  const [toolsOpen, setToolsOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded-lg px-4 py-3 transition font-medium ${
      isActive
        ? "bg-blue-900 text-white"
        : "text-slate-800 hover:bg-slate-100"
    }`;

  const childLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded-lg px-4 py-2 ml-5 transition ${
      isActive
        ? "bg-blue-900 text-white"
        : "text-slate-700 hover:bg-slate-100"
    }`;

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-screen">

      <div className="px-6 py-6 border-b">

        <h1 className="text-2xl font-bold tracking-tight">
          KiwiTTR
        </h1>

      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4">

        <NavLink
          to="/"
          className={navLinkClass}
        >
          Dashboard
        </NavLink>

        <div className="mt-6 mb-6">

          <GlobalSearch />

        </div>

        {/* Competition */}

        <div className="mb-3">

          <button
            onClick={() => setCompetitionOpen(!competitionOpen)}
            className="flex w-full items-center justify-between rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:bg-slate-100 transition"
          >
            <span>Competition</span>

            <span>{competitionOpen ? "▼" : "▶"}</span>

          </button>

          {competitionOpen && (

            <div className="mt-1 space-y-1">

             <NavLink
  to="/rankings"
  className={childLinkClass}
>
  Rankings
</NavLink>

<NavLink
  to="/my-profile"
  className={childLinkClass}
>
  My Profile
</NavLink>

              <NavLink
                to="/clubs"
                className={childLinkClass}
              >
                Clubs
              </NavLink>

              <NavLink
                to="/events"
                className={childLinkClass}
              >
                Events
              </NavLink>

              {isAdmin && (

                <NavLink
                  to="/players"
                  className={childLinkClass}
                >
                  Player Management
                </NavLink>

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
              <span>Match Centre</span>

              <span>{matchCentreOpen ? "▼" : "▶"}</span>

            </button>

            {matchCentreOpen && (

              <div className="mt-1 space-y-1">

                <NavLink
                  to="/matches"
                  className={childLinkClass}
                >
                  Record Match
                </NavLink>

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
            <span>Tools</span>

            <span>{toolsOpen ? "▼" : "▶"}</span>

          </button>

          {toolsOpen && (

            <div className="mt-1 space-y-1">

              <NavLink
                to="/simulator"
                className={childLinkClass}
              >
                TTR Calculator
              </NavLink>

              {isAdmin && (

                <NavLink
                  to="/settings"
                  className={childLinkClass}
                >
                  Settings
                </NavLink>

              )}

            </div>

          )}

        </div>

      </nav>

      <div className="border-t px-6 py-4 text-xs text-slate-400">

        Version 0.2.0

      </div>

    </aside>
  );
}