import { Navigate } from "react-router-dom";

import { useProfile } from "../../context/ProfileContext";
import LoadingScreen from "../shared/LoadingScreen";

export default function AdminRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, loading } = useProfile();

  if (loading) {
    return <LoadingScreen label="Loading your profile..." />;
  }

  if (profile?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
