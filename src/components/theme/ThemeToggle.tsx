"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

/** Header button: switches between light and dark (the full choice, incl. "System", is in Settings). */
export function ThemeToggle() {
  const { resolved, toggleTheme } = useTheme();
  const dark = resolved === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="icon-button"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
    >
      {dark ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
    </button>
  );
}
