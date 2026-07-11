import { createBrowserRouter } from "react-router-dom";

import AppLayout from "./pages/AppLayout";

import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";

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
import TeamGames from "./pages/TeamGames";
import TeamMatchType from "./pages/TeamMatchType";
import NewTeamGameEvent from "./pages/NewTeamGameEvent";
import TeamGameLive from "./pages/TeamGameLive";
import TeamGameManage from "./pages/TeamGameManage";

import PlayerManagement from "./pages/PlayerManagement";
import PlayerProfile from "./pages/PlayerProfile";
import MyProfile from "./pages/MyProfile";

import Matches from "./pages/Matches";

import Simulator from "./pages/Simulator";
import FlappyBat from "./pages/FlappyBat";
import About from "./pages/About";
import HowWeCalculate from "./pages/HowWeCalculate";
import SeoMetadataSettings from "./pages/SeoMetadataSettings";
import NoticeSettings from "./pages/NoticeSettings";
import HomepageSettingsPage from "./pages/HomepageSettings";

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
      // Public home and dashboard

      {
        index: true,
        element: <Home />,
      },

      {
        path: "dashboard",
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

      {
        path: "team-games",
        element: (
          <ProtectedRoute>
            <TeamGames />
          </ProtectedRoute>
        ),
      },

      {
        path: "team-games/new",
        element: (
          <RoleRoute allowedRoles={["admin", "club_admin"]}>
            <TeamMatchType />
          </RoleRoute>
        ),
      },

      {
        path: "team-games/new/:format",
        element: (
          <RoleRoute allowedRoles={["admin", "club_admin"]}>
            <NewTeamGameEvent />
          </RoleRoute>
        ),
      },

      {
        path: "team-games/:id/live",
        element: <TeamGameLive />,
      },

      {
        path: "team-games/:id/manage",
        element: (
          <RoleRoute allowedRoles={["admin", "club_admin"]}>
            <TeamGameManage />
          </RoleRoute>
        ),
      },

      // Tools

      {
        path: "simulator",
        element: <Simulator />,
      },

      {
        path: "flappy-bat",
        element: <FlappyBat />,
      },

      // Information

      {
        path: "about",
        element: <About />,
      },

      {
        path: "how-we-calculate",
        element: <HowWeCalculate />,
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
        element: <Settings />,
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
        path: "settings/seo",
        element: (
          <AdminRoute>
            <SeoMetadataSettings />
          </AdminRoute>
        ),
      },

      {
        path: "settings/notices",
        element: (
          <AdminRoute>
            <NoticeSettings />
          </AdminRoute>
        ),
      },

      {
        path: "settings/homepage",
        element: (
          <AdminRoute>
            <HomepageSettingsPage />
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
