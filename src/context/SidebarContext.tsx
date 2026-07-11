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
    navigationLayout: "sidebar",
    setNavigationLayout: () => {},
  });

export function SidebarProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  const [collapsed, setCollapsed] =
    useState(false);
  const [navigationLayout, setNavigationLayout] =
    useState<"sidebar" | "header">("sidebar");

  useEffect(() => {

    const saved =
      localStorage.getItem(
        "sidebar-collapsed"
      );

    if (saved !== null) {
      setCollapsed(saved === "true");
    }

    const savedLayout =
      localStorage.getItem("navigation-layout");

    if (savedLayout === "header") {
      setNavigationLayout("header");
    }

  }, []);

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

export function useSidebar() {
  return useContext(SidebarContext);
}
