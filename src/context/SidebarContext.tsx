import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type SidebarContextType = {
  collapsed: boolean;
  toggle: () => void;
  navigationLayout: "sidebar" | "header";
  setNavigationLayout: (layout: "sidebar" | "header") => void;
};

const SidebarContext =
  createContext<SidebarContextType>({
    collapsed: false,
    toggle: () => {},
    navigationLayout: "header",
    setNavigationLayout: () => {},
  });

export function SidebarProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  const [collapsed, setCollapsed] =
    useState(() =>
      localStorage.getItem("sidebar-collapsed") === "true"
    );
  const [navigationLayout, setNavigationLayout] =
    useState<"sidebar" | "header">(() =>
      localStorage.getItem("navigation-layout") === "sidebar"
        ? "sidebar"
        : "header"
    );

  useEffect(() => {

    localStorage.setItem(
      "sidebar-collapsed",
      String(collapsed)
    );

  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem(
      "navigation-layout",
      navigationLayout
    );
  }, [navigationLayout]);

  function toggle() {
    setCollapsed((c) => !c);
  }

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        toggle,
        navigationLayout,
        setNavigationLayout,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );

}

// eslint-disable-next-line react-refresh/only-export-components
export function useSidebar() {
  return useContext(SidebarContext);
}
