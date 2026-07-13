import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";

import FullLogo from "../assets/KIWITTR - Logo Full.svg?react";
import { supabase } from "../lib/supabase";
import { notify } from "../services/notificationService";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);

  async function updatePassword() {
    if (password.length < 8) {
      notify.timeout("Use a password with at least 8 characters.");
      return;
    }

    if (password !== confirmation) {
      notify.timeout("The passwords do not match.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      notify.fault(
        error.message.includes("session")
          ? "This reset link is invalid or has expired. Request a new link from Sign In."
          : error.message
      );
      return;
    }

    notify.edgeBall("Your password has been updated. You can now sign in.");
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="h-2 bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-500" />
        <div className="p-10">
          <Link to="/" className="flex justify-center" aria-label="KiwiTTR home">
            <FullLogo className="h-12 w-auto" />
          </Link>

          <div className="mt-8 text-center">
            <h1 className="text-3xl font-normal tracking-tight">Choose a new password</h1>
            <p className="mt-2 text-slate-500">
              Enter and confirm the new password for your KiwiTTR account.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {[
              {
                value: password,
                onChange: setPassword,
                placeholder: "New password",
              },
              {
                value: confirmation,
                onChange: setConfirmation,
                placeholder: "Confirm new password",
              },
            ].map(field => (
              <div key={field.placeholder} className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={field.value}
                  placeholder={field.placeholder}
                  autoComplete="new-password"
                  onChange={event => field.onChange(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-3 pl-12 pr-4 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            ))}

            <button
              type="button"
              onClick={() => void updatePassword()}
              disabled={saving}
              className="flex w-full items-center justify-center rounded-xl bg-blue-900 py-3.5 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60"
            >
              {saving ? "Updating password..." : "Update password"}
            </button>

            <Link to="/login" className="block text-center text-sm font-semibold text-blue-700 hover:text-blue-900">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
