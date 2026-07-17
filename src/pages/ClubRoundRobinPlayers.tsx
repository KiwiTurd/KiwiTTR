import { ArrowLeft, ArrowRight, GripVertical, Plus, Users } from "lucide-react";
import { useEffect, useMemo, useState, type DragEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import PlayerSelector from "../components/shared/PlayerSelector";
import { useTournament } from "../context/TournamentContext";
import useFormDraftState, { clearFormDraft } from "../hooks/useFormDraftState";
import { notify } from "../services/notificationService";
import { getPlayers } from "../services/supabase/playerService";
import { generatePoolMatches } from "../services/tournament/matchGenerator";
import type { Player } from "../types/player";
import type { Pool } from "../types/tournament";

type DraggedPlayer = { groupIndex: number; playerIndex: number };

function initialGroups(
  pools: Pool[],
  players: Player[],
  count: number
) {
  const groups = pools.length > 0
    ? pools.map((pool) => ({ ...pool, players: [...pool.players] }))
    : Array.from({ length: count }, (_, index) => ({
        id: `pool-${index + 1}`,
        name: `Round Robin ${index + 1}`,
        players: [] as Player[],
      }));
  const assignedIds = new Set(
    groups.flatMap((group) => group.players.map((player) => player.id))
  );

  players
    .filter((player) => !assignedIds.has(player.id))
    .forEach((player) => {
      const smallestGroup = groups.reduce(
        (smallest, group, index) =>
          group.players.length < groups[smallest].players.length
            ? index
            : smallest,
        0
      );
      groups[smallestGroup].players.push(player);
    });

  return groups;
}

function resizeGroups(groups: Pool[], count: number) {
  if (groups.length === count) return groups;

  const resized = groups.slice(0, count).map((group) => ({
    ...group,
    players: [...group.players],
  }));

  while (resized.length < count) {
    const index = resized.length;
    resized.push({
      id: `pool-${index + 1}`,
      name: `Round Robin ${index + 1}`,
      players: [],
    });
  }

  groups.slice(count).flatMap((group) => group.players).forEach((player) => {
    const smallestGroup = resized.reduce(
      (smallest, group, index) =>
        group.players.length < resized[smallest].players.length
          ? index
          : smallest,
      0
    );
    resized[smallestGroup].players.push(player);
  });

  return resized;
}

export default function ClubRoundRobinPlayers() {
  const navigate = useNavigate();
  const { tournament, saveTournament } = useTournament();
  const count = tournament.settings.roundRobinCount ?? 1;
  const groupDraftKey = `club-round-robin.groups.${tournament.id || "new"}`;
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [groups, setGroups] = useFormDraftState<Pool[]>(groupDraftKey, () =>
    initialGroups(tournament.pools, tournament.players, count)
  );
  const [addingTo, setAddingTo] = useState<number | null>(null);
  const [dragged, setDragged] = useState<DraggedPlayer | null>(null);
  const [dropGroup, setDropGroup] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getPlayers().then(setAvailablePlayers).catch((error) => {
      console.error(error);
      notify.fault("Unable to load players.");
    });
  }, []);

  useEffect(() => {
    setGroups((current) => resizeGroups(current, count));
  }, [count, setGroups]);

  const selectedIds = useMemo(
    () => new Set(groups.flatMap((group) => group.players.map((player) => player.id))),
    [groups]
  );

  if (tournament.settings.eventType !== "club-round-robin") {
    return <Navigate to="/club-events/round-robin/new" replace />;
  }

  function addPlayer(groupIndex: number, player: Player) {
    if (selectedIds.has(player.id)) return;
    setGroups((current) => current.map((group, index) =>
      index === groupIndex
        ? { ...group, players: [...group.players, player] }
        : group
    ));
    setAddingTo(null);
  }

  function removePlayer(groupIndex: number, playerId: string) {
    setGroups((current) => current.map((group, index) =>
      index === groupIndex
        ? { ...group, players: group.players.filter((player) => player.id !== playerId) }
        : group
    ));
  }

  function dropIntoGroup(targetIndex: number) {
    if (!dragged || dragged.groupIndex === targetIndex) return;
    setGroups((current) => {
      const next = current.map((group) => ({ ...group, players: [...group.players] }));
      const [player] = next[dragged.groupIndex].players.splice(dragged.playerIndex, 1);
      if (player) next[targetIndex].players.push(player);
      return next;
    });
    setDragged(null);
    setDropGroup(null);
  }

  async function continueToLive() {
    if (groups.some((group) => group.players.length < 2)) {
      notify.timeout("Each round robin needs at least two players.");
      return;
    }
    setSaving(true);
    try {
      const players = groups.flatMap((group) => group.players);
      const saved = await saveTournament({
        ...tournament,
        players,
        pools: groups,
        matches: generatePoolMatches(groups).map((match) => ({
          ...match,
          matchType: "singles" as const,
          countsForTTR: !tournament.settings.socialPlay,
        })),
        knockout: [],
      });
      clearFormDraft(groupDraftKey);
      clearFormDraft("club-round-robin.new");
      navigate(`/club-events/${saved.id}/live`);
    } catch (error) {
      console.error(error);
      notify.fault("Unable to save the club round robins.");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/club-events/round-robin/new" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700"><ArrowLeft className="h-4 w-4" />Round Robin Builder</Link>
          <h1 className="mt-5 text-5xl font-normal tracking-tight text-slate-900">Set Up Round Robins</h1>
          <p className="mt-3 text-lg text-slate-500">Add players to each group, then drag players between groups to rebalance them.</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {groups.map((group, groupIndex) => (
          <section
            key={group.id}
            onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setDropGroup(groupIndex); }}
            onDrop={(event) => { event.preventDefault(); dropIntoGroup(groupIndex); }}
            className={`rounded-2xl border bg-white p-5 shadow-sm transition ${dropGroup === groupIndex && dragged?.groupIndex !== groupIndex ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200"}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Group {groupIndex + 1}</p><h2 className="text-xl font-bold">{group.name}</h2></div>
              <button type="button" onClick={() => setAddingTo(addingTo === groupIndex ? null : groupIndex)} className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"><Plus className="h-4 w-4" />Add Player</button>
            </div>

            {addingTo === groupIndex && (
              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3">
                <PlayerSelector
                  value={null}
                  onChange={(player) => addPlayer(groupIndex, player)}
                  onClear={() => setAddingTo(null)}
                  players={availablePlayers.filter((player) => !selectedIds.has(player.id))}
                  placeholder="Search for a player..."
                />
              </div>
            )}

            <div className="mt-4 min-h-28 space-y-2">
              {group.players.length === 0 ? (
                <div className="flex min-h-28 items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-400"><Users className="mr-2 h-4 w-4" />Drop or add players here</div>
              ) : group.players.map((player, playerIndex) => (
                <div
                  key={player.id}
                  draggable
                  onDragStart={(event: DragEvent<HTMLDivElement>) => { event.dataTransfer.effectAllowed = "move"; setDragged({ groupIndex, playerIndex }); }}
                  onDragEnd={() => { setDragged(null); setDropGroup(null); }}
                  className="flex cursor-grab items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 active:cursor-grabbing"
                >
                  <GripVertical className="h-4 w-4 text-slate-400" />
                  <span className="min-w-0 flex-1 truncate font-medium">{player.firstName} {player.lastName}</span>
                  <span className="text-xs text-slate-500">{player.rating} TTR</span>
                  <button type="button" onClick={() => removePlayer(groupIndex, player.id)} className="text-sm font-semibold text-red-600">Remove</button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="flex justify-end"><button type="button" disabled={saving} onClick={() => void continueToLive()} className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-6 py-3 font-semibold text-white disabled:bg-slate-400">{saving ? "Saving..." : "Continue to Live Page"}<ArrowRight className="h-4 w-4" /></button></div>
    </div>
  );
}
