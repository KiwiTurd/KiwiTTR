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
} from "lucide-react";

import type { Club } from "../types/club";
import type { Player } from "../types/player";

import {
  addClub,
  getClubs,
} from "../services/supabase/clubService";

import { getPlayers } from "../services/supabase/playerService";

import useRole from "../hooks/useRole";
import useFormDraftState from "../hooks/useFormDraftState";
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

  const [name, setName] = useFormDraftState("clubs.new.name", "");
  const [shortName, setShortName] = useFormDraftState("clubs.new.shortName", "");
  const [address, setAddress] = useFormDraftState("clubs.new.address", "");
  const [phone, setPhone] = useFormDraftState("clubs.new.phone", "");
  const [email, setEmail] = useFormDraftState("clubs.new.email", "");
  const [website, setWebsite] = useFormDraftState("clubs.new.website", "");

  const [search, setSearch] = useState("");

  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

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
      setCreateOpen(false);

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

  return (
    <div className="mx-auto w-full max-w-7xl space-y-10 overflow-x-hidden">

      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-300 pb-6 md:items-end">

        <div className="clubs-page-header-copy">

        <h1 className="mt-2 text-5xl font-normal tracking-tight text-slate-900">
          Clubs
        </h1>

        <p className="mt-3 text-lg text-slate-500">
          Browse clubs, contacts and active player communities.
        </p>

        </div>

        {isAdmin && (
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-slate-700"
            onClick={() => setCreateOpen((current) => !current)}
            type="button"
          >
            <Plus className={`h-5 w-5 transition-transform duration-300 ${createOpen ? "rotate-45" : ""}`} />
            {createOpen ? "Close" : "Create Club"}
          </button>
        )}

      </div>

      {isAdmin && (

        <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${createOpen ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0"}`}>

        <div className="overflow-hidden">

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

        <div className="grid min-w-0 gap-6 md:grid-cols-2 xl:grid-cols-3">

          {filteredClubCards.map(({ club, playerCount, highestRated }) => (

            <Link
              key={club.id}
              to={`/clubs/${club.id}`}
              className="group block min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md sm:p-6"
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

                  <h2 className="truncate text-xl font-bold sm:text-2xl">
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

                  <div className="flex min-w-0 items-center gap-2">

                    <MapPin className="h-4 w-4 shrink-0" />

                    <span className="min-w-0 flex-1 truncate">
                      {club.address}
                    </span>

                  </div>

                )}

                {club.email && (

                  <div className="flex min-w-0 items-center gap-2">

                    <Mail className="h-4 w-4 shrink-0" />

                    <span className="min-w-0 flex-1 truncate">
                      {club.email}
                    </span>

                  </div>

                )}

                {club.phone && (

                  <div className="flex min-w-0 items-center gap-2">

                    <Phone className="h-4 w-4 shrink-0" />

                    <span className="min-w-0 flex-1 truncate">
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
                    className="flex w-full min-w-0 max-w-full items-center gap-2 text-left hover:text-blue-700"
                  >

                    <Globe className="h-4 w-4 shrink-0" />

                    <span className="min-w-0 flex-1 truncate">
                      {club.website}
                    </span>

                  </button>

                )}

              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">

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
