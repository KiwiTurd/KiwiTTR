import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import type { Club } from "../types/club";
import type { Player } from "../types/player";

import {
  addClub,
  getClubs,
} from "../services/supabase/clubService";

import { getPlayers } from "../services/supabase/playerService";

import useRole from "../hooks/useRole";

export default function Clubs() {
  const { isAdmin } = useRole();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      const [clubData, playerData] = await Promise.all([
        getClubs(),
        getPlayers(),
      ]);

      setClubs(clubData);
      setPlayers(playerData);
    } catch (error) {
      console.error(error);
      alert("Unable to load clubs.");
    }
  }

  async function handleAddClub() {
    if (!name.trim()) {
      alert("Club name is required.");
      return;
    }

    setSaving(true);

    try {
      const club: Club = {
        id: crypto.randomUUID(),
        name: name.trim(),
        shortName: shortName.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        website: website.trim(),
        createdAt: new Date().toISOString(),
      };

      await addClub(club);

      await loadData();

      setName("");
      setShortName("");
      setAddress("");
      setPhone("");
      setEmail("");
      setWebsite("");

    } catch (error) {
      console.error(error);
      alert("Failed to add club.");
    } finally {
      setSaving(false);
    }
  }

  const clubCards = useMemo(() => {
    return clubs.map((club) => {
      const clubPlayers = players.filter(
        (p) => p.clubId === club.id && p.isActive
      );

      const highestRated =
        clubPlayers.length === 0
          ? "-"
          : Math.max(...clubPlayers.map((p) => p.rating));

      return {
        club,
        playerCount: clubPlayers.length,
        highestRated,
      };
    });
  }, [clubs, players]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      <div>

        <h1 className="text-5xl font-bold">
          Clubs
        </h1>

        <p className="text-slate-500 mt-2">
          Browse New Zealand table tennis clubs
        </p>

      </div>

      {isAdmin && (

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
            disabled={saving}
            className="mt-6 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-400 text-white px-6 py-3 rounded-lg transition"
          >
            {saving ? "Adding..." : "Add Club"}
          </button>

        </div>

      )}

      {clubCards.length === 0 ? (

        <div className="bg-white rounded-xl shadow p-10 text-center text-slate-500">
          No clubs yet.
        </div>

      ) : (

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

          {clubCards.map(({ club, playerCount, highestRated }) => (

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
                    {playerCount}
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

          ))}

        </div>

      )}

    </div>
  );
}