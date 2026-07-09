import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";

import {
  ArrowRight,
  Building2,
  CalendarDays,
  Eye,
  Plus,
  Search,
  Trophy,
} from "lucide-react";

import type { Event } from "../types/event";
import type { Club } from "../types/club";

import {
  addEvent,
  getEvents,
} from "../services/supabase/eventService";

import {
  getClubs,
} from "../services/supabase/clubService";

import useRole from "../hooks/useRole";
import { notify } from "../services/notificationService";
import { useTournament } from "../context/TournamentContext";

export default function Events() {
  const { savedTournaments } =
    useTournament();

  const {
    isAdmin,
    isClubLeader,
    clubId: userClubId,
  } = useRole();

  const [events, setEvents] =
    useState<Event[]>([]);

  const [clubs, setClubs] =
    useState<Club[]>([]);

  const [name, setName] =
    useState("");

  const [clubId, setClubId] =
    useState("");

  const [eventDate, setEventDate] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const canCreateEvent =
    isAdmin ||
    (isClubLeader && Boolean(userClubId));

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [eventData, clubData] =
        await Promise.all([
          getEvents(),
          getClubs(),
        ]);

      if (isAdmin) {
        setEvents(eventData);
        setClubs(clubData);
        return;
      }

      if (isClubLeader && userClubId) {
        setEvents(
          eventData.filter(
            (event) =>
              event.clubId === userClubId
          )
        );

        setClubs(
          clubData.filter(
            (club) => club.id === userClubId
          )
        );

        setClubId(userClubId);
        return;
      }

      setEvents(eventData);
      setClubs(clubData);
    } catch (error) {
      console.error(error);
      notify.fault("Failed to load events.");
    } finally {
      setLoading(false);
    }
  }, [
    isAdmin,
    isClubLeader,
    userClubId,
  ]);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadData();
      }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadData]);

  async function handleAddEvent() {
    const assignedClubId = isAdmin
      ? clubId
      : userClubId;

    if (
      !name.trim() ||
      !assignedClubId ||
      !eventDate
    ) {
      notify.timeout("Please complete all fields.");
      return;
    }

    setSaving(true);

    try {
      const event: Event = {
        id: crypto.randomUUID(),
        clubId: assignedClubId,
        name: name.trim(),
        date: eventDate,
      };

      await addEvent(event);
      await loadData();

      notify.eventCreated(event.name);

      setName("");
      setEventDate("");

      if (isAdmin) {
        setClubId("");
      }
    } catch (error) {
      console.error(error);
      notify.fault("Failed to create event.");
    } finally {
      setSaving(false);
    }
  }

  function getClubName(eventClubId: string) {
    return (
      clubs.find((club) => club.id === eventClubId)
        ?.name ?? "-"
    );
  }

  const eventCards = useMemo(() => {
    return events.map((event) => ({
      event,
      club: clubs.find((c) => c.id === event.clubId),
    }));
  }, [events, clubs]);

  const filteredEventCards = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return eventCards;
    }

    return eventCards.filter(({ event, club }) => {
      const searchable = [
        event.name,
        event.date,
        club?.name,
        club?.shortName,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [eventCards, search]);

  const tournamentCards = useMemo(() => {
    return savedTournaments.map((tournament) => ({
      tournament,
      club: clubs.find(
        (club) =>
          club.id === tournament.settings.clubId
      ),
      liveMatches: tournament.knockout.filter(
        (match) =>
          !match.completed &&
          match.playerOne &&
          match.playerTwo
      ).length,
    }));
  }, [clubs, savedTournaments]);

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return events.filter((event) => {
      const date = new Date(event.date);
      date.setHours(0, 0, 0, 0);
      return date >= today;
    }).length;
  }, [events]);

  return (
    <div className="mx-auto max-w-7xl space-y-10">

      <div>

        <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
          KiwiTTR
        </p>

        <h1 className="mt-2 text-5xl font-black tracking-tight">
          Events
        </h1>

        <p className="mt-3 text-lg text-slate-500">
          Browse tournaments, club nights and match activity.
        </p>

      </div>

      <div className="grid gap-4 md:grid-cols-3">

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <CalendarDays className="h-6 w-6 text-blue-700" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Events
            </p>
            <p className="text-3xl font-black">
              {events.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <Trophy className="h-6 w-6 text-amber-500" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Tournaments
            </p>
            <p className="text-3xl font-black">
              {tournamentCards.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <Building2 className="h-6 w-6 text-indigo-600" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Upcoming
            </p>
            <p className="text-3xl font-black">
              {upcomingEvents}
            </p>
          </div>
        </div>

      </div>

      {tournamentCards.length > 0 && (

        <div className="space-y-4">

          <div className="flex items-center gap-3">
            <Eye className="h-6 w-6 text-green-600" />
            <h2 className="text-2xl font-bold">
              Tournament Viewers
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">

            {tournamentCards.map(({
              tournament,
              club,
              liveMatches,
            }) => (

              <Link
                key={tournament.id}
                to={`/tournaments/${tournament.id}/viewer`}
                className="group block rounded-2xl border border-green-200 bg-white p-6 shadow-sm transition hover:border-green-400 hover:shadow-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-5">
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Live Viewer
                    </div>

                    <h3 className="mt-4 truncate text-2xl font-black">
                      {tournament.settings.name}
                    </h3>

                    <p className="mt-2 text-slate-500">
                      {club?.name ?? "-"} ·{" "}
                      {new Date(
                        tournament.settings.date
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-500">
                      Live Matches
                    </div>
                    <div className="mt-1 text-3xl font-black text-green-700">
                      {liveMatches}
                    </div>
                    <div className="mt-3 flex items-center justify-end gap-2 font-semibold text-blue-700">
                      Open
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>

            ))}

          </div>

        </div>

      )}

      {canCreateEvent && (

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center gap-3 border-b px-8 py-5">
            <Plus className="h-6 w-6 text-blue-700" />
            <h2 className="text-2xl font-bold">
              Create Event
            </h2>
          </div>

          <div className="p-8">
            <div
              className={`grid gap-4 ${
                isAdmin
                  ? "md:grid-cols-3"
                  : "md:grid-cols-2"
              }`}
            >
              <input
                placeholder="Event Name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
              />

              {isAdmin ? (
                <select
                  value={clubId}
                  onChange={(e) =>
                    setClubId(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">
                    Select Club
                  </option>

                  {clubs.map((club) => (
                    <option
                      key={club.id}
                      value={club.id}
                    >
                      {club.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">
                    Club
                  </p>
                  <p className="font-semibold">
                    {userClubId
                      ? getClubName(userClubId)
                      : "-"}
                  </p>
                </div>
              )}

              <input
                type="date"
                value={eventDate}
                onChange={(e) =>
                  setEventDate(e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <button
              onClick={handleAddEvent}
              disabled={saving}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-900 px-6 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <Plus className="h-5 w-5" />
              {saving ? "Creating..." : "Create Event"}
            </button>
          </div>

        </div>

      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

          <input
            type="search"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search events by name, club or date"
            className="w-full rounded-xl border border-slate-300 py-3 pl-12 pr-4 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
          />
        </div>

      </div>

      {loading ? (

        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          Loading events...
        </div>

      ) : eventCards.length === 0 ? (

        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          No events yet.
        </div>

      ) : filteredEventCards.length === 0 ? (

        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          No events match your search.
        </div>

      ) : (

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

          {filteredEventCards.map(({ event, club }) => (

            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate text-2xl font-bold">
                    {event.name}
                  </h2>

                  <p className="mt-1 text-slate-500">
                    {club?.name ?? "-"}
                  </p>
                </div>

                <CalendarDays className="h-7 w-7 shrink-0 text-blue-700" />
              </div>

              <div className="mt-6 rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Event Date
                </p>

                <p className="text-2xl font-black">
                  {new Date(event.date).toLocaleDateString()}
                </p>
              </div>

              <div className="mt-6 flex items-center gap-2 font-semibold text-blue-700">
                Open
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>

          ))}

        </div>

      )}

    </div>
  );
}
