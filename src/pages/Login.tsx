import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  Mail,
  Lock,
  ArrowRight,
} from "lucide-react";

import { supabase } from "../lib/supabase";

import {
  getProfile,
} from "../services/supabase/profileService";

import { notify } from "../services/notificationService";

import FullLogo from "../assets/KIWITTR - Logo Full.svg?react";
import SeoMetadataManager from "../components/layout/SeoMetadataManager";
import useFormDraftState from "../hooks/useFormDraftState";

export default function Login() {

  const navigate = useNavigate();

  const [email, setEmail] =
    useFormDraftState("auth.login.email", "");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);
  const [resetLoading, setResetLoading] =
    useState(false);

  async function handlePasswordReset() {
    const resetEmail = email.trim();

    if (!resetEmail) {
      notify.timeout("Enter your email address first.");
      return;
    }

    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(
      resetEmail,
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );
    setResetLoading(false);

    if (error) {
      notify.fault(error.message);
      return;
    }

    notify.edgeBall(
      "If an account exists for that email, a password reset link has been sent."
    );
  }

  async function handleLogin() {

    if (
      !email.trim() ||
      !password.trim()
    ) {

      notify.timeout(
        "Please enter your email and password."
      );

      return;

    }

    setLoading(true);

    const {
      data,
      error,
    } =
      await supabase.auth.signInWithPassword({

        email: email.trim(),

        password,

      });

    if (error) {

      setLoading(false);

      notify.fault(error.message);

      return;

    }

    const profile =
      await getProfile(
        data.user.id
      );

    if (
      profile &&
      profile.status === "disabled"
    ) {

      await supabase.auth.signOut();

      setLoading(false);

      notify.fault(
        "Your account has been disabled. Please contact an administrator."
      );

      return;

    }

    setLoading(false);

    notify.welcomeBack();

    navigate("/dashboard");

  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>
  ) {

    if (e.key === "Enter") {

      void handleLogin();

    }

  }

  return (

    <>

    <SeoMetadataManager />

    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-6">

      <div className="w-full max-w-lg">

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">

          <div className="h-2 bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-500" />

          <div className="p-10">

            <div className="flex justify-center">

              <Link
                to="/"
                aria-label="Go to dashboard"
                className="
                  rounded-lg
                  transition

                  hover:opacity-80

                  focus:outline-none
                  focus:ring-4
                  focus:ring-blue-100
                "
              >

                <FullLogo className="h-12 w-auto" />

              </Link>

            </div>

            <div className="mt-8 text-center">

              <h1 className="text-3xl font-normal tracking-tight">

                Welcome back

              </h1>

              <p className="mt-2 text-slate-500">

                Sign in to continue to KiwiTTR.

              </p>

            </div>

            <div className="mt-10 space-y-5">

              <div className="relative">

                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />

                <input
                  type="email"
                  value={email}
                  placeholder="Email Address"
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  onKeyDown={handleKeyDown}
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-300
                    py-3
                    pl-12
                    pr-4
                    outline-none
                    transition

                    focus:border-blue-700
                    focus:ring-4
                    focus:ring-blue-100
                  "
                />

              </div>

              <div className="relative">

                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />

                <input
                  type="password"
                  value={password}
                  placeholder="Password"
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  onKeyDown={handleKeyDown}
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-300
                    py-3
                    pl-12
                    pr-4
                    outline-none
                    transition

                    focus:border-blue-700
                    focus:ring-4
                    focus:ring-blue-100
                  "
                />

              </div>

              <div className="flex justify-end">

                <button
                  type="button"
                  onClick={() => void handlePasswordReset()}
                  disabled={resetLoading}
                  className="
                    text-sm
                    font-medium
                    text-blue-700

                    transition

                    hover:text-blue-900
                  "
                >

                  {resetLoading
                    ? "Sending reset link..."
                    : "Forgot password?"}

                </button>

              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                className="
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-2

                  rounded-xl

                  bg-blue-900

                  py-3.5

                  font-semibold
                  text-white

                  transition-all

                  hover:bg-blue-800
                  hover:scale-[1.01]

                  disabled:cursor-not-allowed
                  disabled:bg-slate-400
                  disabled:hover:scale-100
                "
              >

                {loading
                  ? "Signing In..."
                  : "Sign In"}

                {!loading && (

                  <ArrowRight className="h-5 w-5" />

                )}

              </button>

            </div>

            <div className="mt-8 border-t pt-8 text-center">

              <p className="text-sm text-slate-500">

                Don't have an account?

              </p>

              <Link
                to="/register"
                className="
                  mt-4
                  inline-flex
                  w-full
                  items-center
                  justify-center

                  rounded-xl

                  border
                  border-slate-300

                  py-3

                  font-semibold

                  transition

                  hover:border-blue-700
                  hover:bg-blue-50
                  hover:text-blue-900
                "
              >

                Create Account

              </Link>

            </div>

          </div>

        </div>

        <p className="mt-6 text-center text-xs text-slate-400">

          KiwiTTR v{__APP_VERSION__}

        </p>

      </div>

    </div>

    </>

  );

}
