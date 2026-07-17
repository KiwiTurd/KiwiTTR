import {
  CalendarDays,
  Plus,
  Shield,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";

import useRole from "../hooks/useRole";
import { UnlinkedClubMessage } from "./MyClub";

export default function ClubEvents() {
  const { isAdmin, isClubLeader, clubId } = useRole();
  const canCreate = isAdmin || isClubLeader;

  if (!isAdmin && !clubId) {
    return <UnlinkedClubMessage />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4 pb-6 md:items-end">
        <div>
          <h1 className="mt-2 text-5xl font-normal tracking-tight text-slate-900">
            Club Events
          </h1>
          <p className="mt-3 text-lg text-slate-500">
            View club nights, round robins and upcoming events for your club.
          </p>
        </div>

        {canCreate && (
          <Link
            to="/club-events/new"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            <Plus className="h-5 w-5" />
            Create Event
          </Link>
        )}
      </div>

      <section className="space-y-8">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[minmax(0,2fr)_minmax(8rem,1fr)_minmax(7rem,1fr)_minmax(5rem,0.65fr)] items-center gap-x-5 border-b bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:grid">
            <span>Club Event</span>
            <span className="text-center">Date</span>
            <span className="text-center">Type</span>
            <span className="text-center">Status</span>
          </div>

          <div className="p-10 text-center">
            <CalendarDays className="mx-auto h-9 w-9 text-slate-300" />
            <h2 className="mt-3 text-lg font-semibold text-slate-800">
              No club events yet
            </h2>
            <p className="mx-auto mt-1 max-w-lg text-sm text-slate-500">
              Club event storage and match builders will be connected shortly.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard icon={<UsersRound className="h-5 w-5 text-emerald-600" />} label="Club Events" value="0" />
        <StatCard icon={<Shield className="h-5 w-5 text-green-600" />} label="Live" value="0" />
        <StatCard icon={<CalendarDays className="h-5 w-5 text-blue-700" />} label="Upcoming" value="0" />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      {icon}
      <div>
        <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
        <p className="text-xl font-black">{value}</p>
      </div>
    </div>
  );
}
