import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Eye,
} from "lucide-react";

import type { SavedTournament } from "../../types/tournament";
import { formatStartTime } from "../../utils/tournamentTime";
import ExpandableDescription from "../shared/ExpandableDescription";

type UpcomingTournamentAccordionProps = {
  tournaments: SavedTournament[];
  clubNameFor?: (clubId: string) => string | undefined;
};

function formatLabel(tournament: SavedTournament) {
  switch (tournament.settings.format) {
    case "pools":
      return "Pools → Knockout";
    case "pool-ratings":
      return "Pool Only Ratings";
    case "doubles":
      return "Doubles Knockout";
    case "double-knockout":
      return "Double Knockout";
    default:
      return "Straight Knockout";
  }
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}

export default function UpcomingTournamentAccordion({
  tournaments,
  clubNameFor,
}: UpcomingTournamentAccordionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="divide-y">
      {tournaments.map((tournament) => {
        const expanded = expandedId === tournament.id;
        const settings = tournament.settings;
        const signupsClosedByDate = Boolean(
          settings.signUpClosesAt &&
          new Date(settings.signUpClosesAt) < new Date()
        );
        const signupsOpen =
          settings.allowSignUp &&
          tournament.status === "draft" &&
          !signupsClosedByDate;
        const age = settings.ageMinimum || settings.ageLimit
          ? [
              settings.ageMinimum ? `O${settings.ageMinimum}` : null,
              settings.ageLimit ? `U${settings.ageLimit}` : null,
            ].filter(Boolean).join(" · ")
          : "Open";
        const gender =
          settings.gender === "open"
            ? "Open"
            : settings.gender === "female"
              ? "Female"
              : "Male";

        return (
          <div key={tournament.id}>
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpandedId(expanded ? null : tournament.id)}
              className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3 text-left transition hover:bg-slate-50"
            >
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <h3 className="truncate text-sm font-semibold">
                    {settings.name}
                  </h3>
                  {expanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(settings.date).toLocaleDateString()}
                  {settings.startTime && ` at ${formatStartTime(settings.startTime)}`}
                  {" · "}
                  {formatLabel(tournament)}
                </p>
              </div>
              <span className="rounded-full bg-indigo-100 px-2 py-1 text-[11px] font-semibold text-indigo-700">
                Upcoming
              </span>
            </button>

            {expanded && (
              <div className="space-y-3 bg-slate-50 px-5 py-4">
                {settings.eventDescription && (
                  <ExpandableDescription description={settings.eventDescription} />
                )}

                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  <Detail label="Date" value={new Date(settings.date).toLocaleDateString()} />
                  <Detail label="Start Time" value={settings.startTime ? formatStartTime(settings.startTime) : "Time not set"} />
                  <Detail label="Club" value={clubNameFor?.(settings.clubId) ?? "Club"} />
                  <Detail label="Format" value={formatLabel(tournament)} />
                  <Detail
                    label="Players"
                    value={
                      settings.playerLimitEnabled
                        ? `${tournament.players.length}/${settings.playerCount}`
                        : `${tournament.players.length} signed up`
                    }
                  />
                  <Detail
                    label="Sign Ups"
                    value={signupsOpen ? "Open" : settings.allowSignUp ? "Closed" : "Off"}
                  />
                  <Detail
                    label="Sign Up Close Date"
                    value={settings.signUpClosesAt ? new Date(settings.signUpClosesAt).toLocaleDateString() : "None"}
                  />
                  <Detail
                    label="TTR Limit"
                    value={settings.ttrLimitEnabled ? `Max ${settings.ttrLimit}` : "Off"}
                  />
                  <Detail label="Age" value={age} />
                  <Detail label="Gender" value={gender} />
                </div>

                <Link
                  to={`/tournaments/${tournament.id}/viewer`}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  <Eye className="h-4 w-4" />
                  Open Viewer
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
