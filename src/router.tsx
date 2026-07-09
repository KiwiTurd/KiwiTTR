import { createBrowserRouter } from "react-router-dom";

import AppLayout from "./pages/AppLayout";

import Dashboard from "./pages/Dashboard";

import Clubs from "./pages/Clubs";
import ClubProfile from "./pages/ClubProfile";

import Rankings from "./pages/Rankings";

import Events from "./pages/Events";
import EventProfile from "./pages/EventProfile";

import TournamentCentre from "./pages/TournamentCentre";
import NewTournament from "./pages/NewTournament";
import TournamentPlayerSelection from "./pages/TournamentPlayerSelection";
import TournamentLive from "./pages/TournamentLive";
import TournamentViewer from "./pages/TournamentViewer";

import PlayerManagement from "./pages/PlayerManagement";
import PlayerProfile from "./pages/PlayerProfile";
import MyProfile from "./pages/MyProfile";

import Matches from "./pages/Matches";

import Simulator from "./pages/Simulator";

import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import ClubSettings from "./pages/ClubSettings";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Admin from "./pages/Admin";

import AdminRoute from "./components/auth/AdminRoute";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleRoute from "./components/auth/RoleRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },

  {
    path: "/register",
    element: <Register />,
  },

  {
    path: "/",
    element: <AppLayout />,
    children: [
      // Dashboard

      {
        index: true,
        element: <Dashboard />,
      },

      // Public Pages

      {
        path: "rankings",
        element: <Rankings />,
      },

      {
        path: "clubs",
        element: <Clubs />,
      },

      {
        path: "clubs/:id",
        element: <ClubProfile />,
      },

      {
        path: "players/:id",
        element: (
          <ProtectedRoute>
            <PlayerProfile />
          </ProtectedRoute>
        ),
      },

      {
        path: "my-profile",
        element: (
          <ProtectedRoute>
            <MyProfile />
          </ProtectedRoute>
        ),
      },

      {
        path: "events",
        element: <Events />,
      },

      {
        path: "events/:id",
        element: <EventProfile />,
      },

      {
        path: "tournaments",
        element: (
          <ProtectedRoute>
            <TournamentCentre />
          </ProtectedRoute>
        ),
      },

      // Tournament Wizard

      {
        path: "tournaments/new",
        element: (
          <RoleRoute allowedRoles={["admin", "club_admin"]}>
            <NewTournament />
          </RoleRoute>
        ),
      },

      {
        path: "tournaments/players",
        element: (
          <RoleRoute allowedRoles={["admin", "club_admin"]}>
            <TournamentPlayerSelection />
          </RoleRoute>
        ),
      },

      {
  path: "tournaments/live",
  element: (
    <RoleRoute allowedRoles={["admin", "club_admin"]}>
      <TournamentLive />
    </RoleRoute>
  ),
},

      {
        path: "tournaments/viewer",
        element: <TournamentViewer />,
      },

      {
        path: "tournaments/:id/live",
        element: (
          <RoleRoute allowedRoles={["admin", "club_admin"]}>
            <TournamentLive />
          </RoleRoute>
        ),
      },

      {
        path: "tournaments/:id/viewer",
        element: <TournamentViewer />,
      },

      // Tools

      {
        path: "simulator",
        element: <Simulator />,
      },

      // Admin Pages

      {
        path: "players",
        element: (
          <ProtectedRoute>
            <PlayerManagement />
          </ProtectedRoute>
        ),
      },

      {
        path: "matches",
        element: (
          <AdminRoute>
            <Matches />
          </AdminRoute>
        ),
      },

      {
        path: "settings",
        element: (
          <RoleRoute allowedRoles={["admin", "club_admin"]}>
            <Settings />
          </RoleRoute>
        ),
      },

      {
        path: "settings/club",
        element: (
          <RoleRoute allowedRoles={["admin", "club_admin"]}>
            <ClubSettings />
          </RoleRoute>
        ),
      },

      {
        path: "settings/users",
        element: (
          <AdminRoute>
            <UserManagement />
          </AdminRoute>
        ),
      },

      {
        path: "admin",
        element: (
          <AdminRoute>
            <Admin />
          </AdminRoute>
        ),
      },
    ],
  },
]);
