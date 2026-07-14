import {
  ChevronDown,
  Eye,
  EyeOff,
  Mail,
  Phone,
  UserRound,
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
  updateOwnPlayerContact,
} from "../../services/supabase/playerService";
import PlayerAvatarUploader from "../player/PlayerAvatarUploader";

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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const loadPlayer = useCallback(async () => {
    if (!playerId) {
      setIsLoading(false);
      return;
    }

    try {
      const player = await getPlayer(playerId);

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
      await updateOwnPlayerContact({
        mobile: mobile.trim(),
        email: email.trim(),
        mobilePublicToClub,
        emailPublicToClub,
      });
      notify.success("Your profile details and club visibility have been saved.");
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
