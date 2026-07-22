/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getPageHeaderSettings,
} from "../services/supabase/pageHeaderSettingsService";
import {
  DEFAULT_PAGE_HEADER_SETTINGS,
  normalizePageHeaderSettings,
  type PageHeaderSettings,
} from "../types/pageHeaderSettings";

type ContextValue = {
  settings: PageHeaderSettings;
  replaceSettings: (settings: PageHeaderSettings) => void;
};

const PageHeaderSettingsContext = createContext<ContextValue | null>(null);

export function PageHeaderSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(DEFAULT_PAGE_HEADER_SETTINGS);

  useEffect(() => {
    let active = true;
    getPageHeaderSettings()
      .then((value) => {
        if (active) setSettings(value);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({
    settings,
    replaceSettings: (next: PageHeaderSettings) => {
      setSettings(normalizePageHeaderSettings(next));
    },
  }), [settings]);

  return (
    <PageHeaderSettingsContext.Provider value={value}>
      {children}
    </PageHeaderSettingsContext.Provider>
  );
}

export function usePageHeaderSettings() {
  const context = useContext(PageHeaderSettingsContext);
  if (!context) {
    throw new Error("usePageHeaderSettings must be used inside PageHeaderSettingsProvider");
  }
  return context;
}
