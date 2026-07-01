import { useEffect, useState } from "react";
import type { Event } from "../types/event";
import { addEvent, getEvents } from "../services/eventService";

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

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">
        Events
      </h1>

      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <input
          className="border rounded-lg p-3 w-full"
          placeholder="Event name (e.g. Hamilton Club Night)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          onClick={handleAddEvent}
          className="mt-4 bg-blue-900 text-white px-6 py-3 rounded-lg"
        >
          Add Event
        </button>
      </div>

      <div className="bg-white rounded-xl shadow">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left p-4">Name</th>
              <th className="text-left">Date Created</th>
            </tr>
          </thead>

          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-t">
                <td className="p-4">{event.name}</td>
                <td>{new Date(event.date).toLocaleDateString()}</td>
              </tr>
            ))}

            {events.length === 0 && (
              <tr>
                <td colSpan={2} className="text-center py-8 text-slate-500">
                  No events yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}