import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoadingScreen from "../shared/LoadingScreen";

type Props = {
  children: React.ReactNode;
};

export default function ProtectedRoute({
  children,
}: Props) {
  const { session, loading } = useAuth();

  if (loading) {
    return <LoadingScreen label="Checking your session..." />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
