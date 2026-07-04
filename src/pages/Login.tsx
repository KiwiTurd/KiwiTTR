import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";
import { notify } from "../services/notificationService";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      notify.timeout(
        "Please enter your email and password."
      );
      return;
    }

    setLoading(true);

    const { error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    setLoading(false);

    if (error) {
      notify.fault(error.message);
      return;
    }

    notify.welcomeBack();

    navigate("/");
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (e.key === "Enter") {
      void handleLogin();
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10">

        <div className="text-center mb-10">

          <h1 className="text-4xl font-bold text-slate-900">
            KiwiTTR
          </h1>

          <p className="text-slate-500 mt-2">
            Sign in to your account
          </p>

        </div>

        <div className="space-y-5">

          <div>

            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>

            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              onKeyDown={handleKeyDown}
              className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />

          </div>

          <div>

            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>

            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              onKeyDown={handleKeyDown}
              className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />

          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-slate-400 text-white py-3 rounded-xl font-semibold transition"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

        </div>

        <div className="mt-6 text-center">

          <button
            className="text-sm text-blue-700 hover:underline"
            onClick={() =>
              notify.service(
                "Password reset is coming soon."
              )
            }
          >
            Forgot your password?
          </button>

        </div>

        <div className="mt-10 border-t pt-6 text-center">

          <p className="text-slate-600">
            Don't have an account?
          </p>

          <Link
            to="/register"
            className="inline-block mt-3 w-full border border-blue-900 text-blue-900 hover:bg-blue-50 py-3 rounded-xl font-semibold transition"
          >
            Create Account
          </Link>

        </div>

      </div>

    </div>
  );
}