import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    navigate("/");
  }

  async function handleSignup() {
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert(
      "Account created successfully. You can now sign in."
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20">

      <div className="bg-white rounded-xl shadow-xl p-8">

        <h1 className="text-4xl font-bold mb-8">
          Login
        </h1>

        <input
          type="email"
          placeholder="Email"

          value={email}

          onChange={(e) =>
            setEmail(e.target.value)
          }

          className="w-full border rounded-lg p-3 mb-4"
        />

        <input
          type="password"
          placeholder="Password"

          value={password}

          onChange={(e) =>
            setPassword(e.target.value)
          }

          className="w-full border rounded-lg p-3 mb-6"
        />

        <button
          onClick={handleLogin}

          disabled={loading}

          className="w-full bg-blue-900 text-white py-3 rounded-lg mb-3"
        >
          Sign In
        </button>

        <button
          onClick={handleSignup}

          disabled={loading}

          className="w-full border py-3 rounded-lg"
        >
          Create Account
        </button>

      </div>

    </div>
  );
}