import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "../components/layout/Sidebar";
import MobileBottomNav from "../components/layout/MobileBottomNav";
import DesktopFooter from "../components/layout/DesktopFooter";
import SeoMetadataManager from "../components/layout/SeoMetadataManager";
import DashboardNotice from "../components/dashboard/DashboardNotice";

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

  const { collapsed } = useSidebar();
  const { pathname } = useLocation();
  const [noticeDraft, setNoticeDraft] = useState({
    title: "",
    message: "",
  });

  return (

    <div className="h-screen bg-slate-100 overflow-hidden">

      <SeoMetadataManager />

      <Sidebar />

      <div
        className={`h-screen overflow-y-auto flex flex-col transition-all duration-300 ${
          collapsed
            ? "md:ml-20"
            : "md:ml-72"
        }`}
      >

        <main className="flex-1 p-4 pb-28 md:p-8">

          <Outlet context={{ noticeDraft, setNoticeDraft }} />

        </main>

        <DesktopFooter />

      </div>

      <MobileBottomNav />

      {pathname === "/" && <DashboardNotice />}

    </div>

  );

}
