import {
  ArrowLeft,
  CalendarRange,
  ChevronRight,
  MoonStar,
} from "lucide-react";
import { Link } from "react-router-dom";

import useRole from "../hooks/useRole";
import { UnlinkedClubMessage } from "./MyClub";

const builders = [
  {
    name: "Round Robin Builder",
    description: "Create groups, select club players and generate a round-robin match schedule.",
    icon: CalendarRange,
  },
  {
    name: "General Club Night Builder",
    description: "Create a flexible club night and add matches as players arrive and play.",
    icon: MoonStar,
  },
];

export default function ClubEventType() {
  const { isAdmin, clubId } = useRole();

  if (!isAdmin && !clubId) {
    return <UnlinkedClubMessage />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <Link to="/club-events" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
          <ArrowLeft className="h-4 w-4" />
          Club Events
        </Link>
        <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-emerald-700">
          Create Club Event
        </p>
        <h1 className="mt-2 text-5xl font-normal tracking-tight text-slate-900">
          Club Event Type
        </h1>
        <p className="mt-3 text-lg text-slate-500">
          Choose how you want to organise the club event.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        {builders.map(({ name, description, icon: Icon }) => (
          <div key={name} className="flex min-h-64 flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm">
            <div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  Coming shortly
                </span>
              </div>
              <h2 className="text-2xl font-black">{name}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
            </div>
            <div className="mt-5 inline-flex items-center gap-2 font-semibold text-slate-400">
              Builder coming shortly
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
