// First-pass updated file
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowRight,
  Lock,
  Trophy,
} from "lucide-react";

import useRole from "../hooks/useRole";

import type { Club } from "../types/club";

import { getClubs } from "../services/supabase/clubService";
import { notify } from "../services/notificationService";

import { useTournament } from "../context/TournamentContext";

export default function NewTournament() {

  const navigate = useNavigate();

  const { startTournament } =
  useTournament();

const {
  isAdmin,
  isClubLeader,
  clubId: userClubId,
} = useRole();

const [clubs, setClubs] =
  useState<Club[]>([]);

const [name, setName] =
  useState("");

const [clubId, setClubId] =
  useState("");

const [date, setDate] =
  useState("");

const [playerCount, setPlayerCount] =
  useState("32");

const [format, setFormat] =
  useState<"knockout" | "pools" | "doubles">(
    "pools"
  );

const [poolSize, setPoolSize] =
  useState(4);

const [
  playersProgressing,
  setPlayersProgressing,
] = useState(2);

const [seedByTTR, setSeedByTTR] =
  useState(true);

const [socialPlay, setSocialPlay] =
  useState(false);

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
  userClubId,
]);

  const poolCount = useMemo(() => {

    return Math.ceil(
      Number(playerCount) / poolSize
    );

  }, [
    playerCount,
    poolSize,
  ]);

  const knockoutSize = useMemo(() => {

    if (format === "knockout") {

      return Number(playerCount);

    }

    if (format === "doubles") {

      return Math.ceil(
        Number(playerCount) / 2
      );

    }

    return (
      poolCount *
      playersProgressing
    );

  }, [
    format,
    playerCount,
    poolCount,
    playersProgressing,
  ]);

  function continueToPlayers() {

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

    const parsedPlayerCount =
      Number(playerCount);

    if (
      !Number.isInteger(parsedPlayerCount) ||
      parsedPlayerCount < 2 ||
      parsedPlayerCount > 256
    ) {
      notify.timeout(
        "Please enter a whole number of players between 2 and 256."
      );
      return;
    }

    if (
      format === "doubles" &&
      parsedPlayerCount % 2 !== 0
    ) {
      notify.timeout(
        "Doubles tournaments need an even number of players."
      );
      return;
    }

    startTournament({

      name,

      clubId: assignedClubId,

      date,

      playerCount:
        format === "doubles"
          ? parsedPlayerCount
          : parsedPlayerCount,

      format,

      poolSize,

      progressing:
        playersProgressing,

      seedByTTR:
        socialPlay ||
        format === "doubles"
          ? false
          : seedByTTR,

      socialPlay:
        format === "doubles"
          ? true
          : socialPlay,

    });

    navigate(
      "/tournaments/players"
    );

  }

  return (

    <div className="max-w-7xl mx-auto">

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">

        {/* Left */}

        <div className="space-y-8">

          {/* Header */}

          <div>

            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">

              <Trophy className="h-4 w-4" />

              Tournament Wizard

            </div>

            <h1 className="mt-4 text-5xl font-black">

              New Tournament

            </h1>

            <p className="mt-3 text-lg text-slate-500">

              Configure your tournament before selecting players.

            </p>

          </div>

          {/* Tournament Details */}

          <div className="rounded-3xl border bg-white p-8 shadow-sm">

            <h2 className="mb-6 text-xl font-bold">

              Tournament Details

            </h2>

            <div className="space-y-5">

              <input
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Tournament Name"
                className="w-full rounded-xl border p-3"
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

              <input
                type="date"
                value={date}
                onChange={(e) =>
                  setDate(e.target.value)
                }
                className="w-full rounded-xl border p-3"
              />

            </div>

          </div>

          {/* Tournament Size */}

          <div className="rounded-3xl border bg-white p-8 shadow-sm">

            <h2 className="mb-6 text-xl font-bold">

              Tournament Size

            </h2>

            <label className="font-medium">

              Number of Players

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

          </div>

          {/* Tournament Format */}

          <div className="rounded-3xl border bg-white p-8 shadow-sm">

            <h2 className="mb-6 text-xl font-bold">

              Tournament Format

            </h2>

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

            </div>

          </div>

          {/* Pool Settings */}

          {format === "pools" && (

            <div className="rounded-3xl border bg-white p-8 shadow-sm">

              <h2 className="mb-6 text-xl font-bold">

                Pool Settings

              </h2>

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

                <div>

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

                </div>

              </div>

            </div>

          )}

          {/* Seeding */}

          <div className="rounded-3xl border bg-white p-8 shadow-sm">

            <div className="space-y-5">

            <label className="flex items-center gap-3">

              <input
                type="checkbox"
                checked={socialPlay}
                disabled={
                  format === "doubles"
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
                  !socialPlay &&
                  format !== "doubles" &&
                  seedByTTR
                }
                disabled={
                  socialPlay ||
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

            <p className="text-sm text-slate-500">

              {socialPlay
                ? format === "doubles"
                  ? "Doubles is a knockout-only format and is never TTR dependent."
                  : "Social play keeps the draw casual and random."
                : "KiwiTTR events can seed pools and knockouts by rating."}

            </p>

            </div>

          </div>

          <button
            onClick={continueToPlayers}
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
            "
          >

            Continue to Player Selection

            <ArrowRight className="h-5 w-5" />

          </button>
                  </div>

        {/* Right */}

        <div>

          <div className="sticky top-24 rounded-3xl border bg-white p-8 shadow-sm">

            <h2 className="text-xl font-bold">

              Tournament Preview

            </h2>

            <p className="mt-2 text-sm text-slate-500">

              Review your tournament before selecting players.

            </p>

            <div className="mt-8 space-y-5">

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

              <hr className="border-slate-200" />

              <div className="flex items-center justify-between">

                <span className="text-slate-500">

                  Players

                </span>

                <strong>

                  {Number(playerCount) || "-"}

                </strong>

              </div>

              <div className="flex items-center justify-between">

                <span className="text-slate-500">

                  Format

                </span>

                <strong>

                  {format === "pools"
                    ? "Pools → Knockout"
                    : format === "doubles"
                      ? "Doubles Knockout"
                      : "Straight Knockout"}

                </strong>

              </div>

              {format === "pools" && (

                <>

                  <div className="flex items-center justify-between">

                    <span className="text-slate-500">

                      Number of Pools

                    </span>

                    <strong>

                      {poolCount}

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

                  <div className="flex items-center justify-between">

                    <span className="text-slate-500">

                      Progressing

                    </span>

                    <strong>

                      Top {playersProgressing}

                    </strong>

                  </div>

                  <div className="flex items-center justify-between">

                    <span className="text-slate-500">

                      Knockout Draw

                    </span>

                    <strong>

                      {knockoutSize} Players

                    </strong>

                  </div>

                </>

              )}

              {format === "doubles" && (

                <div className="flex items-center justify-between">

                  <span className="text-slate-500">

                    Pairs

                  </span>

                  <strong>

                    {Number(playerCount)
                      ? Math.ceil(
                          Number(playerCount) / 2
                        )
                      : "-"}

                  </strong>

                </div>

              )}

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

            <div className="mt-8 rounded-2xl bg-blue-50 p-5">

              <h3 className="font-semibold text-blue-900">

                What's Next?

              </h3>

              <p className="mt-2 text-sm leading-6 text-blue-700">

                Continue to select the players for this tournament.
                Once all players have been selected, KiwiTTR will
                automatically seed the tournament according to the
                selected settings and generate the draw.

              </p>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}
