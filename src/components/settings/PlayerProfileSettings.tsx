import {
  CalendarDays,
  ChevronDown,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
  UsersRound,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { notify } from "../../services/notificationService";
import {
  getPlayer,
  getOwnPlayerPrivateDetails,
  updateOwnPlayerContact,
  updateOwnPlayerPrivateDetails,
  type PlayerGender,
} from "../../services/supabase/playerService";
import PlayerAvatarUploader from "../player/PlayerAvatarUploader";
import { getNewZealandDate } from "../../utils/newZealandDate";

export default function PlayerProfileSettings({
  playerId,
}: {
  playerId: string | null;
}) {
  const [playerName, setPlayerName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [mobilePublicToClub, setMobilePublicToClub] = useState(false);
  const [emailPublicToClub, setEmailPublicToClub] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<PlayerGender | "">("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const loadPlayer = useCallback(async () => {
    if (!playerId) {
      setIsLoading(false);
      return;
    }

    try {
      const [player, privateDetails] = await Promise.all([
        getPlayer(playerId),
        getOwnPlayerPrivateDetails(),
      ]);

      if (player) {
        setPlayerName(`${player.firstName} ${player.lastName}`.trim());
        setFirstName(player.firstName);
        setLastName(player.lastName);
        setAvatarUrl(player.avatarUrl);
        setMobile(player.mobile);
        setEmail(player.email);
        setMobilePublicToClub(player.mobilePublicToClub);
        setEmailPublicToClub(player.emailPublicToClub);
      }

      setBirthDate(privateDetails.birthDate);
      setGender(privateDetails.gender);
    } catch (error) {
      console.error(error);
      notify.error("Unable to load your linked player details.");
    } finally {
      setIsLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPlayer();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadPlayer]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!playerId) {
      return;
    }

    setIsSaving(true);

    try {
      await Promise.all([
        updateOwnPlayerContact({
          mobile: mobile.trim(),
          email: email.trim(),
          mobilePublicToClub,
          emailPublicToClub,
        }),
        updateOwnPlayerPrivateDetails({
          birthDate,
          gender,
        }),
      ]);
      notify.success("Your profile details have been saved.");
    } catch (error) {
      console.error(error);
      notify.error("Unable to save your profile details.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setIsExpanded(current => !current)}
        aria-expanded={isExpanded}
        className="flex w-full items-center gap-4 px-6 py-5 text-left transition hover:bg-slate-50"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
          <UserRound className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold">Profile Details</h2>
          <p className="mt-1 text-sm text-slate-500">
            Profile picture, contact details and club visibility.
          </p>
        </div>
        <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
      </button>

      {isExpanded && <div className="border-t border-slate-200 px-6 py-5">
        {playerName && (
          <p className="mb-5 text-sm font-semibold text-slate-700">
            Linked player: {playerName}
          </p>
        )}

      {isLoading ? (
        <p className="mt-6 text-sm text-slate-500">Loading profile details…</p>
      ) : !playerId ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Your account is not linked to a player profile. Ask your club administrator to link it before updating contact details.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <PlayerAvatarUploader
              firstName={firstName}
              lastName={lastName}
              avatarUrl={avatarUrl}
              onUploaded={setAvatarUrl}
              compact
            />
            <p className="mt-3 text-xs text-slate-500">
              Images are centre-cropped and compressed to a 512 × 512 WebP.
            </p>
          </div>

          <ContactSetting
            icon={<Phone className="h-5 w-5" />}
            label="Mobile"
            value={mobile}
            onChange={setMobile}
            isPublic={mobilePublicToClub}
            onToggle={() => setMobilePublicToClub(current => !current)}
            inputMode="tel"
          />

          <ContactSetting
            icon={<Mail className="h-5 w-5" />}
            label="Email"
            value={email}
            onChange={setEmail}
            isPublic={emailPublicToClub}
            onToggle={() => setEmailPublicToClub(current => !current)}
            inputMode="email"
          />

          <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
            <div className="mb-4 flex items-start gap-3">
              <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-indigo-700" />
              <div>
                <h3 className="font-bold text-indigo-950">Private Tournament Details</h3>
                <p className="mt-1 text-sm text-indigo-800">
                  These details are not shown on your public profile. They are available only to you and authorised admins for tournament filtering.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                  <CalendarDays className="h-5 w-5 text-blue-800" />
                  Birthdate (for age)
                </span>
                <input
                  type="date"
                  value={birthDate}
                  max={getNewZealandDate()}
                  onChange={event => setBirthDate(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                  <UsersRound className="h-5 w-5 text-blue-800" />
                  Gender
                </span>
                <select
                  value={gender}
                  onChange={event => setGender(event.target.value as PlayerGender | "")}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Not set</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </label>
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-200 pt-5">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-blue-900 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving…" : "Save Profile Details"}
            </button>
          </div>
        </form>
      )}
      </div>}
    </section>
  );
}

function ContactSetting({
  icon,
  label,
  value,
  onChange,
  isPublic,
  onToggle,
  inputMode,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  isPublic: boolean;
  onToggle: () => void;
  inputMode: "tel" | "email";
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
        <span className="text-blue-800">{icon}</span>
        {label}
      </label>
      <div className="flex flex-col gap-2 md:flex-row">
        <input
          type={inputMode === "email" ? "email" : "tel"}
          inputMode={inputMode}
          value={value}
          onChange={event => onChange(event.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
          placeholder={`Enter your ${label.toLowerCase()}`}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={isPublic}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition md:min-w-52 ${
            isPublic
              ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              : "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100"
          }`}
        >
          {isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          {isPublic ? "Visible to my club" : "Private from my club"}
        </button>
      </div>
    </div>
  );
}
