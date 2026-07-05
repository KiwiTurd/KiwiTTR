import type { ReactNode } from "react";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

import { useSidebar } from "../../context/SidebarContext";

type Props = {
  children: ReactNode;
};

export default function Layout({
  children,
}: Props) {

  const { collapsed } = useSidebar();

  return (

    <div className="h-screen bg-slate-100 overflow-hidden">

      {/* Sidebar */}

      <Sidebar />

      {/* Main */}

      <div
        className={`h-screen flex flex-col transition-all duration-200 ${
          collapsed
            ? "ml-20"
            : "ml-72"
        }`}
      >

        <Navbar />

        <main className="flex-1 overflow-y-auto p-8">

          {children}

        </main>

      </div>

    </div>

  );

}