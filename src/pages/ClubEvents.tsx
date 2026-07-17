import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Eye,
  Plus,
  Shield,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useTournament } from "../context/TournamentContext";
import ExpandableDescription from "../components/shared/ExpandableDescription";
import useRole from "../hooks/useRole";
import { notify } from "../services/notificationService";
import { formatStartTime } from "../utils/tournamentTime";
import { UnlinkedClubMessage } from "./MyClub";

export default function ClubEvents() {
  const { isAdmin, isClubLeader, clubId, playerId } = useRole();
  const { savedTournaments, signUpForTournament } = useTournament();
  const [signingUp, setSigningUp] = useState<string | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const canCreate = isAdmin || isClubLeader;
  const clubEvents = useMemo(() => savedTournaments
    .filter((event) =>
      event.settings.eventType === "club-round-robin" &&
      (isAdmin || event.settings.clubId === clubId)
    )
    .sort((a, b) => a.settings.date.localeCompare(b.settings.date)),
  [clubId, isAdmin, savedTournaments]);
  const liveCount = clubEvents.filter((event) => event.status === "active").length;
  const upcomingCount = clubEvents.filter((event) => event.status === "draft").length;

  async function signUp(eventId: string) {
    if (!playerId) {
      notify.timeout("Link a player profile before signing up.");
      return;
    }
    setSigningUp(eventId);
    try {
      await signUpForTournament(eventId, playerId);
      notify.success("You are signed up for this club event.");
    } catch (error) {
      console.error(error);
      notify.fault(error instanceof Error ? error.message : "Unable to sign up.");
    } finally {
      setSigningUp(null);
    }
  }

  if (!isAdmin && !clubId) {
    return <UnlinkedClubMessage />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-300 pb-6 md:items-end">
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
          <div className="hidden grid-cols-[minmax(0,2fr)_minmax(8rem,1fr)_minmax(7rem,1fr)_minmax(7rem,1fr)] items-center gap-x-5 border-b bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:grid">
            <span>Club Event</span>
            <span className="text-center">Date</span>
            <span className="text-center">Type</span>
            <span className="text-center">Status</span>
          </div>

          {clubEvents.length === 0 ? <div className="p-10 text-center">
            <CalendarDays className="mx-auto h-9 w-9 text-slate-300" />
            <h2 className="mt-3 text-lg font-semibold text-slate-800">
              No club events yet
            </h2>
            <p className="mx-auto mt-1 max-w-lg text-sm text-slate-500">
              Create a round-robin event to start organising your club night.
            </p>
          </div> : <div className="divide-y">
            {clubEvents.map((event) => {
              const signedUp = Boolean(playerId && event.players.some((player) => player.id === playerId));
              const status = event.status === "active" ? "Live" : event.status === "completed" ? "Completed" : "Upcoming";
              const expanded = expandedEventId === event.id;
              const roundRobinTotal = event.pools.length || event.settings.roundRobinCount || 1;
              return <div key={event.id}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setExpandedEventId(expanded ? null : event.id)}
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 px-4 py-3 text-left transition hover:bg-slate-50 md:grid-cols-[minmax(0,2fr)_minmax(8rem,1fr)_minmax(7rem,1fr)_minmax(7rem,1fr)] md:gap-x-5"
                >
                  <div className="min-w-0">
                    <span className="flex min-w-0 items-center gap-2 font-semibold">
                      <span className="truncate">{event.settings.name}</span>
                      {expanded
                        ? <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                        : <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />}
                    </span>
                    <span className="block truncate text-xs text-slate-500">{roundRobinTotal} round robins · {event.players.length} players</span>
                  </div>
                  <div className="col-start-1 row-start-2 mt-1 text-xs text-slate-500 md:col-start-auto md:row-start-auto md:mt-0 md:text-center md:text-sm">
                    <div className="font-medium text-slate-700">{new Date(`${event.settings.date}T00:00:00`).toLocaleDateString("en-NZ")}</div>
                    <div className="text-[11px]">{event.settings.startTime ? formatStartTime(event.settings.startTime) : "Time not set"}</div>
                  </div>
                  <div className="col-start-2 row-start-2 mt-1 flex justify-end md:col-start-auto md:row-start-auto md:mt-0 md:justify-center">
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Round Robin</span>
                  </div>
                  <div className="col-span-2 mt-1 flex justify-start md:col-span-1 md:mt-0 md:justify-center">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${event.status === "active" ? "bg-green-100 text-green-700" : event.status === "completed" ? "bg-slate-100 text-slate-600" : "bg-indigo-100 text-indigo-700"}`}>{status}</span>
                  </div>
                </button>

                {expanded && <div className="space-y-3 bg-slate-50 px-4 py-3">
                  {event.settings.eventDescription && <ExpandableDescription description={event.settings.eventDescription} />}
                  <div className="grid gap-2 md:grid-cols-3">
                    <DetailItem label="Round Robins" value={String(roundRobinTotal)} />
                    <DetailItem label="Players" value={String(event.players.length)} />
                    <DetailItem label="Sign Ups" value={event.settings.allowSignUp && event.status === "draft" ? "Open" : "Closed"} />
                    <DetailItem label="TTR" value={event.settings.socialPlay ? "Disabled" : "Enabled"} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/club-events/${event.id}/viewer`} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"><Eye className="h-4 w-4" />Viewer</Link>
                    {isAdmin || isClubLeader
                      ? <Link to={`/club-events/${event.id}/live`} className="inline-flex items-center rounded-lg bg-blue-900 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800">Manage Event</Link>
                      : event.status === "draft" && event.settings.allowSignUp
                        ? <button type="button" disabled={signedUp || signingUp === event.id} onClick={() => void signUp(event.id)} className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-3 py-2 text-sm font-semibold text-white disabled:bg-green-600"><UserPlus className="h-4 w-4" />{signedUp ? "Signed Up" : signingUp === event.id ? "Joining..." : "Sign Up"}</button>
                        : null}
                  </div>
                </div>}
              </div>;
            })}
          </div>}
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard icon={<UsersRound className="h-5 w-5 text-emerald-600" />} label="Club Events" value={String(clubEvents.length)} />
        <StatCard icon={<Shield className="h-5 w-5 text-green-600" />} label="Live" value={String(liveCount)} />
        <StatCard icon={<CalendarDays className="h-5 w-5 text-blue-700" />} label="Upcoming" value={String(upcomingCount)} />
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border bg-white px-3 py-2">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-0.5 text-sm font-semibold text-slate-800">{value}</p>
  </div>;
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
