import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { Toaster } from "sonner";

import "./index.css";

import { router } from "./router";

import { AuthProvider } from "./context/AuthContext";
import { ProfileProvider } from "./context/ProfileContext";
import { SidebarProvider } from "./context/SidebarContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>

    <AuthProvider>

      <ProfileProvider>

        <SidebarProvider>

          <RouterProvider router={router} />

          <Toaster
            position="bottom-right"
            richColors
            closeButton
            expand
            duration={4000}
          />

        </SidebarProvider>

      </ProfileProvider>

    </AuthProvider>

  </StrictMode>
);