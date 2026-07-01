import { createBrowserRouter } from "react-router-dom";

import AppLayout from "./pages/AppLayout";

import Dashboard from "./pages/Dashboard";
import Clubs from "./pages/Clubs";
import Players from "./pages/Players";
import Rankings from "./pages/Rankings";
import Matches from "./pages/Matches";
import Simulator from "./pages/Simulator";
import Settings from "./pages/Settings";
import Events from "./pages/Events";

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
        path: "players",
        element: <Players />,
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