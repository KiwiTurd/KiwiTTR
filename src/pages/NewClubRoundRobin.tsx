import { ArrowLeft, ArrowRight, CalendarDays, Layers3 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useTournament } from "../context/TournamentContext";
import useFormDraftState from "../hooks/useFormDraftState";
import useRole from "../hooks/useRole";
import { notify } from "../services/notificationService";
import { getClubs } from "../services/supabase/clubService";
import type { Club } from "../types/club";
import { getNewZealandDate } from "../utils/newZealandDate";
import SlateImagePageHeader from "../components/shared/SlateImagePageHeader";

const INPUT_CLASS = "w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100";

export default function NewClubRoundRobin() {
  const navigate = useNavigate();
  const { tournament, startTournament, updateSettings } = useTournament();
  const { isAdmin, clubId: linkedClubId } = useRole();
  const existingSettings = tournament.settings.eventType === "club-round-robin"
    ? tournament.settings
    : null;
  const [clubs, setClubs] = useState<Club[]>([]);
  const [name, setName] = useFormDraftState("club-round-robin.new.name", existingSettings?.name ?? "");
  const [description, setDescription] = useFormDraftState("club-round-robin.new.description", existingSettings?.eventDescription ?? "");
  const [clubId, setClubId] = useFormDraftState("club-round-robin.new.clubId", existingSettings?.clubId ?? linkedClubId ?? "");
  const [date, setDate] = useFormDraftState("club-round-robin.new.date", existingSettings?.date ?? getNewZealandDate());
  const [startTime, setStartTime] = useFormDraftState("club-round-robin.new.startTime", existingSettings?.startTime ?? "");
  const [roundRobinCount, setRoundRobinCount] = useFormDraftState("club-round-robin.new.count", existingSettings?.roundRobinCount ?? 1);
  const [allowSignUp, setAllowSignUp] = useFormDraftState("club-round-robin.new.allowSignUp", existingSettings?.allowSignUp ?? true);
  const [signUpClosesAt, setSignUpClosesAt] = useFormDraftState("club-round-robin.new.signUpClosesAt", existingSettings?.signUpClosesAt ?? "");
  const [ttrEnabled, setTtrEnabled] = useFormDraftState("club-round-robin.new.ttrEnabled", existingSettings ? !existingSettings.socialPlay : true);

  useEffect(() => {
    void getClubs().then(setClubs).catch(console.error);
  }, []);

  function continueToGroups() {
    const eventClubId = isAdmin ? clubId : linkedClubId;
    if (!name.trim() || !eventClubId || !date || !startTime) {
      notify.timeout("Add a name, club, date and start time.");
      return;
    }

    const settings = {
      eventType: "club-round-robin",
      roundRobinCount,
      name: name.trim(),
      eventDescription: description.trim(),
      clubId: eventClubId,
      date,
      startTime,
      signUpClosesAt: allowSignUp && signUpClosesAt
        ? signUpClosesAt
        : null,
      ageLimit: null,
      ageMinimum: null,
      gender: "open",
      playerCount: 256,
      playerLimitEnabled: false,
      format: "pool-ratings",
      poolSize: 16,
      progressing: 0,
      seedByTTR: false,
      socialPlay: !ttrEnabled,
      allowSignUp,
      ttrLimitEnabled: false,
      ttrLimit: 2000,
    } as const;

    if (tournament.settings.eventType === "club-round-robin") {
      updateSettings(settings);
    } else {
      startTournament(settings);
    }
    navigate("/club-events/round-robin/players");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <SlateImagePageHeader
        pageKey="club-round-robin"
        title="Round Robin Builder"
        subtitle="Set the event details and choose how many independent round-robin groups to run."
        actions={<Link to="/club-events/new" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950"><ArrowLeft className="h-4 w-4" />Club Event Types</Link>}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Event name"><input value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLASS} placeholder="Thursday Club Round Robins" /></Field>
          {isAdmin && <Field label="Club"><select value={clubId} onChange={(e) => setClubId(e.target.value)} className={INPUT_CLASS}><option value="">Select club</option>{clubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}</select></Field>}
          <Field label="Date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={INPUT_CLASS} /></Field>
          <Field label="Start time"><input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={INPUT_CLASS} /></Field>
          <Field label="Number of round robins">
            <div className="relative"><Layers3 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input type="number" min={1} max={32} value={roundRobinCount} onChange={(e) => setRoundRobinCount(Math.max(1, Math.min(32, Number(e.target.value) || 1)))} className={`${INPUT_CLASS} pl-11`} /></div>
          </Field>
          <Field label="Sign-ups close"><input type="date" disabled={!allowSignUp} value={signUpClosesAt} onChange={(e) => setSignUpClosesAt(e.target.value)} className={`${INPUT_CLASS} disabled:bg-slate-100`} /></Field>
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 md:col-span-2"><input type="checkbox" checked={ttrEnabled} onChange={(e) => setTtrEnabled(e.target.checked)} className="h-4 w-4" /><span><span className="block font-semibold">TTR rated</span><span className="text-sm text-slate-500">When enabled, completed singles and round-robin matches update player ratings. Doubles remain non-TTR.</span></span></label>
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 md:col-span-2"><input type="checkbox" checked={allowSignUp} onChange={(e) => setAllowSignUp(e.target.checked)} className="h-4 w-4" /><span><span className="block font-semibold">Allow player sign-ups</span><span className="text-sm text-slate-500">Players can join from the Club Events page until the event goes live.</span></span></label>
          <Field label="Description" wide><textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className={INPUT_CLASS} placeholder="Optional event information" /></Field>
        </div>
      </section>

      <div className="flex justify-end"><button type="button" onClick={continueToGroups} className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-6 py-3 font-semibold text-white hover:bg-blue-800">Set Up Groups<ArrowRight className="h-4 w-4" /></button></div>
    </div>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={wide ? "md:col-span-2" : ""}><span className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">{label === "Date" && <CalendarDays className="h-4 w-4" />}{label}</span>{children}</label>;
}
