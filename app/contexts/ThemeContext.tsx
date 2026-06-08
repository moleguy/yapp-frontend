"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemeSetting = "light" | "dark" | "system";

const STORAGE_KEY = "yapp-theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(setting: ThemeSetting): "light" | "dark" {
  return setting === "system" ? getSystemTheme() : setting;
}

function applyTheme(setting: ThemeSetting) {
  const resolved = resolveTheme(setting);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.dataset.theme = resolved;
}

type ThemeContextValue = {
  theme: ThemeSetting;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeSetting) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeSetting>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeSetting | null;
    const initial =
      stored && (stored === "light" || stored === "dark" || stored === "system")
        ? stored
        : "system";
    setThemeState(initial);
    applyTheme(initial);
    setResolvedTheme(resolveTheme(initial));

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      const current =
        (localStorage.getItem(STORAGE_KEY) as ThemeSetting | null) ?? "system";
      if (current === "system") {
        applyTheme("system");
        setResolvedTheme(getSystemTheme());
      }
    };
    mq.addEventListener("change", onSystemChange);
    return () => mq.removeEventListener("change", onSystemChange);
  }, []);

  const setTheme = useCallback((next: ThemeSetting) => {
    localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
    applyTheme(next);
    setResolvedTheme(resolveTheme(next));
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}

/** Labels shown in ThemeDropDown */
export const THEME_LABELS: Record<ThemeSetting, string> = {
  system: "System Default",
  light: "Light",
  dark: "Dark",
};

export function themeLabelToSetting(label: string): ThemeSetting {
  if (label === "Light") return "light";
  if (label === "Dark") return "dark";
  return "system";
}

export function themeSettingToLabel(setting: ThemeSetting): string {
  return THEME_LABELS[setting];
}
