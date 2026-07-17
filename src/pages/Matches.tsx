import {
  CalendarDays,
  ChevronRight,
  ClipboardPen,
  Trophy,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import MatchForm from "../components/matches/MatchForm";
import MatchHistory from "../components/matches/MatchHistory";
import LoadingScreen from "../components/shared/LoadingScreen";
import { useTournament } from "../context/TournamentContext";
import { notify } from "../services/notificationService";
import { getTeamGames } from "../services/teams/teamGameService";
import { getNewZealandDate } from "../utils/newZealandDate";
import { formatStartTime } from "../utils/tournamentTime";

type InputType = "single" | "tournament" | "team" | "club";

const INPUT_OPTIONS = [
  { id: "single", label: "Single Match", icon: ClipboardPen },
  { id: "tournament", label: "Tournament", icon: Trophy },
  { id: "team", label: "Team Game", icon: UsersRound },
  { id: "club", label: "Club Event", icon: CalendarDays },
] as const;

export default function Matches() {
  const [selected, setSelected] = useState<InputType | null>(null);
  const [teamGames, setTeamGames] = useState<Awaited<ReturnType<typeof getTeamGames>>>([]);
  const [loading, setLoading] = useState(true);
  const { savedTournaments, isLoadingTournaments } = useTournament();
  const today = getNewZealandDate();

  useEffect(() => {
    let active = true;

    void getTeamGames()
      .then((teamGameData) => {
        if (active) {
          setTeamGames(teamGameData);
        }
      })
      .catch((error) => {
        console.error(error);
        notify.fault("Unable to load match input events.");
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  const tournamentItems = useMemo(
    () => savedTournaments
      .filter((tournament) =>
        tournament.status !== "completed" &&
        tournament.status !== "cancelled" &&
        (tournament.status === "active" || tournament.settings.date >= today)
      )
      .sort((a, b) => a.settings.date.localeCompare(b.settings.date))
      .map((tournament) => ({
        id: tournament.id,
        name: tournament.settings.name || "Untitled Tournament",
        date: tournament.settings.date,
        startTime: tournament.settings.startTime,
        status: tournament.status === "active" ? "Live" : "Upcoming",
        to: tournament.status === "active"
          ? `/tournaments/${tournament.id}/live`
          : `/tournaments/${tournament.id}/viewer`,
      })),
    [savedTournaments, today]
  );

  const teamItems = useMemo(
    () => teamGames
      .filter((game) => game.status === "live" || game.status === "upcoming")
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((game) => ({
        id: game.id,
        name: game.name,
        date: game.date,
        startTime: game.startTime,
        status: game.status === "live" ? "Live" : "Upcoming",
        meta: game.clubName,
        to: `/team-games/${game.id}/live`,
      })),
    [teamGames]
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="mt-2 text-5xl font-normal tracking-tight text-slate-900">
          Match Input
        </h1>
        <p className="mt-3 text-lg text-slate-500">
          Choose the type of match or event you want to manage.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {INPUT_OPTIONS.map(({ id, label, icon: Icon }) => {
          const active = selected === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => setSelected(active ? null : id)}
              className={`flex items-center justify-between rounded-2xl border px-5 py-4 text-left font-semibold shadow-sm transition ${
                active
                  ? "border-blue-900 bg-blue-900 text-white"
                  : "border-slate-200 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-5 w-5" />
                {label}
              </span>
              <ChevronRight className={`h-5 w-5 transition ${active ? "rotate-90" : ""}`} />
            </button>
          );
        })}
      </div>

      {selected === "single" && (
        <div className="space-y-8">
          <MatchForm />
          <MatchHistory />
        </div>
      )}

      {selected && selected !== "single" && (
        loading || (selected === "tournament" && isLoadingTournaments) ? (
          <LoadingScreen label="Loading live and upcoming events..." />
        ) : (
          <CondensedEventList
            title={INPUT_OPTIONS.find((option) => option.id === selected)?.label ?? "Events"}
            items={selected === "tournament" ? tournamentItems : selected === "team" ? teamItems : []}
            emptyLabel={selected === "club" ? "Club events will be available shortly." : "No live or upcoming events are available."}
            action={selected === "club" ? { label: "View Club Events", to: "/club-events" } : undefined}
          />
        )
      )}
    </div>
  );
}

type CondensedItem = {
  id: string;
  name: string;
  date: string;
  startTime?: string | null;
  status: string;
  meta?: string;
  to: string;
};

function CondensedEventList({
  title,
  items,
  emptyLabel,
  action,
}: {
  title: string;
  items: CondensedItem[];
  emptyLabel: string;
  action?: { label: string; to: string };
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b px-5 py-3">
        <div>
          <h2 className="font-semibold">Live &amp; Upcoming {title}s</h2>
          <p className="text-xs text-slate-500">Select an event to open match input.</p>
        </div>
        {action && (
          <Link to={action.to} className="text-sm font-semibold text-blue-800 hover:underline">
            {action.label}
          </Link>
        )}
      </div>
      {items.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {items.map((item) => (
            <Link
              key={item.id}
              to={item.to}
              className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-3 transition hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_11rem_6rem_auto]"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{item.name}</p>
                {item.meta && <p className="truncate text-xs text-slate-500">{item.meta}</p>}
              </div>
              <div className="hidden text-sm text-slate-600 sm:block">
                {new Date(`${item.date}T00:00:00`).toLocaleDateString("en-NZ")}
                {item.startTime && <span className="ml-2 text-xs">{formatStartTime(item.startTime)}</span>}
              </div>
              <span className={`hidden rounded-full px-2 py-1 text-center text-xs font-semibold sm:block ${
                item.status === "Live" ? "bg-green-100 text-green-700" : "bg-indigo-100 text-indigo-700"
              }`}>
                {item.status}
              </span>
              <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
