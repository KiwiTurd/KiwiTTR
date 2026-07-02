import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import type { Event } from "../types/event";

import { addEvent, getEvents } from "../services/eventService";
import { getMatches } from "../services/matchService";

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    setEvents(getEvents());
  }, []);

  function handleAddEvent() {
    if (!name.trim()) return;

    const event: Event = {
      id: crypto.randomUUID(),
      name,
      date: new Date().toISOString(),
    };

    addEvent(event);

    setEvents(getEvents());

    setName("");
  }

  const matches = useMemo(() => getMatches(), []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      <div>

        <h1 className="text-5xl font-bold">
          Events
        </h1>

        <p className="text-slate-500 mt-2">
          Manage tournaments and club nights
        </p>

      </div>

      <div className="bg-white rounded-xl shadow p-6">

        <input
          className="border rounded-lg p-3 w-full"
          placeholder="Event name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          onClick={handleAddEvent}
          className="mt-4 bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-lg transition"
        >
          Add Event
        </button>

      </div>

      {events.length === 0 ? (

        <div className="bg-white rounded-xl shadow p-10 text-center text-slate-500">
          No events yet.
        </div>

      ) : (

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

          {events.map((event) => {

            const eventMatches = matches.filter(
              (m) => m.eventId === event.id
            );

            const playerIds = new Set<string>();

            eventMatches.forEach((match) => {
              playerIds.add(match.player1Id);
              playerIds.add(match.player2Id);
            });

            return (

              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="bg-white rounded-xl shadow hover:shadow-lg transition p-6 block"
              >

                <h2 className="text-2xl font-bold">
                  🏓 {event.name}
                </h2>

                <p className="text-slate-500 mt-2">
                  {new Date(event.date).toLocaleDateString()}
                </p>

                <div className="grid grid-cols-2 gap-4 mt-6">

                  <div>

                    <p className="text-slate-500 text-sm">
                      Matches
                    </p>

                    <p className="text-3xl font-bold">
                      {eventMatches.length}
                    </p>

                  </div>

                  <div>

                    <p className="text-slate-500 text-sm">
                      Players
                    </p>

                    <p className="text-3xl font-bold">
                      {playerIds.size}
                    </p>

                  </div>

                </div>

                <p className="text-blue-700 mt-6 font-semibold">
                  Open →
                </p>

              </Link>

            );

          })}

        </div>

      )}

    </div>
  );
}