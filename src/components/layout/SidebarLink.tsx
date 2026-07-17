import {
  type ReactNode,
  useRef,
  useState,
} from "react";

import { NavLink } from "react-router-dom";

type Props = {
  to: string;
  label: string;
  icon: ReactNode;
  collapsed: boolean;
};

export default function SidebarLink({
  to,
  label,
  icon,
  collapsed,
}: Props) {
  const tooltipRef =
    useRef<HTMLDivElement>(null);

  const [visible, setVisible] =
    useState(false);

  function handleMouseMove(
    e: React.MouseEvent<HTMLDivElement>
  ) {
    if (
      !collapsed ||
      !tooltipRef.current
    ) {
      return;
    }

    tooltipRef.current.style.left =
      `${e.clientX + 18}px`;

    tooltipRef.current.style.top =
      `${e.clientY}px`;
  }

  function handleMouseEnter() {
    if (!collapsed) {
      return;
    }

    setVisible(true);
  }

  function handleMouseLeave() {
    setVisible(false);
  }

  return (
    <div
      className="group"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex items-center ${
            collapsed
              ? "justify-center px-0"
              : "gap-3 px-4"
          } py-2.5 rounded-xl font-medium transition-all duration-200 ${
            isActive
              ? "bg-blue-900 text-white"
              : "text-slate-700 hover:bg-slate-100"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <div
              className={`
                transition-all
                duration-200
                ease-out

                group-hover:scale-110
                group-hover:-translate-y-0.5

                ${
                  isActive
                    ? "text-white"
                    : "group-hover:text-black"
                }
              `}
            >
              {icon}
            </div>

            {!collapsed && (
              <span>{label}</span>
            )}
          </>
        )}
      </NavLink>

      {collapsed && (
        <div
          ref={tooltipRef}
          style={{
            opacity: visible ? 1 : 0,
            transform: visible
              ? "translateY(-50%) scale(1)"
              : "translateY(-50%) scale(.95)",
          }}
          className="
            fixed
            pointer-events-none
            z-[99999]

            transition-all
            duration-150
            ease-out
          "
        >
          <div className="relative">

            {/* Arrow */}

            <div
              className="
                absolute
                left-0
                top-1/2

                -translate-x-1
                -translate-y-1/2

                w-3
                h-3

                rotate-45

                bg-slate-900
              "
            />

            {/* Tooltip */}

            <div
              className="
                ml-2

                rounded-xl

                bg-slate-900/95
                backdrop-blur-md

                px-3
                py-2

                text-sm
                font-medium
                text-white

                whitespace-nowrap

                shadow-2xl

                border
                border-slate-700
              "
            >
              {label}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
