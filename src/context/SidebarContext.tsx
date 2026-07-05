import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type SidebarContextType = {
  collapsed: boolean;
  toggle: () => void;
};

const SidebarContext =
  createContext<SidebarContextType>({
    collapsed: false,
    toggle: () => {},
  });

export function SidebarProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  const [collapsed, setCollapsed] =
    useState(false);

  useEffect(() => {

    const saved =
      localStorage.getItem(
        "sidebar-collapsed"
      );

    if (saved !== null) {
      setCollapsed(saved === "true");
    }

  }, []);

  useEffect(() => {

    localStorage.setItem(
      "sidebar-collapsed",
      String(collapsed)
    );

  }, [collapsed]);

  function toggle() {
    setCollapsed((c) => !c);
  }

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        toggle,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );

}

export function useSidebar() {
  return useContext(SidebarContext);
}