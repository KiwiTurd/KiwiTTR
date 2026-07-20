import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import MobileBottomNav from "../components/layout/MobileBottomNav";
import DesktopFooter from "../components/layout/DesktopFooter";
import SeoMetadataManager from "../components/layout/SeoMetadataManager";
import DashboardNotice from "../components/dashboard/DashboardNotice";
import DesktopHeader from "../components/layout/DesktopHeader";
import Sidebar from "../components/layout/Sidebar";
import FirstLoginWelcome from "../components/onboarding/FirstLoginWelcome";
import { useSidebar } from "../context/SidebarContext";

export type AppLayoutOutletContext = {
  noticeDraft: {
    title: string;
    message: string;
  };
  setNoticeDraft: React.Dispatch<React.SetStateAction<{
    title: string;
    message: string;
  }>>;
};

export default function AppLayout() {

  const { collapsed, navigationLayout } = useSidebar();
  const { pathname } = useLocation();
  const [noticeDraft, setNoticeDraft] = useState({
    title: "",
    message: "",
  });

  return (

    <div className="flex h-screen flex-col overflow-hidden bg-slate-100">

      <SeoMetadataManager />

      {navigationLayout === "header" ? <DesktopHeader /> : <Sidebar />}

      <div
        className={`flex min-h-0 flex-1 flex-col overflow-y-auto transition-[margin] duration-300 ${
          navigationLayout === "sidebar"
            ? collapsed
              ? "md:ml-20"
              : "md:ml-72"
            : ""
        }`}
      >

        <main className="flex-1 p-4 pb-28 md:p-8">

          <Outlet context={{ noticeDraft, setNoticeDraft }} />

        </main>

        <DesktopFooter />

      </div>

      <MobileBottomNav />

      <FirstLoginWelcome />

      {pathname === "/dashboard" && <DashboardNotice />}

    </div>

  );

}
