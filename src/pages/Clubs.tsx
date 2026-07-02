import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import type { Club } from "../types/club";

import { addClub, getClubs } from "../services/clubService";
import { getPlayers } from "../services/playerService";

export default function Clubs() {
  const [clubs, setClubs] = useState<Club[]>([]);

  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");

  useEffect(() => {
    setClubs(getClubs());
  }, []);

  const players = useMemo(() => getPlayers(), []);

  function handleAddClub() {
    if (!name.trim()) return;

    const club: Club = {
      id: crypto.randomUUID(),

      name,
      shortName,

      address,
      phone,
      email,
      website,

      createdAt: new Date().toISOString(),
    };

    addClub(club);

    setClubs(getClubs());

    setName("");
    setShortName("");
    setAddress("");
    setPhone("");
    setEmail("");
    setWebsite("");
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      <div>

        <h1 className="text-5xl font-bold">
          Clubs
        </h1>

        <p className="text-slate-500 mt-2">
          Manage table tennis clubs
        </p>

      </div>

      <div className="bg-white rounded-xl shadow p-6">

        <div className="grid md:grid-cols-2 gap-4">

          <input
            placeholder="Club Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border rounded-lg p-3"
          />

          <input
            placeholder="Short Name"
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
            className="border rounded-lg p-3"
          />

          <input
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="border rounded-lg p-3"
          />

          <input
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border rounded-lg p-3"
          />

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded-lg p-3"
          />

          <input
            placeholder="Website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="border rounded-lg p-3"
          />

        </div>

        <button
          onClick={handleAddClub}
          className="mt-6 bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-lg transition"
        >
          Add Club
        </button>

      </div>

      {clubs.length === 0 ? (

        <div className="bg-white rounded-xl shadow p-10 text-center text-slate-500">
          No clubs yet.
        </div>

      ) : (

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

          {clubs.map((club) => {

            const clubPlayers = players.filter(
              (p) => p.clubId === club.id && p.isActive
            );

            const highestRated =
              clubPlayers.length === 0
                ? "-"
                : Math.max(...clubPlayers.map((p) => p.rating));

            return (

              <Link
                key={club.id}
                to={`/clubs/${club.id}`}
                className="bg-white rounded-xl shadow hover:shadow-lg transition p-6 block"
              >

                <h2 className="text-2xl font-bold">
                  {club.name}
                </h2>

                <p className="text-slate-500 mt-1">
                  {club.shortName}
                </p>

                <div className="grid grid-cols-2 gap-4 mt-6">

                  <div>

                    <p className="text-sm text-slate-500">
                      Players
                    </p>

                    <p className="text-3xl font-bold">
                      {clubPlayers.length}
                    </p>

                  </div>

                  <div>

                    <p className="text-sm text-slate-500">
                      Top Rating
                    </p>

                    <p className="text-3xl font-bold">
                      {highestRated}
                    </p>

                  </div>

                </div>

                <p className="text-blue-700 font-semibold mt-6">
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