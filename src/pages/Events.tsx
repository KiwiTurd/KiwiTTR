import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

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

export default function Events() {
  const {
    isAdmin,
    isClubLeader,
    clubId: userClubId,
  } = useRole();

  const [events, setEvents] = useState<Event[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);

  const [name, setName] = useState("");
  const [clubId, setClubId] = useState("");
  const [eventDate, setEventDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadData();
  }, [isAdmin, isClubLeader, userClubId]);

  async function loadData() {
    try {
      setLoading(true);

      const [eventData, clubData] = await Promise.all([
        getEvents(),
        getClubs(),
      ]);

      if (isAdmin) {
        setEvents(eventData);
        setClubs(clubData);
      } else if (isClubLeader && userClubId) {
        setEvents(
          eventData.filter(
            (event) => event.clubId === userClubId
          )
        );

        setClubs(
          clubData.filter(
            (club) => club.id === userClubId
          )
        );

        setClubId(userClubId);
      } else {
        setEvents(eventData);
        setClubs(clubData);
      }

    } catch (error) {
      console.error(error);
      notify.fault("Failed to load events.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddEvent() {
    const assignedClubId = isAdmin
      ? clubId
      : userClubId;

    if (!name.trim() || !assignedClubId || !eventDate) {
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

  const eventCards = useMemo(() => {
    return events.map((event) => ({
      event,
      club: clubs.find((c) => c.id === event.clubId),
    }));
  }, [events, clubs]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      <div>

        <h1 className="text-5xl font-bold">
          Events
        </h1>

        <p className="text-slate-500 mt-2">
          Browse tournaments and club nights
        </p>

      </div>

      {(isAdmin || isClubLeader) && (

        <div className="bg-white rounded-xl shadow p-6">

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
              onChange={(e) => setName(e.target.value)}
              className="border rounded-lg p-3"
            />

            {isAdmin && (

              <select
                value={clubId}
                onChange={(e) => setClubId(e.target.value)}
                className="border rounded-lg p-3"
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

            )}

            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="border rounded-lg p-3"
            />

          </div>

          <button
            onClick={handleAddEvent}
            disabled={saving}
            className="mt-6 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-400 text-white px-6 py-3 rounded-lg transition"
          >
            {saving ? "Creating..." : "Create Event"}
          </button>

        </div>

      )}

      {loading ? (

        <div className="bg-white rounded-xl shadow p-10 text-center text-slate-500">
          Loading events...
        </div>

      ) : eventCards.length === 0 ? (

        <div className="bg-white rounded-xl shadow p-10 text-center text-slate-500">
          No events yet.
        </div>

      ) : (

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

          {eventCards.map(({ event, club }) => (

            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="bg-white rounded-xl shadow hover:shadow-lg transition p-6 block"
            >

              <h2 className="text-2xl font-bold">
                🏓 {event.name}
              </h2>

              <p className="text-slate-500 mt-2">
                {club?.name ?? "-"}
              </p>

              <p className="text-slate-500">
                {new Date(event.date).toLocaleDateString()}
              </p>

              <p className="text-blue-700 mt-6 font-semibold">
                Open →
              </p>

            </Link>

          ))}

        </div>

      )}

    </div>
  );
}