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

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
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
        path: "players",
        element: <Players />,
      },
      {
        path: "players/:id",
        element: <PlayerProfile />,
      },
      {
        path: "rankings",
        element: <Rankings />,
      },
      {
        path: "matches",
        element: <Matches />,
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
      {
        path: "settings",
        element: <Settings />,
      },
    ],
  },
]);