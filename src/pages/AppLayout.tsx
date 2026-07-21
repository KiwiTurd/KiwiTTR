import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
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
  const showMobilePageSubheadings =
    pathname === "/" ||
    pathname === "/about" ||
    pathname === "/how-we-calculate";
  const mainRef = useRef<HTMLElement>(null);
  const [noticeDraft, setNoticeDraft] = useState({
    title: "",
    message: "",
  });

  useEffect(() => {
    const main = mainRef.current;
    if (!main || showMobilePageSubheadings) return;
    const mainElement = main;

    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const selector = "h1 + p, h1 + div";

    function updateSubheadings() {
      mainElement.querySelectorAll<HTMLElement>(selector).forEach((subheading) => {
        const alwaysVisible =
          subheading.dataset.mobileSubheadingAlwaysVisible === "true";

        if (mobileQuery.matches && !alwaysVisible) {
          subheading.dataset.mobilePageSubheading = "true";
          subheading.setAttribute("role", "button");
          subheading.setAttribute("tabindex", "0");
          subheading.setAttribute("aria-label", "Show page description");
          subheading.setAttribute(
            "aria-expanded",
            subheading.dataset.mobileSubheadingOpen === "true" ? "true" : "false"
          );
        } else {
          delete subheading.dataset.mobilePageSubheading;
          delete subheading.dataset.mobileSubheadingOpen;
          subheading.removeAttribute("role");
          subheading.removeAttribute("tabindex");
          subheading.removeAttribute("aria-label");
          subheading.removeAttribute("aria-expanded");
        }
      });
    }

    updateSubheadings();

    const observer = new MutationObserver(updateSubheadings);
    observer.observe(mainElement, { childList: true, subtree: true });
    mobileQuery.addEventListener("change", updateSubheadings);

    return () => {
      observer.disconnect();
      mobileQuery.removeEventListener("change", updateSubheadings);
    };
  }, [pathname, showMobilePageSubheadings]);

  function toggleMobileSubheading(subheading: HTMLElement) {
    const isOpen = subheading.dataset.mobileSubheadingOpen === "true";

    mainRef.current
      ?.querySelectorAll<HTMLElement>("[data-mobile-subheading-open='true']")
      .forEach((element) => {
        delete element.dataset.mobileSubheadingOpen;
        element.setAttribute("aria-expanded", "false");
      });

    if (!isOpen) {
      subheading.dataset.mobileSubheadingOpen = "true";
      subheading.setAttribute("aria-expanded", "true");
    }
  }

  function handleMainClick(event: ReactMouseEvent<HTMLElement>) {
    const target = event.target as Element;
    const subheading = target.closest<HTMLElement>(
      "[data-mobile-page-subheading='true']"
    );

    if (subheading) toggleMobileSubheading(subheading);
  }

  function handleMainKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    const target = event.target as HTMLElement;

    if (target.dataset.mobilePageSubheading !== "true") return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleMobileSubheading(target);
    } else if (event.key === "Escape") {
      delete target.dataset.mobileSubheadingOpen;
      target.setAttribute("aria-expanded", "false");
    }
  }

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

        <main
          ref={mainRef}
          onClick={handleMainClick}
          onKeyDown={handleMainKeyDown}
          className={`flex-1 p-4 pb-28 md:p-8 ${
            showMobilePageSubheadings ? "" : "mobile-hide-page-subheadings"
          }`}
        >

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
