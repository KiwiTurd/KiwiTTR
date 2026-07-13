import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import {
  ArrowRight,
  Clock,
  Lock,
  MapPin,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";

import useRole from "../hooks/useRole";
import useFormDraftState, { clearFormDraft } from "../hooks/useFormDraftState";
import type { Club } from "../types/club";
import type { Player } from "../types/player";
import { getClubs } from "../services/supabase/clubService";
import { getPlayers } from "../services/supabase/playerService";
import { notify } from "../services/notificationService";
import {
  buildClassicMatches,
  classicTeamDoublesCount,
  classicTeamFormatLabel,
  classicTeamPlayerCount,
  createClassic6Team,
  sortClassic6Players,
  type Classic6Player,
  type Classic6Team,
  type CustomTeamSettings,
} from "../services/teams/teamEngine";
import {
  createTeamGameDraft,
  getTeamGame,
  saveTeamGame,
} from "../services/teams/teamGameService";
import { removeTeamGameTtrMatches } from "../services/teams/teamSubmission";
import LoadingScreen from "../components/shared/LoadingScreen";
import PlayerSelector from "../components/shared/PlayerSelector";

type Side = "home" | "away";

const emptyDoubles: Classic6Team["doubles"] = [
  ["", ""],
  ["", ""],
  ["", ""],
];

export default function NewTeamGameEvent() {
  const navigate = useNavigate();
  const { format: routeFormat } =
    useParams();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isCustomFormat =
    routeFormat === "custom";
  const isAbc123Format =
    routeFormat === "abc-123";
  const teamFormat =
    isCustomFormat
      ? "custom"
      : isAbc123Format
        ? "abc-123"
      : routeFormat === "classic-3"
        ? "classic-3"
        : "classic-6";
  const formatLabel =
    classicTeamFormatLabel(teamFormat);
  const draftPrefix = `team-game.${editId ?? teamFormat}`;
  const {
    isAdmin,
    isClubLeader,
    clubId: userClubId,
  } = useRole();

  const [clubs, setClubs] =
    useState<Club[]>([]);
  const [players, setPlayers] =
    useState<Player[]>([]);
  const [name, setName] =
    useFormDraftState(`${draftPrefix}.name`, "");
  const [
    eventDescription,
    setEventDescription,
  ] = useFormDraftState(`${draftPrefix}.description`, "");
  const [date, setDate] =
    useFormDraftState(`${draftPrefix}.date`, "");
  const [startTime, setStartTime] =
    useFormDraftState(`${draftPrefix}.startTime`, "");
  const [
    locationClubId,
    setLocationClubId,
  ] = useFormDraftState(`${draftPrefix}.locationClubId`, "");
  const [
    customPlayersPerTeam,
    setCustomPlayersPerTeam,
  ] = useFormDraftState(`${draftPrefix}.playersPerTeam`, 4);
  const [
    customOrdering,
    setCustomOrdering,
  ] = useFormDraftState<CustomTeamSettings["ordering"]>(`${draftPrefix}.ordering`,
    "ttr-auto"
  );
  const [
    customEventLevel,
    setCustomEventLevel,
  ] = useFormDraftState<CustomTeamSettings["eventLevel"]>(`${draftPrefix}.eventLevel`,
    "social"
  );
  const [
    customMatchMode,
    setCustomMatchMode,
  ] = useFormDraftState<CustomTeamSettings["matchMode"]>(`${draftPrefix}.matchMode`,
    "play-through"
  );
  const [
    customTotalGames,
    setCustomTotalGames,
  ] = useFormDraftState(`${draftPrefix}.totalGames`, 5);
  const [
    customDoublesIncluded,
    setCustomDoublesIncluded,
  ] = useFormDraftState(`${draftPrefix}.doublesIncluded`, false);
  const [
    customDoublesGames,
    setCustomDoublesGames,
  ] = useFormDraftState(`${draftPrefix}.doublesGames`, 0);
  const customSettings: CustomTeamSettings | undefined =
    isCustomFormat
      ? {
          playersPerTeam: customPlayersPerTeam,
          ordering: customOrdering,
          eventLevel: customEventLevel,
          matchMode: customMatchMode,
          totalGames: customTotalGames,
          doublesIncluded:
            customDoublesGames > 0 ||
            customDoublesIncluded,
          doublesGames: customDoublesGames,
        }
      : undefined;
  const playerCount =
    classicTeamPlayerCount(
      teamFormat,
      customSettings
    );
  const doublesCount =
    classicTeamDoublesCount(
      teamFormat,
      customSettings
    );
  const [
    homeClubId,
    setHomeClubId,
  ] = useFormDraftState(`${draftPrefix}.homeClubId`, "");
  const [
    awayClubId,
    setAwayClubId,
  ] = useFormDraftState(`${draftPrefix}.awayClubId`, "");
  const [
    homeClubSub,
    setHomeClubSub,
  ] = useFormDraftState(`${draftPrefix}.homeClubSub`, false);
  const [
    awayClubSub,
    setAwayClubSub,
  ] = useFormDraftState(`${draftPrefix}.awayClubSub`, false);
  const [
    homePlayerIds,
    setHomePlayerIds,
  ] = useFormDraftState<string[]>(`${draftPrefix}.homePlayerIds`,
    Array(playerCount).fill("")
  );
  const [
    awayPlayerIds,
    setAwayPlayerIds,
  ] = useFormDraftState<string[]>(`${draftPrefix}.awayPlayerIds`,
    Array(playerCount).fill("")
  );
  const [
    homeDoubles,
    setHomeDoubles,
  ] = useFormDraftState<Classic6Team["doubles"]>(`${draftPrefix}.homeDoubles`,
    emptyDoubles
  );
  const [
    awayDoubles,
    setAwayDoubles,
  ] = useFormDraftState<Classic6Team["doubles"]>(`${draftPrefix}.awayDoubles`,
    emptyDoubles
  );
  const [loadingDraft, setLoadingDraft] =
    useState(Boolean(editId));
  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    setHomePlayerIds((current) =>
      Array.from(
        { length: playerCount },
        (_, index) => current[index] ?? ""
      )
    );
    setAwayPlayerIds((current) =>
      Array.from(
        { length: playerCount },
        (_, index) => current[index] ?? ""
      )
    );
  }, [playerCount]);

  useEffect(() => {
    async function loadData() {
      try {
        const [clubData, playerData] =
          await Promise.all([
            getClubs(),
            getPlayers(),
          ]);

        setClubs(clubData);
        setPlayers(playerData);

        if (
          isClubLeader &&
          userClubId &&
          !editId
        ) {
          setHomeClubId(userClubId);
          setLocationClubId(userClubId);
        }
      } catch (error) {
        console.error(error);
        notify.fault(
          `Unable to load ${formatLabel} setup data.`
        );
      }
    }

    void loadData();
  }, [
    isClubLeader,
    userClubId,
    editId,
    formatLabel,
  ]);

  useEffect(() => {
    if (!editId) {
      return;
    }

    const draftId = editId;
    let cancelled = false;

    async function loadDraft() {
      try {
        const draft = await getTeamGame(draftId);

        if (cancelled) {
          return;
        }

        if (!draft) {
          notify.timeout(
            "Team game draft not found."
          );
          return;
        }

        if (draft.status !== "draft" && !isAdmin) {
          notify.timeout(
            "This team game is live and can no longer be edited."
          );
          navigate(
            `/team-games/${draft.id}/manage`
          );
          return;
        }

        setName(draft.name);
        setEventDescription(
          draft.description ?? ""
        );
        setDate(draft.date);
        setStartTime(draft.startTime ?? "");
        setLocationClubId(
          draft.locationClubId ??
            draft.home.clubId
        );
        if (draft.customSettings) {
          setCustomPlayersPerTeam(
            draft.customSettings.playersPerTeam
          );
          setCustomOrdering(
            draft.customSettings.ordering
          );
          setCustomEventLevel(
            draft.customSettings.eventLevel
          );
          setCustomMatchMode(
            draft.customSettings.matchMode
          );
          setCustomTotalGames(
            draft.customSettings.totalGames
          );
          setCustomDoublesIncluded(
            draft.customSettings.doublesIncluded
          );
          setCustomDoublesGames(
            draft.customSettings.doublesGames ??
              (draft.customSettings.doublesIncluded
                ? 1
                : 0)
          );
        }
        setHomeClubId(draft.home.clubId);
        setAwayClubId(draft.away.clubId);
        setHomePlayerIds(
          Array.from(
            { length: playerCount },
            (_, index) =>
              draft.home.players[index]?.id ?? ""
          )
        );
        setAwayPlayerIds(
          Array.from(
            { length: playerCount },
            (_, index) =>
              draft.away.players[index]?.id ?? ""
          )
        );
        setHomeDoubles(draft.home.doubles);
        setAwayDoubles(draft.away.doubles);
      } catch (error) {
        console.error(error);
        notify.fault(
          "Unable to load team game draft."
        );
      } finally {
        if (!cancelled) {
          setLoadingDraft(false);
        }
      }
    }

    void loadDraft();

    return () => {
      cancelled = true;
    };
  }, [
    editId,
    isAdmin,
    navigate,
    playerCount,
  ]);

  const playerClubNames = useMemo(() => {
    return new Map(
      clubs.map((club) => [
        club.id,
        club.name,
      ])
    );
  }, [clubs]);

  const selectedHomeClub =
    clubs.find(
      (club) => club.id === homeClubId
    );
  const selectedAwayClub =
    clubs.find(
      (club) => club.id === awayClubId
    );
  const selectedLocationClub =
    clubs.find(
      (club) => club.id === locationClubId
    );

  const toClassicPlayer = useCallback((
    player: Player
  ): Classic6Player => {
    return {
      id: player.id,
      name: `${player.firstName} ${player.lastName}`,
      rating: player.rating,
      clubId: player.clubId,
      clubName:
        playerClubNames.get(player.clubId) ?? "",
    };
  }, [playerClubNames]);

  const homePlayers = useMemo(() => {
    const selectedPlayers = homePlayerIds
      .map((id) =>
        players.find(
          (player) => player.id === id
        )
      )
      .filter(Boolean)
      .map((player) =>
        toClassicPlayer(player as Player)
      );

    return isCustomFormat &&
      customOrdering === "manual" ||
      isAbc123Format
      ? selectedPlayers
      : sortClassic6Players(selectedPlayers);
  }, [
    customOrdering,
    homePlayerIds,
    isAbc123Format,
    isCustomFormat,
    players,
    toClassicPlayer,
  ]);

  const awayPlayers = useMemo(() => {
    const selectedPlayers = awayPlayerIds
      .map((id) =>
        players.find(
          (player) => player.id === id
        )
      )
      .filter(Boolean)
      .map((player) =>
        toClassicPlayer(player as Player)
      );

    return isCustomFormat &&
      customOrdering === "manual" ||
      isAbc123Format
      ? selectedPlayers
      : sortClassic6Players(selectedPlayers);
  }, [
    awayPlayerIds,
    customOrdering,
    isAbc123Format,
    isCustomFormat,
    players,
    toClassicPlayer,
  ]);

  const homeTeam = useMemo(
    () =>
      createClassic6Team(
        "home",
        homeClubId,
        selectedHomeClub?.name ?? "Home Team",
        homePlayers,
        homeDoubles,
        playerCount,
        isAbc123Format ||
          (isCustomFormat &&
            customOrdering === "manual")
      ),
    [
      homeClubId,
      selectedHomeClub?.name,
      homePlayers,
      homeDoubles,
      isAbc123Format,
      isCustomFormat,
      playerCount,
      customOrdering,
    ]
  );

  const awayTeam = useMemo(
    () =>
      createClassic6Team(
        "away",
        awayClubId,
        selectedAwayClub?.name ?? "Away Team",
        awayPlayers,
        awayDoubles,
        playerCount,
        isAbc123Format ||
          (isCustomFormat &&
            customOrdering === "manual")
      ),
    [
      awayClubId,
      selectedAwayClub?.name,
      awayPlayers,
      awayDoubles,
      isAbc123Format,
      isCustomFormat,
      playerCount,
      customOrdering,
    ]
  );

  function updatePlayer(
    side: Side,
    index: number,
    playerId: string
  ) {
    const alreadySelected =
      playerId &&
      [
        ...homePlayerIds.map((id, i) => ({
          id,
          side: "home" as const,
          index: i,
        })),
        ...awayPlayerIds.map((id, i) => ({
          id,
          side: "away" as const,
          index: i,
        })),
      ].some((entry) => {
        const sameSlot =
          entry.side === side &&
          entry.index === index;

        return !sameSlot && entry.id === playerId;
      });

    if (alreadySelected) {
      notify.timeout(
        "A singles player can only be selected once."
      );
      return;
    }

    const setter =
      side === "home"
        ? setHomePlayerIds
        : setAwayPlayerIds;

    setter((current) =>
      current.map((value, i) =>
        i === index ? playerId : value
      )
    );
  }

  function updateDoubles(
    side: Side,
    pairIndex: number,
    playerIndex: number,
    playerId: string
  ) {
    const setter =
      side === "home"
        ? setHomeDoubles
        : setAwayDoubles;

    setter((current) => {
      const alreadySelected =
        playerId &&
        current.some((pair, index) =>
          pair.some((value, i) => {
            const sameSlot =
              index === pairIndex &&
              i === playerIndex;

            return !sameSlot && value === playerId;
          })
        );

      if (alreadySelected) {
        notify.timeout(
          "A player can only be used in one doubles pair."
        );
        return current;
      }

      return current.map((pair, index) =>
        index === pairIndex
          ? (pair.map((value, i) =>
              i === playerIndex
                ? playerId
                : value
            ) as [string, string])
          : pair
      ) as Classic6Team["doubles"];
    });
  }

  function availablePlayers(
    side: Side,
    index: number,
    selectedId: string
  ) {
    const clubId =
      side === "home"
        ? homeClubId
        : awayClubId;
    const subEnabled =
      side === "home"
        ? homeClubSub
        : awayClubSub;
    const selectedIds = [
      ...homePlayerIds.map((id, i) => ({
        id,
        side: "home" as const,
        index: i,
      })),
      ...awayPlayerIds.map((id, i) => ({
        id,
        side: "away" as const,
        index: i,
      })),
    ]
      .filter(
        (entry) =>
          !(
            entry.side === side &&
            entry.index === index
          )
      )
      .map((entry) => entry.id);

    return players.filter((player) => {
      if (
        !subEnabled &&
        player.clubId !== clubId
      ) {
        return false;
      }

      return (
        player.id === selectedId ||
        !selectedIds.includes(player.id)
      );
    });
  }

  async function saveSetup() {
    if (saving) {
      return;
    }

    if (!name.trim()) {
      notify.timeout(
        "Please enter a team game name."
      );
      return;
    }

    if (!date) {
      notify.timeout(
        "Please choose a team game date."
      );
      return;
    }

    if (!startTime) {
      notify.timeout(
        "Please choose a start time."
      );
      return;
    }

    if (!selectedLocationClub) {
      notify.timeout(
        "Please choose a location club."
      );
      return;
    }

    if (
      isCustomFormat &&
      customTotalGames < 1
    ) {
      notify.timeout(
        "Please enter at least 1 total game."
      );
      return;
    }

    if (
      isCustomFormat &&
      customDoublesGames > customTotalGames
    ) {
      notify.timeout(
        "Doubles games cannot exceed total games."
      );
      return;
    }

    if (
      homePlayers.length !== playerCount ||
      awayPlayers.length !== playerCount
    ) {
      notify.timeout(
        `${formatLabel} requires ${playerCount} players per team.`
      );
      return;
    }

    if (
      homeDoubles
        .slice(0, doublesCount)
        .flat()
        .some((id) => !id) ||
      awayDoubles
        .slice(0, doublesCount)
        .flat()
        .some((id) => !id)
    ) {
      notify.timeout(
        "Please complete all doubles pairs."
      );
      return;
    }

    setSaving(true);

    try {
      const matches = buildClassicMatches(
        teamFormat,
        homeTeam,
        awayTeam,
        customSettings
      );
      const existingDraft = editId
        ? await getTeamGame(editId)
        : null;

      if (editId && !existingDraft) {
        notify.timeout(
          "Team game draft not found."
        );
        return;
      }

      const editableDraft =
        existingDraft?.submitted
          ? await removeTeamGameTtrMatches(
              existingDraft
            )
          : existingDraft;

      const draft = editId
        ? await saveTeamGame({
            ...editableDraft!,
            id: editId,
            name: name.trim(),
            description:
              eventDescription.trim(),
            format: teamFormat,
            customSettings,
            date,
            startTime,
            locationClubId:
              selectedLocationClub.id,
            locationClubName:
              selectedLocationClub.name,
            home: homeTeam,
            away: awayTeam,
            matches,
            status:
              editableDraft?.status === "draft"
                ? "draft"
                : "live",
            submitted: false,
            homeConfirmed: false,
            awayConfirmed: false,
          })
        : await createTeamGameDraft({
            name: name.trim(),
            description:
              eventDescription.trim(),
            format: teamFormat,
            customSettings,
            date,
            startTime,
            locationClubId:
              selectedLocationClub.id,
            locationClubName:
              selectedLocationClub.name,
            home: homeTeam,
            away: awayTeam,
            matches,
          });

      notify.eventCreated(draft.name);
      clearFormDraft(draftPrefix);
      navigate(`/team-games/${draft.id}/manage`);
    } catch (error) {
      console.error(error);
      const message =
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : "Unable to save team game.";
      notify.fault(
        message.includes("team_games_status_check")
          ? "The database schema needs the latest team-game migration before drafts can be saved."
          : message
      );
    } finally {
      setSaving(false);
    }
  }

  function renderPlayerSelect(
    side: Side,
    index: number,
    value: string
  ) {
    const abcHomeLabels = ["A", "B", "C"];
    const abcAwayLabels = ["1", "2", "3"];
    const label = isAbc123Format
      ? side === "home"
        ? abcHomeLabels[index]
        : abcAwayLabels[index]
      : `${side === "home" ? "Home" : "Away"} ${index + 1}`;

    return (
      <label
        key={`${side}-player-${index}`}
        className="block"
      >
        <span className="mb-1 block text-sm font-medium">
          {label}
        </span>
        <PlayerSelector
          players={availablePlayers(
            side,
            index,
            value
          )}
          value={
            players.find(
              (player) => player.id === value
            ) ?? null
          }
          onChange={(player) =>
            updatePlayer(side, index, player.id)
          }
          onClear={() => updatePlayer(side, index, "")}
        />
      </label>
    );
  }

  function renderDoublesSelects(
    side: Side,
    team: Classic6Team,
    doubles: Classic6Team["doubles"]
  ) {
    function availableDoublesPlayers(
      selectedId: string
    ) {
      const selectedIds =
        new Set(doubles.flat().filter(Boolean));

      return team.players.filter(
        (player) =>
          player.id === selectedId ||
          !selectedIds.has(player.id)
      );
    }

    return (
      <div className="space-y-3">
        {doubles
          .slice(0, doublesCount)
          .map((pair, pairIndex) => (
          <div
            key={`${side}-doubles-${pairIndex}`}
            className="rounded-xl border bg-slate-50 p-3"
          >
            <p className="mb-3 font-semibold">
              {team.name} D{pairIndex + 1}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[0, 1].map((playerIndex) => {
                const options = availableDoublesPlayers(
                  pair[playerIndex]
                ).map((player) => ({
                  id: player.id,
                  firstName: player.name,
                  lastName: "",
                  rating: player.rating,
                  clubName: team.name,
                }));

                return (
                  <PlayerSelector
                    key={playerIndex}
                    players={options}
                    value={
                      options.find(
                        (player) =>
                          player.id === pair[playerIndex]
                      ) ?? null
                    }
                    onChange={(player) =>
                      updateDoubles(
                        side,
                        pairIndex,
                        playerIndex,
                        player.id
                      )
                    }
                    onClear={() =>
                      updateDoubles(
                        side,
                        pairIndex,
                        playerIndex,
                        ""
                      )
                    }
                  />
                );
              })}
            </div>
          </div>
          ))}
      </div>
    );
  }

  if (loadingDraft) {
    return <LoadingScreen label="Loading team game setup..." />;
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800">
              <UsersRound className="h-4 w-4" />
              {editId
                ? `Edit ${formatLabel} Setup`
                : `${formatLabel} Setup`}
            </div>
            <h1 className="mt-4 text-5xl font-normal">
              {formatLabel}
            </h1>
            <p className="mt-3 text-lg text-slate-500">
              Confirm and save setup before opening the match builder.
            </p>
          </div>

          <div className="rounded-3xl border bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-xl font-bold">
              Event Details
            </h2>
            <div className="space-y-5">
              <input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Team Game Name"
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
              <input
                type="date"
                value={date}
                onChange={(event) =>
                  setDate(event.target.value)
                }
                className="w-full rounded-xl border p-3"
              />
              <label className="block">
                <span className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Clock className="h-4 w-4 text-slate-500" />
                  Start Time
                </span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(event) =>
                    setStartTime(event.target.value)
                  }
                  className="w-full rounded-xl border p-3"
                />
              </label>
              <label className="block">
                <span className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  Location Club
                </span>
                <select
                  value={locationClubId}
                  onChange={(event) =>
                    setLocationClubId(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border p-3"
                >
                  <option value="">
                    Select Location Club
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
              </label>
            </div>
          </div>

          {isCustomFormat && (
            <div className="rounded-3xl border bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-emerald-700" />
                <h2 className="text-xl font-bold">
                  Custom Format
                </h2>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">
                    Total Players Per Team
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={customPlayersPerTeam}
                    onChange={(event) =>
                      setCustomPlayersPerTeam(
                        Math.max(
                          1,
                          Number(
                            event.target.value
                          ) || 1
                        )
                      )
                    }
                    className="w-full rounded-xl border p-3"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium">
                    Total Games
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={customTotalGames}
                    onChange={(event) =>
                      setCustomTotalGames(
                        () => {
                          const next = Math.max(
                            1,
                            Number(
                              event.target.value
                            ) || 1
                          );

                          setCustomDoublesGames(
                            (current) =>
                              Math.min(
                                current,
                                next
                              )
                          );

                          return next;
                        }
                      )
                    }
                    className="w-full rounded-xl border p-3"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium">
                    Player Order
                  </span>
                  <select
                    value={customOrdering}
                    onChange={(event) =>
                      setCustomOrdering(
                        event.target
                          .value as CustomTeamSettings["ordering"]
                      )
                    }
                    className="w-full rounded-xl border p-3"
                  >
                    <option value="ttr-auto">
                      TTR Auto Order
                    </option>
                    <option value="manual">
                      Manual Order
                    </option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium">
                    Event Type
                  </span>
                  <select
                    value={customEventLevel}
                    onChange={(event) =>
                      setCustomEventLevel(
                        event.target
                          .value as CustomTeamSettings["eventLevel"]
                      )
                    }
                    className="w-full rounded-xl border p-3"
                  >
                    <option value="ttr">
                      TTR
                    </option>
                    <option value="social">
                      Social
                    </option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium">
                    Match Mode
                  </span>
                  <select
                    value={customMatchMode}
                    onChange={(event) =>
                      setCustomMatchMode(
                        event.target
                          .value as CustomTeamSettings["matchMode"]
                      )
                    }
                    className="w-full rounded-xl border p-3"
                  >
                    <option value="play-through">
                      Play-Through
                    </option>
                    <option value="best-of">
                      Best Of
                    </option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium">
                    Total Doubles Games
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={customTotalGames}
                    value={customDoublesGames}
                    onChange={(event) =>
                      setCustomDoublesGames(() => {
                        const next = Math.min(
                          customTotalGames,
                          Math.max(
                            0,
                            Number(
                              event.target.value
                            ) || 0
                          )
                        );

                        setCustomDoublesIncluded(
                          next > 0
                        );

                        return next;
                      })
                    }
                    className="w-full rounded-xl border p-3"
                  />
                  <span className="mt-1 block text-sm text-slate-500">
                    Doubles are placed at the end and cycle D1, D2, D3.
                  </span>
                </label>
              </div>
            </div>
          )}

          <div className="rounded-3xl border bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-xl font-bold">
              Teams
            </h2>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <h3 className="font-bold">
                  {isAbc123Format
                    ? "ABC Home"
                    : "Home Team"}
                </h3>
                {isAdmin ? (
                  <select
                    value={homeClubId}
                    onChange={(event) =>
                      setHomeClubId(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border p-3"
                  >
                    <option value="">
                      Select Home Club
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
                      {selectedHomeClub?.name ??
                        "No club assigned"}
                    </span>
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setHomeClubSub(
                      !homeClubSub
                    )
                  }
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                    homeClubSub
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Club Sub
                </button>
                <div className="grid gap-3">
                  {homePlayerIds
                    .slice(0, playerCount)
                    .map((id, index) =>
                      renderPlayerSelect(
                        "home",
                        index,
                        id
                      )
                    )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold">
                  {isAbc123Format
                    ? "123 Away"
                    : "Away Team"}
                </h3>
                <select
                  value={awayClubId}
                  onChange={(event) =>
                    setAwayClubId(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border p-3"
                >
                  <option value="">
                    Select Away Club
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
                <button
                  type="button"
                  onClick={() =>
                    setAwayClubSub(
                      !awayClubSub
                    )
                  }
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                    awayClubSub
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Club Sub
                </button>
                <div className="grid gap-3">
                  {awayPlayerIds
                    .slice(0, playerCount)
                    .map((id, index) =>
                      renderPlayerSelect(
                        "away",
                        index,
                        id
                      )
                    )}
                </div>
              </div>
            </div>
          </div>

          {doublesCount > 0 && (
            <div className="rounded-3xl border bg-white p-8 shadow-sm">
              <h2 className="mb-6 text-xl font-bold">
                Doubles Order
              </h2>
              <p className="mb-5 text-sm text-slate-500">
                The saved setup can be edited until the match is officially marked live.
              </p>
              <div className="grid gap-6 lg:grid-cols-2">
                {renderDoublesSelects(
                  "home",
                  homeTeam,
                  homeDoubles
                )}
                {renderDoublesSelects(
                  "away",
                  awayTeam,
                  awayDoubles
                )}
              </div>
            </div>
          )}

          <button
            onClick={saveSetup}
            disabled={saving}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-700 py-4 font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-wait disabled:bg-emerald-500"
          >
            {saving
              ? "Saving..."
              : editId
              ? "Save Setup Changes"
              : "Save Setup and Continue"}
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        <div>
          <div className="sticky top-24 rounded-3xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">
              Setup Preview
            </h2>
            <div className="mt-5 space-y-3 text-sm">
              <PreviewRow
                label="Event"
                value={name.trim() || formatLabel}
              />
              <PreviewRow
                label="Date"
                value={date || "-"}
              />
              <PreviewRow
                label="Start"
                value={startTime || "-"}
              />
              <PreviewRow
                label="Location"
                value={
                  selectedLocationClub?.name ?? "-"
                }
              />
              <hr className="border-slate-200" />
              <PreviewRow
                label="Home"
                value={selectedHomeClub?.name ?? "-"}
              />
              <PreviewRow
                label="Away"
                value={selectedAwayClub?.name ?? "-"}
              />
              <PreviewRow
                label="Players"
                value={`${homePlayers.length}/${playerCount} v ${awayPlayers.length}/${playerCount}`}
              />
              <PreviewRow
                label="Mode"
                value={formatLabel}
              />
              {isCustomFormat && (
                <>
                  <PreviewRow
                    label="Order"
                    value={
                      customOrdering ===
                      "ttr-auto"
                        ? "TTR Auto"
                        : "Manual"
                    }
                  />
                  <PreviewRow
                    label="Type"
                    value={
                      customEventLevel === "ttr"
                        ? "TTR"
                        : "Social"
                    }
                  />
                  <PreviewRow
                    label="Games"
                    value={`${customTotalGames} · ${
                      customMatchMode ===
                      "best-of"
                        ? "Best Of"
                        : "Play-Through"
                    }`}
                  />
                  <PreviewRow
                    label="Doubles"
                    value={
                      customDoublesGames > 0
                        ? `${customDoublesGames} games`
                        : "Not Included"
                    }
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">
        {label}
      </span>
      <strong className="text-right">
        {value}
      </strong>
    </div>
  );
}
