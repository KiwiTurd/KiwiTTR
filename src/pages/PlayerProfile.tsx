import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Mail,
  Pencil,
  Phone,
  ShieldCheck,
  Star,
  Target,
  Trophy,
  TrendingUp,
  Users,
} from "lucide-react";

import type { Player } from "../types/player";
import type { Club } from "../types/club";
import type { Match } from "../types/match";
import type { Event } from "../types/event";

import {
  getPlayer,
  getPlayers,
  updatePlayer,
} from "../services/supabase/playerService";

import {
  getClubs,
} from "../services/supabase/clubService";

import {
  getPlayerMatches,
} from "../services/supabase/matchService";

import {
  getEvents,
} from "../services/supabase/eventService";

import RatingGraph from "../components/player/RatingGraph";
import RecentMatchCard from "../components/player/RecentMatchCard";

import { notify } from "../services/notificationService";
import useRole from "../hooks/useRole";

export default function PlayerProfile() {

  const { id } = useParams();

  const {
    profileId,
    playerId: linkedPlayerId,
    clubId: userClubId,
    isAdmin,
  } = useRole();

  const [player, setPlayer] =
    useState<Player | null>(null);

  const [players, setPlayers] =
    useState<Player[]>([]);

  const [club, setClub] =
    useState<Club | null>(null);

  const [matches, setMatches] =
    useState<Match[]>([]);

  const [events, setEvents] =
    useState<Event[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [editing, setEditing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [editFirstName, setEditFirstName] =
    useState("");

  const [editLastName, setEditLastName] =
    useState("");

  const [editMobile, setEditMobile] =
    useState("");

  const [editEmail, setEditEmail] =
    useState("");

  const loadData = useCallback(async () => {

    if (!id) return;

    try {

      setLoading(true);

      const [

        playerData,
        playerList,
        clubList,
        matchList,
        eventList,

      ] = await Promise.all([

        getPlayer(id),
        getPlayers(),
        getClubs(),
        getPlayerMatches(id),
        getEvents(),

      ]);

      if (!playerData) {

        setPlayer(null);

        return;

      }

      setPlayer(playerData);

      setPlayers(playerList);

      setClub(

        clubList.find(

          c => c.id === playerData.clubId

        ) ?? null

      );

      setMatches(matchList);

      setEvents(eventList);

    }

    catch (error) {

      console.error(error);

      notify.fault("Unable to load player.");

    }

    finally {

      setLoading(false);

    }

  }, [id]);

  useEffect(() => {

    const timer =
      window.setTimeout(() => {
        void loadData();
      }, 0);

    return () => {
      window.clearTimeout(timer);
    };

  }, [loadData]);

  const winPercentage = useMemo(() => {

    if (!player) return 0;

    if (player.matchesPlayed === 0) {

      return 0;

    }

    return (

      (player.wins / player.matchesPlayed) * 100

    ).toFixed(1);

  }, [player]);

  const isOwnPlayer =
    Boolean(player && profileId) &&
    (
      player?.profileId === profileId ||
      player?.id === linkedPlayerId
    );

  const canViewContact =
    Boolean(player) &&
    (
      isAdmin ||
      isOwnPlayer ||
      (
        Boolean(userClubId) &&
        userClubId === player?.clubId
      )
    );

  const clubTopPlayers = useMemo(() => {
    if (!player) {
      return [];
    }

    return players
      .filter(
        (item) =>
          item.clubId === player.clubId &&
          item.isActive
      )
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);
  }, [players, player]);

  const clubRank = useMemo(() => {
    if (!player) {
      return "-";
    }

    const clubPlayers = players
      .filter(
        (item) =>
          item.clubId === player.clubId &&
          item.isActive
      )
      .sort((a, b) => b.rating - a.rating);

    const rank =
      clubPlayers.findIndex(
        (item) => item.id === player.id
      ) + 1;

    return rank > 0
      ? `#${rank}`
      : "-";
  }, [players, player]);

  function openEdit() {
    if (!player || !isOwnPlayer) {
      return;
    }

    setEditFirstName(player.firstName);
    setEditLastName(player.lastName);
    setEditMobile(player.mobile);
    setEditEmail(player.email);
    setEditing(true);
  }

  function closeEdit() {
    setEditing(false);
    setEditFirstName("");
    setEditLastName("");
    setEditMobile("");
    setEditEmail("");
  }

  async function handleSave() {
    if (!player || !isOwnPlayer) {
      notify.fault(
        "You can only edit your own linked player profile."
      );
      return;
    }

    if (
      !editFirstName.trim() ||
      !editLastName.trim()
    ) {
      notify.timeout(
        "First name and last name are required."
      );
      return;
    }

    setSaving(true);

    try {
      const updatedPlayer: Player = {
        ...player,
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        mobile: editMobile.trim(),
        email: editEmail.trim(),
      };

      await updatePlayer(updatedPlayer);
      setPlayer(updatedPlayer);
      setPlayers((current) =>
        current.map((item) =>
          item.id === updatedPlayer.id
            ? updatedPlayer
            : item
        )
      );

      notify.playerUpdated(
        `${updatedPlayer.firstName} ${updatedPlayer.lastName}`
      );

      closeEdit();
    } catch (error) {
      console.error(error);
      notify.fault("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {

    return (

      <div className="max-w-7xl mx-auto">

        <h1 className="text-4xl font-bold">

          Loading...

        </h1>

      </div>

    );

  }

  if (!player) {

    return (

      <div className="max-w-7xl mx-auto space-y-8">

        <h1 className="text-5xl font-black">

          Player Not Found

        </h1>

        <Link
          to="/rankings"
          className="
            inline-flex
            items-center
            gap-2

            text-slate-500

            hover:text-blue-700
          "
        >

          <ArrowLeft className="w-4 h-4" />

          Back to Rankings

        </Link>

      </div>

    );

  }
return (

  <div className="mx-auto max-w-7xl space-y-8">

    <div className="flex items-center justify-between gap-4">

      <Link
        to="/rankings"
        className="
          inline-flex
          items-center
          gap-2

          text-sm
          font-medium

          text-slate-500

          hover:text-blue-700

          transition
        "
      >

        <ArrowLeft className="h-4 w-4" />

        Back to Rankings

      </Link>

      {isOwnPlayer && (
        <button
          type="button"
          onClick={openEdit}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-900"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </button>
      )}

    </div>

    {/* Hero */}

    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      <div className="h-2 bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-500" />

      <div className="p-6">

        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

          <div className="flex items-center gap-4">

            <div
              className="
                flex
                h-16
                w-16
                items-center
                justify-center

                rounded-full

                bg-blue-900

                text-xl
                font-black
                text-white
              "
            >

              {player.firstName.charAt(0)}
              {player.lastName.charAt(0)}

            </div>

            <div>

              <h1 className="text-3xl font-black tracking-tight">

                {player.firstName} {player.lastName}

              </h1>

              <div className="mt-2 flex items-center gap-2 text-slate-500">

                <Building2 className="h-4 w-4" />

                {club?.name ?? "No Club"}

              </div>

              <div className="mt-3 flex flex-wrap gap-2">

                <div
                  className={`
                    inline-flex
                    items-center
                    gap-2

                    rounded-full

                    px-3
                    py-1.5

                    text-sm
                    font-semibold

                    ${
                      player.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }
                  `}
                >

                  <BadgeCheck className="h-4 w-4" />

                  {player.isActive
                    ? "Active"
                    : "Inactive"}

                </div>

                <div
                  className="
                    inline-flex
                    items-center
                    gap-2

                    rounded-full

                    bg-blue-100

                    px-3
                    py-1.5

                    text-sm
                    font-semibold

                    text-blue-800
                  "
                >

                  <ShieldCheck className="h-4 w-4" />

                  Reliability {player.ratingReliability}

                </div>

              </div>

            </div>

          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-5 py-4 text-right xl:min-w-52">

            <Star className="h-7 w-7 fill-amber-400 text-amber-400" />

            <div>

            <p className="text-sm text-slate-500">

              Current Rating

            </p>

            <h2 className="text-4xl font-black tracking-tight">

              {player.rating}

            </h2>

            </div>

          </div>

        </div>

      </div>

    </div>

    {/* Contact */}

    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

        <div className="flex items-center gap-3">

          <Phone className="h-5 w-5 text-blue-700" />

          <h2 className="text-lg font-bold">
            Contact
          </h2>

        </div>

        {canViewContact ? (

          <div className="flex flex-col gap-3 text-sm md:flex-row md:items-center md:gap-6">

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-2 text-slate-500">
                <Phone className="h-4 w-4" />
                Mobile
              </span>
              <span className="font-semibold">
                {player.mobile || "-"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-2 text-slate-500">
                <Mail className="h-4 w-4" />
                Email
              </span>
              <span className="font-semibold">
                {player.email || "-"}
              </span>
            </div>

          </div>

        ) : (

          <div className="text-sm text-slate-500">
            Contact details are only visible to admins and members of this player's club.
          </div>

        )}

      </div>

    </div>

    {/* Stat Cards */}

    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">

      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">

        <TrendingUp className="h-5 w-5 shrink-0 text-blue-700" />

        <div className="min-w-0">

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">

            Current Rating

          </p>

          <h3 className="text-2xl font-black">

            {player.rating}

          </h3>

        </div>

      </div>

      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">

        <Trophy className="h-5 w-5 shrink-0 text-amber-500" />

        <div className="min-w-0">

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">

            Highest Rating

          </p>

          <h3 className="text-2xl font-black">

            {player.highestRating}

          </h3>

        </div>

      </div>

      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">

        <Target className="h-5 w-5 shrink-0 text-emerald-600" />

        <div className="min-w-0">

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">

            Win Percentage

          </p>

          <h3 className="text-2xl font-black">

            {winPercentage}%

          </h3>

        </div>

      </div>

      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">

        <Users className="h-5 w-5 shrink-0 text-indigo-600" />

        <div className="min-w-0">

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">

            Club Rank

          </p>

          <h3 className="text-2xl font-black">

            {clubRank}

          </h3>

        </div>

      </div>

    </div>

    {/* Rating Graph */}

    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      <div className="border-b px-8 py-5">

        <div className="flex items-center gap-3">

          <TrendingUp className="h-6 w-6 text-blue-700" />

          <h2 className="text-2xl font-bold">

            Rating History

          </h2>

        </div>

      </div>

      <div className="p-8">

        <RatingGraph
          playerId={player.id}
        />

      </div>

    </div>

    {/* Club Ranking and Recent Matches */}

    <div className="grid gap-6 xl:grid-cols-2">

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b px-6 py-4">

          <div className="flex items-center gap-3">

            <Trophy className="h-6 w-6 text-amber-500" />

            <h2 className="text-xl font-bold">
              {club?.name ?? "Club"} Top 5
            </h2>

          </div>

        </div>

        <div className="p-5">

          {clubTopPlayers.length === 0 ? (

            <p className="text-slate-500">
              No active club players yet.
            </p>

          ) : (

            <div className="divide-y divide-slate-100">

              {clubTopPlayers.map((clubPlayer, index) => (

                <Link
                  key={clubPlayer.id}
                  to={`/players/${clubPlayer.id}`}
                  className={`
                    flex
                    items-center
                    justify-between
                    gap-4
                    py-3
                    transition
                    hover:bg-slate-50
                    ${
                      clubPlayer.id === player.id
                        ? "text-blue-800"
                        : "text-slate-900"
                    }
                  `}
                >

                  <div className="flex min-w-0 items-center gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">
                      {index + 1}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {clubPlayer.firstName} {clubPlayer.lastName}
                      </p>
                      <p className="text-sm text-slate-500">
                        {clubPlayer.matchesPlayed} matches
                      </p>
                    </div>

                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-black">
                      {clubPlayer.rating}
                    </p>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      TTR
                    </p>
                  </div>

                </Link>

              ))}

            </div>

          )}

        </div>

      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b px-6 py-4">

          <div className="flex items-center gap-3">

            <Trophy className="h-6 w-6 text-amber-500" />

            <h2 className="text-xl font-bold">

              Recent Matches

            </h2>

          </div>

        </div>

        <div className="p-5">

          {matches.length === 0 ? (

            <div className="py-10 text-center">

              <Trophy className="mx-auto h-10 w-10 text-slate-300" />

              <p className="mt-4 text-slate-500">

                No matches have been played yet.

              </p>

            </div>

          ) : (

            <div className="space-y-4">

              {matches.map((match) => {

                const opponentId =
                  match.player1Id === player.id
                    ? match.player2Id
                    : match.player1Id;

                const opponent =
                  players.find(
                    (p) => p.id === opponentId
                  );

                const event =
                  events.find(
                    (e) => e.id === match.eventId
                  );

                return (

                  <RecentMatchCard
                    key={match.id}
                    match={match}
                    player={player}
                    opponent={opponent}
                    event={event}
                  />

                );

              })}

            </div>

          )}

        </div>

      </div>

    </div>

      {/* Career Statistics */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b px-8 py-5">

          <div className="flex items-center gap-3">

            <Users className="h-6 w-6 text-blue-700" />

            <h2 className="text-2xl font-bold">

              Career Statistics

            </h2>

          </div>

        </div>

        <div className="grid gap-6 p-8 md:grid-cols-2">

          <div className="space-y-5">

            <div className="flex items-center justify-between">

              <span className="text-slate-500">

                Wins

              </span>

              <span className="text-xl font-bold">

                {player.wins}

              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-slate-500">

                Losses

              </span>

              <span className="text-xl font-bold">

                {player.losses}

              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-slate-500">

                Win Percentage

              </span>

              <span className="text-xl font-bold">

                {winPercentage}%

              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-slate-500">

                Matches Played

              </span>

              <span className="text-xl font-bold">

                {player.matchesPlayed}

              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-slate-500">

                Current Rating

              </span>

              <span className="text-xl font-bold">

                {player.rating}

              </span>

            </div>

          </div>

          <div className="space-y-5">

            <div className="flex items-center justify-between">

              <span className="text-slate-500">

                Highest Rating

              </span>

              <span className="text-xl font-bold">

                {player.highestRating}

              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-slate-500">

                Rating Reliability

              </span>

              <span className="text-xl font-bold">

                {player.ratingReliability}

              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-slate-500">

                Provisional Matches

              </span>

              <span className="text-xl font-bold">

                {player.provisionalMatchesRemaining === 0
                  ? "Established"
                  : player.provisionalMatchesRemaining}

              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-slate-500">

                Status

              </span>

              <span
                className={`font-semibold ${
                  player.isActive
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >

                {player.isActive
                  ? "Active"
                  : "Inactive"}

              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-slate-500">

                Member Since

              </span>

              <span className="font-semibold">

                {new Date(
                  player.createdAt
                ).toLocaleDateString()}

              </span>

            </div>

          </div>

        </div>

      </div>

      {editing && (

        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4">

          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">

            <div className="border-b px-6 py-5">

              <h2 className="text-2xl font-bold">
                Edit Profile
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                TTR is managed by match results and cannot be edited here.
              </p>

            </div>

            <div className="space-y-4 p-6">

              <input
                value={editFirstName}
                onChange={(e) =>
                  setEditFirstName(e.target.value)
                }
                placeholder="First Name"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
              />

              <input
                value={editLastName}
                onChange={(e) =>
                  setEditLastName(e.target.value)
                }
                placeholder="Last Name"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
              />

              <input
                value={editMobile}
                onChange={(e) =>
                  setEditMobile(e.target.value)
                }
                placeholder="Mobile"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
              />

              <input
                type="email"
                value={editEmail}
                onChange={(e) =>
                  setEditEmail(e.target.value)
                }
                placeholder="Email"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
              />

              <div className="grid grid-cols-2 gap-4">

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">
                    Current TTR
                  </p>
                  <p className="text-2xl font-bold">
                    {player.rating}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">
                    Highest TTR
                  </p>
                  <p className="text-2xl font-bold">
                    {player.highestRating}
                  </p>
                </div>

              </div>

              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={closeEdit}
                  className="rounded-xl bg-slate-100 px-4 py-2 font-medium text-slate-900 transition hover:bg-slate-200"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-xl bg-blue-900 px-4 py-2 font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}
