import { Outlet } from "react-router-dom";

import Sidebar from "../components/layout/Sidebar";

import { useSidebar } from "../context/SidebarContext";

export default function AppLayout() {

  const { collapsed } = useSidebar();

  return (

    <div className="h-screen bg-slate-100 overflow-hidden">

      <Sidebar />

      <div
        className={`h-screen flex flex-col transition-all duration-300 ${
          collapsed
            ? "ml-20"
            : "ml-72"
        }`}
      >

        <main className="flex-1 overflow-y-auto p-8">

          <Outlet />

        </main>

      </div>

    </div>

  );

}