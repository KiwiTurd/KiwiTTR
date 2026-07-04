import { Link } from "react-router-dom";

import useRole from "../hooks/useRole";

export default function Settings() {
  const { isAdmin } = useRole();

  return (
    <div className="max-w-6xl mx-auto">

      <h1 className="text-4xl font-bold mb-8">
        Settings
      </h1>

      <div className="grid gap-6">

        {isAdmin && (
          <Link
            to="/settings/users"
            className="bg-white rounded-xl shadow p-6 hover:bg-slate-50 transition border"
          >
            <h2 className="text-2xl font-bold">
              👥 User Management
            </h2>

            <p className="text-slate-500 mt-2">
              Promote users, assign club leaders and manage member permissions.
            </p>
          </Link>
        )}

        <div className="bg-white rounded-xl shadow p-6 border opacity-60">

          <h2 className="text-2xl font-bold">
            🏓 Competition Settings
          </h2>

          <p className="text-slate-500 mt-2">
            Coming Soon
          </p>

        </div>

        <div className="bg-white rounded-xl shadow p-6 border opacity-60">

          <h2 className="text-2xl font-bold">
            🗄 Database
          </h2>

          <p className="text-slate-500 mt-2">
            Coming Soon
          </p>

        </div>

      </div>

    </div>
  );
}