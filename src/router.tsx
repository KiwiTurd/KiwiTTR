import { createBrowserRouter } from "react-router-dom";

import AppLayout from "./pages/AppLayout";

import Dashboard from "./pages/Dashboard";
import Clubs from "./pages/Clubs";
import ClubProfile from "./pages/ClubProfile";
import PlayerManagement from "./pages/PlayerManagement";
import PlayerProfile from "./pages/PlayerProfile";
import MyProfile from "./pages/MyProfile";
import Rankings from "./pages/Rankings";
import Matches from "./pages/Matches";
import Events from "./pages/Events";
import EventProfile from "./pages/EventProfile";
import Simulator from "./pages/Simulator";
import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Admin from "./pages/Admin";

import AdminRoute from "./components/auth/AdminRoute";

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
        element: <PlayerProfile />,
      },

      {
        path: "my-profile",
        element: <MyProfile />,
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
        path: "simulator",
        element: <Simulator />,
      },

      // Admin Pages

      {
        path: "players",
        element: (
          <AdminRoute>
            <PlayerManagement />
          </AdminRoute>
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
          <AdminRoute>
            <Settings />
          </AdminRoute>
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