import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  User,
  Mail,
  Lock,
  ArrowRight,
} from "lucide-react";

import { supabase } from "../lib/supabase";

import FullLogo from "../assets/KIWITTR - Logo Full.svg?react";

export default function Register() {

  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleRegister() {

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {

      alert("Please complete all fields.");

      return;

    }

    if (password !== confirmPassword) {

      alert("Passwords do not match.");

      return;

    }

    setLoading(true);

    const { error } =
      await supabase.auth.signUp({

        email: email.trim(),

        password,

        options: {

          data: {

            first_name: firstName.trim(),

            last_name: lastName.trim(),

          },

        },

      });

    setLoading(false);

    if (error) {

      alert(error.message);

      return;

    }

    alert(
      "Your account has been created.\n\nPlease verify your email before signing in."
    );

    navigate("/login");

  }

  return (

    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-6">

      <div className="w-full max-w-lg">

        <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">

          <div className="h-2 bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-500" />

          <div className="p-10">

            <div className="flex justify-center">

              <FullLogo className="h-12 w-auto" />

            </div>

            <div className="mt-8 text-center">

              <h1 className="text-3xl font-black tracking-tight">

                Create your account

              </h1>

              <p className="mt-2 text-slate-500">

                Join the KiwiTTR rating system.

              </p>

            </div>

            <div className="mt-10 space-y-5">

              <div className="grid grid-cols-2 gap-4">

                <div className="relative">

                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />

                  <input
                    value={firstName}
                    onChange={(e) =>
                      setFirstName(e.target.value)
                    }
                    placeholder="First Name"
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-300
                      bg-white
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

                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />

                  <input
                    value={lastName}
                    onChange={(e) =>
                      setLastName(e.target.value)
                    }
                    placeholder="Last Name"
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-300
                      bg-white
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

              </div>

              <div className="relative">

                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="Email Address"
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
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Password"
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
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder="Confirm Password"
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

              <button
                onClick={handleRegister}
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
                  ? "Creating Account..."
                  : "Create Account"}

                {!loading && (

                  <ArrowRight className="h-5 w-5" />

                )}

              </button>

            </div>

            <div className="mt-8 border-t pt-8 text-center">

              <p className="text-sm text-slate-500">

                Already have an account?

              </p>

              <Link
                to="/login"
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

                Sign In

              </Link>

            </div>

          </div>

        </div>

        <p className="mt-6 text-center text-xs text-slate-400">

          KiwiTTR v{__APP_VERSION__}

        </p>

      </div>

    </div>

  );

}