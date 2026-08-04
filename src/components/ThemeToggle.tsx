"use client";

import { setTheme, useTheme } from "@/lib/theme";

// Segmented dark/light control for the account dropdown. Both options are
// always visible so the current mode is legible at a glance rather than being
// implied by an icon.
export function ThemeToggle() {
  const theme = useTheme();

  return (
    <div className="tb-theme" role="group" aria-label="Theme">
      <span className="tb-theme-label">Theme</span>
      <span className="tb-theme-options">
        <button
          type="button"
          className={theme === "dark" ? "on" : undefined}
          aria-pressed={theme === "dark"}
          onClick={() => setTheme("dark")}
        >
          Dark
        </button>
        <button
          type="button"
          className={theme === "light" ? "on" : undefined}
          aria-pressed={theme === "light"}
          onClick={() => setTheme("light")}
        >
          Light
        </button>
      </span>
    </div>
  );
}
