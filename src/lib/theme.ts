"use client";

import { useSyncExternalStore } from "react";

export type Theme = "dark" | "light";

/** localStorage key holding an explicit choice. Absent = follow the system. */
export const THEME_KEY = "whylog-theme";

/**
 * Pre-paint theme init. Injected as an inline, synchronous script in <head> so
 * the class is on <html> before the first paint — setting it from a client
 * effect instead would flash the wrong palette on every load.
 *
 * Dark is the default (no class); light is opt-in via `.light`, matching the
 * token overrides in globals.css.
 */
export const THEME_INIT_SCRIPT = `(function(){try{
var s=localStorage.getItem(${JSON.stringify(THEME_KEY)});
var l=s==="light"||(!s&&window.matchMedia("(prefers-color-scheme: light)").matches);
if(l)document.documentElement.classList.add("light");
}catch(e){}})();`;

// The DOM class is the single source of truth (the init script sets it before
// React exists), so the store reads from it rather than duplicating state.
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains("light")
    ? "light"
    : "dark";
}

/** Apply and persist an explicit theme choice. */
export function setTheme(next: Theme): void {
  document.documentElement.classList.toggle("light", next === "light");
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    // Private mode / storage disabled: the choice still applies for this page.
  }
  listeners.forEach((l) => l());
}

/**
 * Current theme. Server/first-hydration snapshot is "dark" (the default); the
 * only consumer renders inside a dropdown that opens after hydration, so this
 * can't produce a mismatch.
 */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getSnapshot, () => "dark");
}
