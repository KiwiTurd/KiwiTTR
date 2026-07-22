import {
  ArrowLeft,
  CalendarRange,
  ChevronRight,
  MoonStar,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useTournament } from "../context/TournamentContext";
import { clearFormDraft } from "../hooks/useFormDraftState";
import useRole from "../hooks/useRole";
import { UnlinkedClubMessage } from "./MyClub";
import SlateImagePageHeader from "../components/shared/SlateImagePageHeader";

const builders = [
  {
    name: "Round Robin Builder",
    description: "Create groups, select club players and generate a round-robin match schedule.",
    icon: CalendarRange,
    href: "/club-events/round-robin/new",
  },
  {
    name: "General Club Night Builder",
    description: "Create a flexible club night and add matches as players arrive and play.",
    icon: MoonStar,
    href: "",
  },
];

export default function ClubEventType() {
  const { isAdmin, clubId } = useRole();
  const { resetTournament } = useTournament();

  function startNewBuilder() {
    clearFormDraft("club-round-robin");
    resetTournament();
  }

  if (!isAdmin && !clubId) {
    return <UnlinkedClubMessage />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <SlateImagePageHeader
        pageKey="club-event-type"
        title="Club Event Type"
        subtitle="Choose how you want to organise the club event."
        actions={<Link to="/club-events" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950"><ArrowLeft className="h-4 w-4" />Club Events</Link>}
      />

      <section className="grid gap-4 lg:grid-cols-2">
        {builders.map(({ name, description, icon: Icon, href }) => {
          const card = <div className={`flex min-h-64 flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm ${href ? "transition hover:border-emerald-300 hover:bg-emerald-50" : ""}`}>
            <div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  {href ? "Available" : "Coming shortly"}
                </span>
              </div>
              <h2 className="text-2xl font-black">{name}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
            </div>
            <div className="mt-5 inline-flex items-center gap-2 font-semibold text-slate-400">
              {href ? "Open Builder" : "Builder coming shortly"}
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>;
          return href ? <Link key={name} to={href} onClick={startNewBuilder}>{card}</Link> : <div key={name}>{card}</div>;
        })}
      </section>
    </div>
  );
}
