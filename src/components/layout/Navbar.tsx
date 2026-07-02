import { Link, useNavigate } from "react-router-dom";

import { supabase } from "../../lib/supabase";

import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";

export default function Navbar() {
  const { session, loading } = useAuth();
  const { profile } = useProfile();

  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <header className="h-16 bg-blue-950 text-white flex items-center justify-between px-8 shadow">

      <Link
        to="/"
        className="text-2xl font-bold hover:text-blue-200 transition"
      >
        🏓 KiwiTTR
      </Link>

      {loading ? (

        <div className="text-sm">
          Loading...
        </div>

      ) : session ? (

        <div className="flex items-center gap-6">

          <div className="text-right">

            <p className="text-xs text-blue-200">
              Signed in as
            </p>

            <p className="font-semibold">
              {session.user.email}
            </p>

            <p className="text-xs text-slate-300 capitalize">
              {profile ? profile.role : "No profile"}
            </p>

          </div>

          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition"
          >
            Logout
          </button>

        </div>

      ) : (

        <Link
          to="/login"
          className="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-lg transition"
        >
          Login
        </Link>

      )}

    </header>
  );
}