import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { Toaster } from "sonner";

import "./index.css";

import { router } from "./router";

import { AuthProvider } from "./context/AuthContext";
import { ProfileProvider } from "./context/ProfileContext";
import { SidebarProvider } from "./context/SidebarContext";
import { TournamentProvider } from "./context/TournamentContext";
import { PageHeaderSettingsProvider } from "./context/PageHeaderSettingsContext";
import LoadingScreen from "./components/shared/LoadingScreen";

createRoot(document.getElementById("root")!).render(
  <StrictMode>

    <AuthProvider>

      <ProfileProvider>

        <TournamentProvider>

          <SidebarProvider>

            <PageHeaderSettingsProvider>

            <Suspense fallback={<LoadingScreen label="Loading page..." />}>
              <RouterProvider router={router} />
            </Suspense>

            <Toaster
              position="bottom-right"
              richColors
              closeButton
              expand
              duration={4000}
            />

            </PageHeaderSettingsProvider>

          </SidebarProvider>

        </TournamentProvider>

      </ProfileProvider>

    </AuthProvider>

  </StrictMode>
);
