import type { ReactNode } from "react";

import {
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import { useSidebar } from "../../context/SidebarContext";

type Props = {
  title: string;
  icon: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
};

export default function SidebarSection({
  title,
  icon,
  open,
  onToggle,
  children,
}: Props) {
  const { collapsed } = useSidebar();

  return (
    <div className="mb-2">

      <button
        onClick={onToggle}
        className={`
          flex
          w-full
          items-center
          ${
            collapsed
              ? "justify-center"
              : "justify-between"
          }

          rounded-xl

          px-4
          py-2

          text-xs
          font-semibold
          uppercase
          tracking-wider

          text-slate-500

          hover:bg-slate-100
          hover:text-slate-700

          transition-all
          duration-200
        `}
      >

        <div
          className={`flex items-center ${
            collapsed
              ? ""
              : "gap-2"
          }`}
        >

          <div
            className="
              transition-all
              duration-200
              group-hover:scale-110
            "
          >
            {icon}
          </div>

          {!collapsed && (
            <span>{title}</span>
          )}

        </div>

        {!collapsed && (

          open ? (

            <ChevronDown
              className="w-4 h-4"
            />

          ) : (

            <ChevronRight
              className="w-4 h-4"
            />

          )

        )}

      </button>

      <div
        className={`
          overflow-hidden
          transition-all
          duration-300
          ${
            open
              ? "max-h-96 mt-1 opacity-100"
              : "max-h-0 opacity-0"
          }
        `}
      >

        <div className="space-y-0.5">

          {children}

        </div>

      </div>

    </div>
  );
}
