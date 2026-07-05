import type { ReactNode } from "react";

import Sidebar from "./Sidebar";

import { useSidebar } from "../../context/SidebarContext";

type Props = {
  children: ReactNode;
};

export default function Layout({
  children,
}: Props) {

  const { collapsed } = useSidebar();

  return (

    <div className="flex h-screen bg-slate-100">

      <Sidebar />

      <main
        className={`
          flex-1
          overflow-y-auto
          transition-all
          duration-300
          p-8
          ${
            collapsed
              ? "ml-20"
              : "ml-72"
          }
        `}
      >

        {children}

      </main>

    </div>

  );

}