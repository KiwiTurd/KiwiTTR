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
  Globe,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Trophy,
  Users,
} from "lucide-react";

import type { Club } from "../types/club";
import type { Player } from "../types/player";

import {
  addClub,
  getClubs,
} from "../services/supabase/clubService";

import { getPlayers } from "../services/supabase/playerService";

import useRole from "../hooks/useRole";
import { notify } from "../services/notificationService";

function externalUrl(url: string) {
  return /^https?:\/\//i.test(url)
    ? url
    : `https://${url}`;
}

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

  const [search, setSearch] = useState("");

  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [clubData, playerData] = await Promise.all([
        getClubs(),
        getPlayers(),
      ]);

      setClubs(clubData);
      setPlayers(playerData);
    } catch (error) {
      console.error(error);
      notify.fault("Unable to load clubs.");
    }
  }, []);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadData();
      }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadData]);

  async function handleAddClub() {
    if (!name.trim()) {
      notify.timeout("Club name is required.");
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
        notice: "",
        headerImageUrl: "",
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

      notify.clubCreated(club.name);

    } catch (error) {
      console.error(error);
      notify.fault("Failed to add club.");
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

  const filteredClubCards = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return clubCards;
    }

    return clubCards.filter(({ club }) => {
      const searchable = [
        club.name,
        club.shortName,
        club.address,
        club.phone,
        club.email,
        club.website,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [clubCards, search]);

  const totalPlayers = useMemo(() => {
    return clubCards.reduce(
      (sum, item) => sum + item.playerCount,
      0
    );
  }, [clubCards]);

  const topClub = useMemo(() => {
    return [...clubCards].sort(
      (a, b) => b.playerCount - a.playerCount
    )[0];
  }, [clubCards]);

  return (
    <div className="mx-auto max-w-7xl space-y-10">

      <div>

        <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">

          KiwiTTR

        </p>

        <h1 className="mt-2 text-5xl font-black tracking-tight">
          Clubs
        </h1>

        <p className="mt-3 text-lg text-slate-500">
          Browse clubs, contacts and active player communities.
        </p>

      </div>

      <div className="grid gap-4 md:grid-cols-3">

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <Building2 className="h-6 w-6 text-blue-700" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Clubs
            </p>
            <p className="text-3xl font-black">
              {clubs.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <Users className="h-6 w-6 text-indigo-600" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Active Players
            </p>
            <p className="text-3xl font-black">
              {totalPlayers}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <Trophy className="h-6 w-6 text-amber-500" />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Largest Club
            </p>
            <p className="truncate text-2xl font-black">
              {topClub?.club.shortName ||
                topClub?.club.name ||
                "-"}
            </p>
          </div>
        </div>

      </div>

      {isAdmin && (

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center gap-3 border-b px-8 py-5">

            <Plus className="h-6 w-6 text-blue-700" />

            <h2 className="text-2xl font-bold">
              Create Club
            </h2>

          </div>

          <div className="p-8">

          <div className="grid gap-4 md:grid-cols-2">

            <input
              placeholder="Club Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
            />

            <input
              placeholder="Short Name"
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
            />

            <input
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
            />

            <input
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
            />

            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
            />

            <input
              placeholder="Website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
            />

          </div>

          <button
            onClick={handleAddClub}
            disabled={saving}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-900 px-6 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <Plus className="h-5 w-5" />
            {saving ? "Adding..." : "Add Club"}
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
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clubs by name, location, contact or website"
            className="w-full rounded-xl border border-slate-300 py-3 pl-12 pr-4 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
          />

        </div>

      </div>

      {clubCards.length === 0 ? (

        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          No clubs yet.
        </div>

      ) : filteredClubCards.length === 0 ? (

        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          No clubs match your search.
        </div>

      ) : (

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

          {filteredClubCards.map(({ club, playerCount, highestRated }) => (

            <Link
              key={club.id}
              to={`/clubs/${club.id}`}
              className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >

              {club.headerImageUrl && (
                <div
                  className="mb-5 h-32 rounded-xl bg-slate-200"
                  style={{
                    backgroundImage: `url(${club.headerImageUrl})`,
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                  }}
                />
              )}

              <div className="flex items-start justify-between gap-4">

                <div className="min-w-0">

                  <h2 className="truncate text-2xl font-bold">
                    {club.name}
                  </h2>

                  <p className="mt-1 text-slate-500">
                    {club.shortName || "Club"}
                  </p>

                </div>

                <Building2 className="h-7 w-7 shrink-0 text-blue-700" />

              </div>

              <div className="mt-6 space-y-3 text-sm text-slate-500">

                {club.address && (

                  <div className="flex items-center gap-2">

                    <MapPin className="h-4 w-4 shrink-0" />

                    <span className="truncate">
                      {club.address}
                    </span>

                  </div>

                )}

                {club.email && (

                  <div className="flex items-center gap-2">

                    <Mail className="h-4 w-4 shrink-0" />

                    <span className="truncate">
                      {club.email}
                    </span>

                  </div>

                )}

                {club.phone && (

                  <div className="flex items-center gap-2">

                    <Phone className="h-4 w-4 shrink-0" />

                    <span className="truncate">
                      {club.phone}
                    </span>

                  </div>

                )}

                {club.website && (

                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      window.open(
                        externalUrl(club.website),
                        "_blank",
                        "noopener,noreferrer"
                      );
                    }}
                    className="flex max-w-full items-center gap-2 text-left hover:text-blue-700"
                  >

                    <Globe className="h-4 w-4 shrink-0" />

                    <span className="truncate">
                      {club.website}
                    </span>

                  </button>

                )}

              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">

                <div className="rounded-xl bg-slate-50 p-4">

                  <p className="text-sm text-slate-500">
                    Players
                  </p>

                  <p className="text-3xl font-bold">
                    {playerCount}
                  </p>

                </div>

                <div className="rounded-xl bg-slate-50 p-4">

                  <p className="text-sm text-slate-500">
                    Top Rating
                  </p>

                  <p className="text-3xl font-bold">
                    {highestRated}
                  </p>

                </div>

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
