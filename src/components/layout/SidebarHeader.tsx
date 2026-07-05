import {
  PanelLeft,
  PanelLeftClose,
} from "lucide-react";

import { useSidebar } from "../../context/SidebarContext";

import FullLogo from "../../assets/KIWITTR - Logo Full.svg?react";
import IconLogo from "../../assets/KIWITTR - Logo.svg?react";

export default function SidebarHeader() {

  const {
    collapsed,
    toggle,
  } = useSidebar();

  return (

    <div className="border-b">

      {collapsed ? (

        <div className="flex flex-col items-center justify-center py-5 gap-4">

          <IconLogo
            className="h-10 w-10"
          />

          <button
            onClick={toggle}
            className="
              rounded-lg
              p-2
              text-slate-600
              hover:bg-slate-100
              hover:text-black
              transition-all
              duration-200
            "
          >
            <PanelLeft className="w-5 h-5" />
          </button>

        </div>

      ) : (

        <div className="h-20 px-4 flex items-center justify-between">

          <FullLogo
            className="h-9 w-auto"
          />

          <button
            onClick={toggle}
            className="
              rounded-lg
              p-2
              text-slate-600
              hover:bg-slate-100
              hover:text-black
              transition-all
              duration-200
            "
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>

        </div>

      )}

    </div>

  );

}