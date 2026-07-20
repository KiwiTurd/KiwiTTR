import { useCallback, useState } from "react";
import {
  Building2,
  LayoutDashboard,
  Trophy,
  UserRound,
} from "lucide-react";

import FullLogo from "../../assets/KIWITTR - Logo Full.svg?react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import {
  WELCOME_NOTICE_PENDING_KEY,
  WELCOME_NOTICE_SEEN_KEY,
} from "../../constants/welcomeNotice";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

const overviewItems = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    description: "See your key stats, recent results, notices, and useful shortcuts.",
    iconClassName: "bg-slate-100 text-slate-700",
  },
  {
    icon: Building2,
    title: "Club areas",
    description: "View your club, its players, club events, and team competitions.",
    iconClassName: "bg-slate-100 text-slate-700",
  },
  {
    icon: UserRound,
    title: "My profile",
    description: "Check your rating history, results, club ranking, and account details.",
    iconClassName: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: Trophy,
    title: "Competition areas",
    description: "Find events and tournaments, follow live draws, and review results.",
    iconClassName: "bg-amber-100 text-amber-700",
  },
];

export default function FirstLoginWelcome() {
  const { session, loading } = useAuth();
  const [dismissedUserId, setDismissedUserId] = useState<string | null>(null);

  const firstLoginOpen = Boolean(
    !loading &&
    session &&
    session.user.user_metadata?.[WELCOME_NOTICE_PENDING_KEY] === true &&
    !session.user.user_metadata?.[WELCOME_NOTICE_SEEN_KEY] &&
    dismissedUserId !== session.user.id
  );

  const dismiss = useCallback(async () => {
    if (!session) {
      return;
    }

    setDismissedUserId(session.user.id);

    const { error } = await supabase.auth.updateUser({
      data: {
        [WELCOME_NOTICE_PENDING_KEY]: false,
        [WELCOME_NOTICE_SEEN_KEY]: new Date().toISOString(),
      },
    });

    if (error) {
      console.error("Unable to save welcome notice status:", error);
    }
  }, [session]);

  return (
    <Dialog
      open={firstLoginOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          void dismiss();
        }
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <FullLogo className="mb-3 h-10 w-auto self-start" />
          <DialogTitle className="text-2xl font-bold text-slate-950">
            Welcome to your local Table Tennis Hub
          </DialogTitle>
          <DialogDescription className="text-base leading-6 text-slate-600">
            Here is a quick guide to help you find your way around.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-slate-300 bg-slate-100 p-4 text-sm leading-6 text-slate-900">
          <p className="font-bold">Your player profile will be connected soon</p>
          <p className="mt-1 text-slate-600">
            An administrator will connect your account with your player profile.
            Once linked, your personal ratings, matches, and club information will
            appear automatically.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {overviewItems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.iconClassName}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-950">{item.title}</h3>
                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => void dismiss()}
            className="w-full rounded-xl bg-slate-800 px-5 py-3 font-bold text-white transition hover:bg-slate-700 sm:w-auto"
          >
            Start exploring
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
