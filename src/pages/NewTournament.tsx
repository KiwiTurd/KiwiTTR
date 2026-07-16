// First-pass updated file
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowRight,
  Info,
  Lock,
  Trophy,
} from "lucide-react";

import useRole from "../hooks/useRole";
import useFormDraftState, { clearFormDraft } from "../hooks/useFormDraftState";

import type { Club } from "../types/club";

import { getClubs } from "../services/supabase/clubService";
import { notify } from "../services/notificationService";
import { formatStartTime } from "../utils/tournamentTime";

import { useTournament } from "../context/TournamentContext";

export default function NewTournament() {
const tournamentDetailsRef = useRef<HTMLDivElement | null>(null);
const [tournamentDetailsHeight, setTournamentDetailsHeight] = useState<number>();

useEffect(() => {
  const details = tournamentDetailsRef.current;
  if (!details) return;

  const updateHeight = () => setTournamentDetailsHeight(details.offsetHeight);
  updateHeight();
  const observer = new ResizeObserver(updateHeight);
  observer.observe(details);
  return () => observer.disconnect();
}, []);

  const navigate = useNavigate();

  const creationIdRef = useRef(
    crypto.randomUUID()
  );
  const submissionInProgressRef =
    useRef(false);
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const { startTournament, saveTournament } =
  useTournament();

const {
  isAdmin,
  isClubLeader,
  clubId: userClubId,
} = useRole();

const [clubs, setClubs] =
  useState<Club[]>([]);

const [name, setName] =
  useFormDraftState("tournament.new.name", "");

const [
  eventDescription,
  setEventDescription,
] = useFormDraftState("tournament.new.description", "");

const [clubId, setClubId] =
  useFormDraftState("tournament.new.clubId", "");

const [date, setDate] =
  useFormDraftState("tournament.new.date", "");

const [startTime, setStartTime] =
  useFormDraftState("tournament.new.startTime", "");

const [
  playerLimitEnabled,
  setPlayerLimitEnabled,
] = useFormDraftState("tournament.new.playerLimitEnabled", false);

const [playerCount, setPlayerCount] =
  useFormDraftState("tournament.new.playerCount", "32");

const [format, setFormat] =
  useFormDraftState<"knockout" | "double-knockout" | "pools" | "pool-ratings" | "doubles">("tournament.new.format",
    "pools"
  );

const [poolSize, setPoolSize] =
  useFormDraftState("tournament.new.poolSize", 4);

const [
  playersProgressing,
  setPlayersProgressing,
] = useFormDraftState("tournament.new.playersProgressing", 2);

const [seedByTTR, setSeedByTTR] =
  useFormDraftState("tournament.new.seedByTTR", true);

const [socialPlay, setSocialPlay] =
  useFormDraftState("tournament.new.socialPlay", false);

const [allowSignUp, setAllowSignUp] =
  useFormDraftState("tournament.new.allowSignUp", true);

const [signUpClosesAt, setSignUpClosesAt] =
  useFormDraftState("tournament.new.signUpClosesAt", "");

const [ttrLimitEnabled, setTtrLimitEnabled] =
  useFormDraftState("tournament.new.ttrLimitEnabled", false);

const [ttrLimit, setTtrLimit] =
  useFormDraftState("tournament.new.ttrLimit", "2000");

const selectedClub = useMemo(() => {
  return clubs.find(
    (club) =>
      club.id === clubId
  );
}, [
  clubs,
  clubId,
]);

useEffect(() => {

  async function loadClubs() {

    const data =
      await getClubs();

    setClubs(data);

    if (
      isClubLeader &&
      userClubId
    ) {
      setClubId(userClubId);
    }

  }

  void loadClubs();

}, [
  isClubLeader,
  setClubId,
  userClubId,
]);

  const poolCount = useMemo(() => {

    if (!playerLimitEnabled) {
      return null;
    }

    return Math.ceil(Number(playerCount) / poolSize);

  }, [
    playerCount,
    playerLimitEnabled,
    poolSize,
  ]);

  const knockoutSize = useMemo(() => {

    if (format === "knockout" || format === "double-knockout") {

      return playerLimitEnabled
        ? Number(playerCount)
        : null;

    }

    if (format === "doubles") {

      return playerLimitEnabled
        ? Math.ceil(Number(playerCount) / 2)
        : null;

    }

    return poolCount === null
      ? null
      : (
      poolCount *
      playersProgressing
    );

  }, [
    format,
    playerCount,
    playerLimitEnabled,
    poolCount,
    playersProgressing,
  ]);

  async function continueToPlayers() {

    if (!name.trim()) {
      notify.timeout(
        "Please enter a tournament name."
      );
      return;
    }

    if (
      isClubLeader &&
      !userClubId
    ) {
      notify.timeout(
        "Your account must be assigned to a club before creating tournaments."
      );
      return;
    }

    const assignedClubId =
      isClubLeader
        ? userClubId
        : clubId;

    if (!assignedClubId) {

  notify.timeout(
    "Please select a club."
  );

  return;

}

    if (!date) {
      notify.timeout(
        "Please choose a tournament date."
      );
      return;
    }

    if (!startTime) {
      notify.timeout(
        "Please choose a tournament start time."
      );
      return;
    }

    const parsedPlayerCount =
      playerLimitEnabled
        ? Number(playerCount)
        : 256;

    if (
      playerLimitEnabled &&
      (
        !Number.isInteger(parsedPlayerCount) ||
        parsedPlayerCount < 2 ||
        parsedPlayerCount > 256
      )
    ) {
      notify.timeout(
        "Please enter a whole number of players between 2 and 256."
      );
      return;
    }

    if (
      playerLimitEnabled &&
      format === "doubles" &&
      parsedPlayerCount % 2 !== 0
    ) {
      notify.timeout(
        "Doubles tournaments need an even number of players."
      );
      return;
    }

    const parsedTtrLimit =
      Number(ttrLimit);

    if (
      ttrLimitEnabled &&
      (
        !Number.isInteger(parsedTtrLimit) ||
        parsedTtrLimit < 0
      )
    ) {
      notify.timeout(
        "Please enter a valid whole-number TTR limit."
      );
      return;
    }

    const settings = {
      name,

      eventDescription:
        eventDescription.trim(),

      clubId: assignedClubId,

      date,

      startTime,

      signUpClosesAt:
        allowSignUp && signUpClosesAt
          ? signUpClosesAt
          : null,

      playerCount:
        parsedPlayerCount,

      playerLimitEnabled,

      format,

      poolSize,

      progressing:
        playersProgressing,

      seedByTTR:
        (socialPlay && format !== "pool-ratings") ||
        format === "doubles"
          ? false
          : seedByTTR,

      socialPlay:
        format === "doubles"
          ? true
          : format === "pool-ratings"
            ? false
          : socialPlay,

      allowSignUp,

      ttrLimitEnabled,

      ttrLimit: ttrLimitEnabled
        ? parsedTtrLimit
        : 2000,
    };

    // State updates do not disable a button until the next render. The ref
    // closes that small window where a quick mobile double-tap can enter this
    // handler twice.
    if (submissionInProgressRef.current) {
      return;
    }

    submissionInProgressRef.current = true;
    setIsSubmitting(true);

    if (allowSignUp) {
      try {
        await saveTournament({
          id: creationIdRef.current,
          settings,
          players: [],
          pools: [],
          matches: [],
          knockout: [],
        });

        notify.edgeBall(
          "Tournament is open for sign ups."
        );
        clearFormDraft("tournament.new");
        navigate("/tournaments");
      } catch (error) {
        console.error(error);
        notify.fault(
          "Unable to open tournament sign ups."
        );
        submissionInProgressRef.current = false;
        setIsSubmitting(false);
      }

      return;
    }

    startTournament(settings);

    clearFormDraft("tournament.new");
    navigate(
      "/tournaments/players"
    );

  }

  return (

    <div className="mx-auto max-w-7xl space-y-8">

      <div className="border-b border-slate-300 pb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
          <Trophy className="h-4 w-4" />
          Tournament Wizard
        </div>
        <h1 className="mt-4 text-5xl font-normal">New Tournament</h1>
        <p className="mt-3 text-lg text-slate-500">
          Configure your tournament before selecting players.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">

        {/* Left */}

        <div className="space-y-8">

          {/* Tournament Details */}

          <div ref={tournamentDetailsRef} className="rounded-3xl border bg-white p-8 shadow-sm">

            <SettingSectionHeading
              title="Tournament Details"
              information="Set the tournament name, public description, hosting club and date. Sign ups stay open through the close date, or until you take the tournament live."
            />

            <div className="space-y-5">

              <input
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Tournament Name"
                className="w-full rounded-xl border p-3"
              />

              <textarea
                value={eventDescription}
                onChange={(event) =>
                  setEventDescription(
                    event.target.value
                  )
                }
                placeholder="Event Description (optional)"
                rows={3}
                className="w-full resize-none rounded-xl border p-3"
              />

              <div>

  {isAdmin ? (

    <select
      value={clubId}
      onChange={(e) =>
        setClubId(e.target.value)
      }
      className="w-full rounded-xl border p-3"
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

    <div className="flex items-center justify-between rounded-xl border bg-slate-50 p-3">

      <span>

        {selectedClub?.name ??
          "No club assigned"}

      </span>

      <Lock className="h-4 w-4 text-slate-400" />

    </div>

  )}

</div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="font-medium">
                    Tournament Date
                  </span>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) =>
                      setDate(e.target.value)
                    }
                    className="mt-2 w-full rounded-xl border p-3"
                  />
                </label>

                <label className="block">
                  <span className="font-medium">
                    Start Time
                  </span>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(event) =>
                      setStartTime(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border p-3"
                  />
                </label>

              </div>

              <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-end">
                <label className="flex min-h-12 items-center gap-3 rounded-xl border bg-slate-50 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allowSignUp}
                    onChange={() =>
                      setAllowSignUp(
                        !allowSignUp
                      )
                    }
                  />
                  <span className="whitespace-nowrap font-medium">
                    Allow Sign Up
                  </span>
                </label>

                {allowSignUp && (
                  <label className="block">
                    <span className="font-medium">
                      Sign Up Close Date
                    </span>

                    <input
                      type="date"
                      value={signUpClosesAt}
                      onChange={(event) =>
                        setSignUpClosesAt(
                          event.target.value
                        )
                      }
                      className="mt-2 w-full rounded-xl border p-3"
                    />
                  </label>
                )}
              </div>

            </div>

          </div>

          {/* Tournament Size */}

          <div className="rounded-3xl border bg-white p-8 shadow-sm">

            <SettingSectionHeading
              title="Tournament Size"
              information="The player limit is a maximum, not a required total. You can build the tournament with any valid number of selected players up to this limit."
            />

            <label className="flex items-center gap-3">

              <input
                type="checkbox"
                checked={playerLimitEnabled}
                onChange={() =>
                  setPlayerLimitEnabled(
                    !playerLimitEnabled
                  )
                }
              />

              <span className="font-medium">

                Set player limit

              </span>

            </label>

            {playerLimitEnabled ? (

            <div className="mt-5">

              <label className="font-medium">

              Maximum Players

            </label>

            <input
              type="number"
              min={2}
              max={256}
              value={playerCount}
              onChange={(e) =>
                setPlayerCount(e.target.value)
              }
              className="mt-2 w-full rounded-xl border p-3"
            />

            <p className="mt-2 text-sm text-slate-500">
              You can proceed with fewer players. This only caps how many can enter or be selected.
            </p>

            </div>

            ) : (

              <div className="mt-5 rounded-xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">

                Pool and knockout sizes will be calculated from the players selected later.

              </div>

            )}

          </div>

          {/* Tournament Format */}

          <div className="rounded-3xl border bg-white p-8 shadow-sm">

            <SettingSectionHeading
              title="Tournament Format"
              information="Choose how matches are organised. Knockout formats eliminate players, pools provide round-robin play, and Pool Only Ratings records pool results without a knockout stage."
            />

            <div className="space-y-4">

              <label className="flex items-center gap-3">

                <input
                  type="radio"
                  checked={
                    format === "knockout"
                  }
                  onChange={() =>
                    setFormat(
                      "knockout"
                    )
                  }
                />

                Straight Knockout

              </label>

              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  checked={format === "double-knockout"}
                  onChange={() => setFormat("double-knockout")}
                />
                Double Knockout
              </label>

              <label className="flex items-center gap-3">

                <input
                  type="radio"
                  checked={
                    format === "doubles"
                  }
                  onChange={() => {
                    setFormat(
                      "doubles"
                    );
                    setSeedByTTR(false);
                    setSocialPlay(true);
                  }}
                />

                Doubles Knockout

              </label>

              <label className="flex items-center gap-3">

                <input
                  type="radio"
                  checked={
                    format === "pools"
                  }
                  onChange={() =>
                    setFormat(
                      "pools"
                    )
                  }
                />

                Pools → Knockout

              </label>

              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  checked={format === "pool-ratings"}
                  onChange={() => {
                    setFormat("pool-ratings");
                    setSocialPlay(false);
                  }}
                />
                Pool Only Ratings
              </label>

            </div>

          </div>

          {/* Pool Settings */}

          {(format === "pools" || format === "pool-ratings") && (

            <div className="rounded-3xl border bg-white p-8 shadow-sm">

              <SettingSectionHeading
                title="Pool Settings"
                information="Choose the preferred number of players per pool and, for Pools → Knockout, how many advance. Pools are calculated from the players actually selected."
              />

              <div className="grid gap-5 md:grid-cols-2">

                <div>

                  <label className="font-medium">

                    Players Per Pool

                  </label>

                  <select
                    value={poolSize}
                    onChange={(e) =>
                      setPoolSize(
                        Number(
                          e.target.value
                        )
                      )
                    }
                    className="mt-2 w-full rounded-xl border p-3"
                  >

                    {[3, 4, 5, 6].map(
                      (size) => (
                        <option
                          key={size}
                          value={size}
                        >
                          {size}
                        </option>
                      )
                    )}

                  </select>

                </div>

                {format === "pools" && <div>

                  <label className="font-medium">

                    Players Progressing

                  </label>

                  <select
                    value={
                      playersProgressing
                    }
                    onChange={(e) =>
                      setPlayersProgressing(
                        Number(
                          e.target.value
                        )
                      )
                    }
                    className="mt-2 w-full rounded-xl border p-3"
                  >

                    {Array.from(
                      {
                        length:
                          poolSize - 1,
                      },
                      (_, i) => i + 1
                    ).map((value) => (

                      <option
                        key={value}
                        value={value}
                      >

                        {value}

                      </option>

                    ))}

                  </select>

                </div>}

              </div>

            </div>

          )}

          {/* Seeding */}

          <div className="rounded-3xl border bg-white p-8 shadow-sm">

            <SettingSectionHeading
              title="Event and Rating Settings"
              information="Control whether results affect KiwiTTR, how competitive draws are seeded, and whether entry is restricted to players at or below a maximum TTR."
            />

            <div className="space-y-5">

            <label className="flex items-center gap-3">

              <input
                type="checkbox"
                checked={
                  format === "pool-ratings"
                    ? false
                    : socialPlay
                }
                disabled={
                  format === "doubles" ||
                  format === "pool-ratings"
                }
                onChange={() =>
                  setSocialPlay(
                    !socialPlay
                  )
                }
              />

              Social play event

            </label>

            <label className="flex items-center gap-3">

              <input
                type="checkbox"
                checked={
                  (format === "pool-ratings" || !socialPlay) &&
                  format !== "doubles" &&
                  seedByTTR
                }
                disabled={
                  (socialPlay && format !== "pool-ratings") ||
                  format === "doubles"
                }
                onChange={() =>
                  setSeedByTTR(
                    !seedByTTR
                  )
                }
              />

              Seed players according to KiwiTTR

            </label>

            <label className="flex items-center gap-3">

              <input
                type="checkbox"
                checked={ttrLimitEnabled}
                onChange={() =>
                  setTtrLimitEnabled(
                    !ttrLimitEnabled
                  )
                }
              />

              Set TTR limit

            </label>

            {ttrLimitEnabled && (

              <div>

                <label className="font-medium">

                  Maximum TTR

                </label>

                <input
                  type="number"
                  min={0}
                  value={ttrLimit}
                  onChange={(event) =>
                    setTtrLimit(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border p-3"
                />

              </div>

            )}

            <p className="text-sm text-slate-500">

              {ttrLimitEnabled
                ? "Only players at or below the TTR limit can enter this tournament."
                : socialPlay
                ? format === "doubles"
                  ? "Doubles is a knockout-only format and is never TTR dependent."
                  : "Social play keeps the draw casual and random."
                : "KiwiTTR events can seed pools and knockouts by rating."}

            </p>

            </div>

          </div>

          <button
            onClick={continueToPlayers}
            disabled={isSubmitting}
            className="
              flex
              w-full
              items-center
              justify-center
              gap-3

              rounded-2xl

              bg-blue-900

              py-4

              font-semibold

              text-white

              transition

              hover:bg-blue-800

              disabled:cursor-not-allowed
              disabled:bg-slate-400
            "
          >

            {isSubmitting
              ? "Saving Tournament..."
              : allowSignUp
              ? "Open Sign Ups"
              : "Continue to Player Selection"}

            <ArrowRight className="h-5 w-5" />

          </button>
                  </div>

        {/* Right */}

        <div>

          <div
            className="sticky top-24 overflow-y-auto rounded-3xl border bg-white p-5 shadow-sm"
            style={{ maxHeight: tournamentDetailsHeight }}
          >

            <h2 className="text-lg font-bold">

              Tournament Preview

            </h2>

            <p className="mt-1 text-sm text-slate-500">

              Review your tournament before selecting players.

            </p>

            <div className="mt-5 space-y-3 text-sm">

              <div className="flex items-center justify-between">

                <span className="text-slate-500">

                  Tournament

                </span>

                <strong className="text-right">

                  {name.trim() || "Untitled Tournament"}

                </strong>

              </div>

              <div className="flex items-start justify-between gap-4">

  <span className="text-slate-500">

    Club

  </span>

  <strong className="flex-1 text-right">

    {selectedClub?.name ?? "-"}

  </strong>

</div>

              <div className="flex items-center justify-between">

                <span className="text-slate-500">

                  Date

                </span>

                <strong>

                  {date || "-"}

                </strong>

              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  Start Time
                </span>
                <strong>
                  {formatStartTime(startTime)}
                </strong>
              </div>

              <hr className="border-slate-200" />

              <div className="flex items-center justify-between">

                <span className="text-slate-500">

                  Sign Ups

                </span>

                <strong>

                  {allowSignUp ? "Open" : "Off"}

                </strong>

              </div>

              {allowSignUp && (

                <div className="flex items-center justify-between">

                  <span className="text-slate-500">

                    Close Date

                  </span>

                  <strong>

                    {signUpClosesAt || "None"}

                  </strong>

                </div>

              )}

              <hr className="border-slate-200" />

              <div className="flex items-center justify-between">

                <span className="text-slate-500">

                  Player Limit

                </span>

                <strong>

                  {playerLimitEnabled
                    ? `Up to ${Number(playerCount) || "-"}`
                    : "Dynamic"}

                </strong>

              </div>

              <div className="flex items-center justify-between">

                <span className="text-slate-500">

                  Format

                </span>

                <strong>

                  {format === "pools"
                    ? "Pools → Knockout"
                    : format === "pool-ratings"
                      ? "Pool Only Ratings"
                    : format === "doubles"
                      ? "Doubles Knockout"
                      : format === "double-knockout"
                        ? "Double Knockout"
                      : "Straight Knockout"}

                </strong>

              </div>

              {(format === "pools" || format === "pool-ratings") && (

                <>

                  <div className="flex items-center justify-between">

                    <span className="text-slate-500">

                      Maximum Pools

                    </span>

                    <strong>

                      {poolCount === null
                        ? "Dynamic"
                        : `Up to ${poolCount}`}

                    </strong>

                  </div>

                  <div className="flex items-center justify-between">

                    <span className="text-slate-500">

                      Pool Size

                    </span>

                    <strong>

                      {poolSize}

                    </strong>

                  </div>

                  {format === "pools" && <div className="flex items-center justify-between">

                    <span className="text-slate-500">

                      Progressing

                    </span>

                    <strong>

                      Top {playersProgressing}

                    </strong>

                  </div>}

                  {format === "pools" && <div className="flex items-center justify-between">

                    <span className="text-slate-500">

                      Knockout Draw

                    </span>

                    <strong>

                      {knockoutSize === null
                        ? "Dynamic"
                        : `Up to ${knockoutSize} Players`}

                    </strong>

                  </div>}

                </>

              )}

              {format === "doubles" && (

                <div className="flex items-center justify-between">

                  <span className="text-slate-500">

                    Pairs

                  </span>

                  <strong>

                    {playerLimitEnabled &&
                    Number(playerCount)
                      ? `Up to ${Math.ceil(Number(playerCount) / 2)}`
                      : "Dynamic"}

                  </strong>

                </div>

              )}

              <div className="flex items-center justify-between">

                <span className="text-slate-500">

                  TTR Limit

                </span>

                <strong>

                  {ttrLimitEnabled
                    ? `Max ${Number(ttrLimit) || 0}`
                    : "Off"}

                </strong>

              </div>

              <div className="flex items-center justify-between">

                <span className="text-slate-500">

                  Seeding

                </span>

                <strong>

                  {seedByTTR
                    ? "KiwiTTR Rating"
                    : "Random Draw"}

                </strong>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}

function SettingSectionHeading({
  title,
  information,
}: {
  title: string;
  information: string;
}) {
  return (
    <div className="mb-6 flex items-center gap-2">
      <h2 className="text-xl font-bold">
        {title}
      </h2>
      <span
        className="group relative inline-flex"
        tabIndex={0}
        aria-label={`${title}: ${information}`}
      >
        <Info className="h-5 w-5 cursor-help text-blue-700" />
        <span
          role="tooltip"
          className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-72 -translate-x-1/2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-normal leading-relaxed text-white opacity-0 shadow-xl transition group-hover:opacity-100 group-focus:opacity-100"
        >
          {information}
        </span>
      </span>
    </div>
  );
}
