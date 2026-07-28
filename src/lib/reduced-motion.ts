import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

// Read the user's reduced-motion preference during render. SSR and the first
// hydration return false (assume motion), then the client re-syncs — the
// documented useSyncExternalStore pattern, which avoids both a hydration
// mismatch and any set-state-in-effect.
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
