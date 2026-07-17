import { Building2, Link2Off } from "lucide-react";
import { Link, Navigate } from "react-router-dom";

import useRole from "../hooks/useRole";

export function UnlinkedClubMessage() {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <Link2Off className="h-6 w-6" />
      </span>
      <h1 className="mt-4 text-2xl font-semibold text-slate-900">
        No linked club account
      </h1>
      <p className="mx-auto mt-2 max-w-lg text-slate-500">
        Your KiwiTTR account is not currently linked to a club. Ask your club administrator to connect your account before opening My Club pages.
      </p>
      <Link to="/clubs" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-900 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-800">
        <Building2 className="h-4 w-4" />
        Browse Clubs
      </Link>
    </div>
  );
}

export default function MyClub() {
  const { clubId } = useRole();

  if (!clubId) {
    return <UnlinkedClubMessage />;
  }

  return <Navigate to={`/clubs/${clubId}`} replace />;
}
