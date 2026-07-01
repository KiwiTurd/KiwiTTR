import { useEffect, useState } from "react";
import type { Club } from "../types/club";
import { addClub, getClubs } from "../services/clubService";

export default function Clubs() {

  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubName, setClubName] = useState("");
  const [shortName, setShortName] = useState("");

  useEffect(() => {
    setClubs(getClubs());
  }, []);

  function handleAddClub() {

    if (!clubName.trim()) return;

    const club: Club = {
      id: crypto.randomUUID(),
      name: clubName,
      shortName,
      createdAt: new Date().toISOString(),
    };

    addClub(club);

    setClubs(getClubs());

    setClubName("");
    setShortName("");
  }

  return (
    <div className="max-w-4xl mx-auto">

      <h1 className="text-4xl font-bold mb-8">
        Clubs
      </h1>

      <div className="bg-white rounded-xl shadow p-6 mb-8">

        <div className="grid grid-cols-2 gap-4">

          <input
            placeholder="Club Name"
            value={clubName}
            onChange={(e)=>setClubName(e.target.value)}
            className="border rounded-lg p-3"
          />

          <input
            placeholder="Short Name (e.g. HAM)"
            value={shortName}
            onChange={(e)=>setShortName(e.target.value)}
            className="border rounded-lg p-3"
          />

        </div>

        <button
          onClick={handleAddClub}
          className="mt-4 bg-blue-900 text-white px-6 py-3 rounded-lg"
        >
          Add Club
        </button>

      </div>

      <div className="bg-white rounded-xl shadow">

        <table className="w-full">

          <thead className="bg-slate-100">

            <tr>

              <th className="text-left p-4">Club</th>

              <th className="text-left">Short Name</th>

            </tr>

          </thead>

          <tbody>

            {clubs.map((club)=>(
              <tr
                key={club.id}
                className="border-t"
              >

                <td className="p-4">
                  {club.name}
                </td>

                <td>
                  {club.shortName}
                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>
  );

}