"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type ThemeChoice = "light" | "dark" | "system";
export type FontSize = "small" | "medium" | "large";

export type Preferences = {
  theme: ThemeChoice;
  fontSize: FontSize;
  /** Show a browser notification when a new notification arrives while the tab is in the background. */
  desktopNotifications: boolean;
};

const STORAGE_KEY = "devforum.prefs";

const DEFAULTS: Preferences = {
  theme: "system",
  fontSize: "medium",
  desktopNotifications: false,
};

type ThemeContextValue = {
  prefs: Preferences;
  /** The theme that is actually shown ("system" resolved against the OS setting). */
  resolved: "light" | "dark";
  setPrefs: (patch: Partial<Preferences>) => void;
  /** Quick switch for the header button: light <-> dark. */
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readPrefs(): Preferences {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Writes the preferences onto <html>: the "dark" class and the text-size attribute. */
function apply(prefs: Preferences) {
  const dark = prefs.theme === "dark" || (prefs.theme === "system" && systemPrefersDark());
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.dataset.font = prefs.fontSize;
  return dark ? "dark" : "light";
}

/**
 * Appearance preferences (theme, text size, desktop notifications), stored in this browser.
 * The inline script in app/layout.tsx applies them before the first paint, so there is no
 * flash of the wrong theme; this provider takes over after hydration.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefsState] = useState<Preferences>(DEFAULTS);
  const [resolved, setResolved] = useState<"light" | "dark">("light");
  // Always the latest value, so setPrefs never has to run side effects inside a state updater.
  const latest = useRef<Preferences>(DEFAULTS);

  // Load what was saved, then keep <html> in sync.
  useEffect(() => {
    const saved = readPrefs();
    latest.current = saved;
    setPrefsState(saved);
    setResolved(apply(saved));
  }, []);

  // "System" follows the OS live (e.g. automatic dark mode at night).
  useEffect(() => {
    if (prefs.theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolved(apply(prefs));
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [prefs]);

  const setPrefs = useCallback((patch: Partial<Preferences>) => {
    const next = { ...latest.current, ...patch };
    latest.current = next;
    setPrefsState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* private mode: the choice just lasts for this visit */
    }
    setResolved(apply(next));
  }, []);

  const toggleTheme = useCallback(() => {
    setPrefs({ theme: resolved === "dark" ? "light" : "dark" });
  }, [resolved, setPrefs]);

  const value = useMemo(
    () => ({ prefs, resolved, setPrefs, toggleTheme }),
    [prefs, resolved, setPrefs, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside <ThemeProvider>");
  return context;
}

/**
 * Runs in <head> before React: applies the saved theme immediately.
 * Keep it dependency-free and tiny - it is injected as a string.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem("${STORAGE_KEY}")||"{}");var t=p.theme||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;if(d)r.classList.add("dark");r.dataset.font=p.fontSize||"medium";}catch(e){}})();`;
