// Centralized, typed access to environment config.
// Per rules.md §3: URLs come from env vars only — never derived from the
// incoming request origin (no req.headers.host).

/** Absolute base URL of the app (e.g. https://whylog.vercel.app). */
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** Build an absolute URL for a path, always rooted at APP_URL. */
export function absoluteUrl(path = "/"): string {
  return new URL(path, APP_URL).toString();
}
