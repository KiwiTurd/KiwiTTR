import { Navigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import LoadingScreen from "../shared/LoadingScreen";

type Role = "admin" | "club_admin" | "player";

type Props = {
  allowedRoles: Role[];
  children: React.ReactNode;
};

export default function RoleRoute({
  allowedRoles,
  children,
}: Props) {
  const { session, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  if (authLoading || profileLoading) {
    return <LoadingScreen label="Loading your profile..." />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
