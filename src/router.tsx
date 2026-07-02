import { createBrowserRouter } from "react-router-dom";

import AppLayout from "./pages/AppLayout";

import Dashboard from "./pages/Dashboard";
import Clubs from "./pages/Clubs";
import ClubProfile from "./pages/ClubProfile";
import Players from "./pages/Players";
import PlayerProfile from "./pages/PlayerProfile";
import Rankings from "./pages/Rankings";
import Matches from "./pages/Matches";
import Events from "./pages/Events";
import EventProfile from "./pages/EventProfile";
import Simulator from "./pages/Simulator";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Admin from "./pages/Admin";

import ProtectedRoute from "./components/auth/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "admin",
        element: (
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        ),
      },
      {
        path: "clubs",
        element: (
          <ProtectedRoute>
            <Clubs />
          </ProtectedRoute>
        ),
      },
      {
        path: "clubs/:id",
        element: (
          <ProtectedRoute>
            <ClubProfile />
          </ProtectedRoute>
        ),
      },
      {
        path: "players",
        element: (
          <ProtectedRoute>
            <Players />
          </ProtectedRoute>
        ),
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
        path: "rankings",
        element: <Rankings />,
      },
      {
        path: "matches",
        element: (
          <ProtectedRoute>
            <Matches />
          </ProtectedRoute>
        ),
      },
      {
        path: "events",
        element: (
          <ProtectedRoute>
            <Events />
          </ProtectedRoute>
        ),
      },
      {
        path: "events/:id",
        element: (
          <ProtectedRoute>
            <EventProfile />
          </ProtectedRoute>
        ),
      },
      {
        path: "simulator",
        element: <Simulator />,
      },
      {
        path: "settings",
        element: (
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);