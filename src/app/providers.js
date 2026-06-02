"use client";

import { App as AntdApp, ConfigProvider, theme as antdTheme } from "antd";
import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { SessionExpirationWatcher } from "@/components/SessionExpirationWatcher";

const PreferenceContext = createContext(null);
const THEME_STORAGE_KEY = "shramdan-theme";
const LANGUAGE_STORAGE_KEY = "shramdan-language";
const ENTRANCE_ANIMATION_STORAGE_KEY = "shramdan-entrance-animation";
const LIVE_ICON_SIZE_STORAGE_KEY = "shramdan-live-icon-size";
const ACCENT_STORAGE_KEY = "shramdan-accent";
const PREFERENCE_EVENT = "shramdan-preferences";

export const ACCENT_PRESETS = {
  ember: { name: "Ember", color: "#e75f1b" },
  rose: { name: "Rose", color: "#d04668" },
  azure: { name: "Azure", color: "#1d4ed8" },
  violet: { name: "Violet", color: "#7b3fa0" },
  amber: { name: "Amber", color: "#b7791f" }
};

const ACCENT_KEYS = Object.keys(ACCENT_PRESETS);

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

const getStoredEntranceAnimation = () => {
  if (typeof window === "undefined") {
    return true;
  }
  const saved = window.localStorage.getItem(ENTRANCE_ANIMATION_STORAGE_KEY);
  return saved === "off" ? false : true;
};

const getStoredLiveIconSize = () => {
  if (typeof window === "undefined") {
    return "md";
  }
  const saved = window.localStorage.getItem(LIVE_ICON_SIZE_STORAGE_KEY);
  return saved === "sm" || saved === "md" || saved === "lg" ? saved : "md";
};

const getStoredAccent = () => {
  if (typeof window === "undefined") return "ember";
  const saved = window.localStorage.getItem(ACCENT_STORAGE_KEY);
  return ACCENT_KEYS.includes(saved) ? saved : "ember";
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
  const entranceAnimation = useSyncExternalStore(
    subscribePreferences,
    getStoredEntranceAnimation,
    () => true
  );
  const liveIconSize = useSyncExternalStore(
    subscribePreferences,
    getStoredLiveIconSize,
    () => "md"
  );
  const accent = useSyncExternalStore(
    subscribePreferences,
    getStoredAccent,
    () => "ember"
  );

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
      const current = getStoredLanguage();
      const value = typeof nextLanguage === "function" ? nextLanguage(current) : nextLanguage;
      if (value !== "en" && value !== "np") return;
      if (value === current) return;

      const root = typeof document !== "undefined" ? document.documentElement : null;
      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

      if (!root || reduced) {
        updatePreference(LANGUAGE_STORAGE_KEY, value);
        return;
      }

      // Soft crossfade: dim the shell, swap content during the dim, undim.
      // The 160ms dim hides the abrupt content swap; total UX cost ~360ms.
      root.dataset.languageSwitching = "true";
      window.setTimeout(() => {
        updatePreference(LANGUAGE_STORAGE_KEY, value);
        window.setTimeout(() => {
          delete root.dataset.languageSwitching;
        }, 60);
      }, 160);
    },
    [updatePreference]
  );

  const setEntranceAnimation = useCallback(
    (nextValue) => {
      const value =
        typeof nextValue === "function" ? nextValue(getStoredEntranceAnimation()) : nextValue;
      updatePreference(ENTRANCE_ANIMATION_STORAGE_KEY, value ? "on" : "off");
    },
    [updatePreference]
  );

  const setLiveIconSize = useCallback(
    (nextValue) => {
      const value =
        typeof nextValue === "function" ? nextValue(getStoredLiveIconSize()) : nextValue;
      if (value === "sm" || value === "md" || value === "lg") {
        updatePreference(LIVE_ICON_SIZE_STORAGE_KEY, value);
      }
    },
    [updatePreference]
  );

  const setAccent = useCallback(
    (nextValue) => {
      const value =
        typeof nextValue === "function" ? nextValue(getStoredAccent()) : nextValue;
      if (ACCENT_KEYS.includes(value)) {
        updatePreference(ACCENT_STORAGE_KEY, value);
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

  useEffect(() => {
    document.documentElement.dataset.liveIcon = liveIconSize;
  }, [liveIconSize]);

  useEffect(() => {
    const preset = ACCENT_PRESETS[accent] || ACCENT_PRESETS.ember;
    document.documentElement.style.setProperty("--accent", preset.color);
    document.documentElement.dataset.accent = accent;
  }, [accent]);

  const value = useMemo(
    () => ({
      language,
      mode,
      entranceAnimation,
      liveIconSize,
      accent,
      setLanguage,
      setMode,
      setEntranceAnimation,
      setLiveIconSize,
      setAccent,
      toggleLanguage: () => setLanguage((current) => (current === "np" ? "en" : "np")),
      toggleMode: () => setMode((current) => (current === "light" ? "dark" : "light")),
      toggleEntranceAnimation: () => setEntranceAnimation((current) => !current)
    }),
    [
      language,
      mode,
      entranceAnimation,
      liveIconSize,
      accent,
      setLanguage,
      setMode,
      setEntranceAnimation,
      setLiveIconSize,
      setAccent
    ]
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
      <ConfigProvider theme={theme}>
        <AntdApp>
          <SessionExpirationWatcher />
          {children}
        </AntdApp>
      </ConfigProvider>
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
