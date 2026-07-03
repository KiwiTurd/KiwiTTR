import { Navigate } from "react-router-dom";

import { useProfile } from "../../context/ProfileContext";

export default function AdminRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <div className="p-10">
        Loading...
      </div>
    );
  }

  if (profile?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}