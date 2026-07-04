import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";

export default function Register() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);

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

    const { error } = await supabase.auth.signUp({
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
      "Your account has been created successfully.\n\nPlease check your email to verify your account before signing in."
    );

    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10">

        <div className="text-center mb-10">

          <h1 className="text-4xl font-bold">
            KiwiTTR
          </h1>

          <p className="text-slate-500 mt-2">
            Create your account
          </p>

        </div>

        <div className="space-y-4">

          <input
            placeholder="First Name"
            value={firstName}
            onChange={(e) =>
              setFirstName(e.target.value)
            }
            className="w-full border rounded-xl p-3"
          />

          <input
            placeholder="Last Name"
            value={lastName}
            onChange={(e) =>
              setLastName(e.target.value)
            }
            className="w-full border rounded-xl p-3"
          />

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="w-full border rounded-xl p-3"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="w-full border rounded-xl p-3"
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            className="w-full border rounded-xl p-3"
          />

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-slate-400 text-white py-3 rounded-xl font-semibold transition"
          >
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>

        </div>

        <div className="mt-8 border-t pt-6 text-center">

          <p className="text-slate-600">
            Already have an account?
          </p>

          <Link
            to="/login"
            className="inline-block mt-3 w-full border border-blue-900 text-blue-900 hover:bg-blue-50 py-3 rounded-xl font-semibold transition"
          >
            Sign In
          </Link>

        </div>

      </div>

    </div>
  );
}