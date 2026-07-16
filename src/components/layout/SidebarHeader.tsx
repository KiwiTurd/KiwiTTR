import {
  PanelLeft,
  PanelLeftClose,
} from "lucide-react";

import { Link } from "react-router-dom";

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

          <Link
            to="/"
            aria-label="Go to dashboard"
            className="rounded-lg transition hover:opacity-80 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            <IconLogo
              className="h-10 w-10"
            />
          </Link>

          <button
            type="button"
            onClick={toggle}
            aria-label="Expand navigation sidebar"
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
            <PanelLeft aria-hidden="true" className="w-5 h-5" />
          </button>

        </div>

      ) : (

        <div className="h-20 px-4 flex items-center justify-between">

          <Link
            to="/"
            aria-label="Go to dashboard"
            className="rounded-lg transition hover:opacity-80 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            <FullLogo
              className="h-9 w-auto"
            />
          </Link>

          <button
            type="button"
            onClick={toggle}
            aria-label="Collapse navigation sidebar"
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
            <PanelLeftClose aria-hidden="true" className="w-5 h-5" />
          </button>

        </div>

      )}

    </div>

  );

}
