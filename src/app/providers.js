"use client";

import { ConfigProvider, theme as antdTheme } from "antd";
import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";

const PreferenceContext = createContext(null);
const THEME_STORAGE_KEY = "shramdan-theme";
const LANGUAGE_STORAGE_KEY = "shramdan-language";
const PREFERENCE_EVENT = "shramdan-preferences";

const getStoredMode = () => {
  if (typeof window === "undefined") {
    return "light";
  }

  const savedMode = window.localStorage.getItem(THEME_STORAGE_KEY);
  return savedMode === "dark" || savedMode === "light" ? savedMode : "light";
};

const getStoredLanguage = () => {
  if (typeof window === "undefined") {
    return "np";
  }

  const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return savedLanguage === "en" || savedLanguage === "np" ? savedLanguage : "np";
};

const subscribePreferences = (callback) => {
  window.addEventListener("storage", callback);
  window.addEventListener(PREFERENCE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(PREFERENCE_EVENT, callback);
  };
};

const baseTheme = {
  token: {
    colorPrimary: "#176b5c",
    colorInfo: "#176b5c",
    colorSuccess: "#2e7d32",
    colorWarning: "#b7791f",
    colorError: "#b42318",
    borderRadius: 8,
    fontFamily: "var(--font-nunito), var(--font-baloo-2), ui-sans-serif, system-ui, sans-serif"
  },
  components: {
    Button: {
      controlHeight: 40,
      borderRadius: 8
    },
    Card: {
      borderRadiusLG: 8
    },
    Tag: {
      borderRadiusSM: 999
    }
  }
};

export function Providers({ children }) {
  const mode = useSyncExternalStore(subscribePreferences, getStoredMode, () => "light");
  const language = useSyncExternalStore(subscribePreferences, getStoredLanguage, () => "np");

  const updatePreference = useCallback((key, value) => {
    window.localStorage.setItem(key, value);
    window.dispatchEvent(new Event(PREFERENCE_EVENT));
  }, []);

  const setMode = useCallback(
    (nextMode) => {
      const value = typeof nextMode === "function" ? nextMode(getStoredMode()) : nextMode;

      if (value === "dark" || value === "light") {
        updatePreference(THEME_STORAGE_KEY, value);
      }
    },
    [updatePreference]
  );

  const setLanguage = useCallback(
    (nextLanguage) => {
      const value = typeof nextLanguage === "function" ? nextLanguage(getStoredLanguage()) : nextLanguage;

      if (value === "en" || value === "np") {
        updatePreference(LANGUAGE_STORAGE_KEY, value);
      }
    },
    [updatePreference]
  );

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  useEffect(() => {
    document.documentElement.lang = language === "np" ? "ne" : "en";
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      mode,
      setLanguage,
      toggleLanguage: () => setLanguage((current) => (current === "np" ? "en" : "np")),
      toggleMode: () => setMode((current) => (current === "light" ? "dark" : "light"))
    }),
    [language, mode, setLanguage, setMode]
  );

  const theme = useMemo(
    () => ({
      ...baseTheme,
      algorithm: mode === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm
    }),
    [mode]
  );

  return (
    <PreferenceContext.Provider value={value}>
      <ConfigProvider theme={theme}>{children}</ConfigProvider>
    </PreferenceContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferenceContext);

  if (!context) {
    throw new Error("usePreferences must be used inside Providers");
  }

  return context;
}
