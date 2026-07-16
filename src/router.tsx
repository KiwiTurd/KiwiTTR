import { createBrowserRouter } from "react-router-dom";

import AppLayout from "./pages/AppLayout";

import AdminRoute from "./components/auth/AdminRoute";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleRoute from "./components/auth/RoleRoute";
import {
  About,
  Admin,
  ClubProfile,
  Clubs,
  ClubSettings,
  Dashboard,
  EventProfile,
  Events,
  FlappyBat,
  Home,
  HomepageSettingsPage,
  HowWeCalculate,
  Login,
  Matches,
  MultiLiveViewer,
  MyProfile,
  NewTeamGameEvent,
  NewTournament,
  NoticeSettings,
  PlayerManagement,
  PlayerProfile,
  Rankings,
  Register,
  ResetPassword,
  SeoMetadataSettings,
  Settings,
  Simulator,
  TeamGameLive,
  TeamGameManage,
  TeamGames,
  TeamMatchType,
  TournamentCentre,
  TournamentLive,
  TournamentPlayerSelection,
  TournamentViewer,
  UserManagement,
} from "./lazyPages";

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
    path: "/reset-password",
    element: <ResetPassword />,
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
        path: "tournaments/multi-viewer",
        element: <MultiLiveViewer />,
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
          <RoleRoute allowedRoles={["admin", "club_admin"]}>
            <Matches />
          </RoleRoute>
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
