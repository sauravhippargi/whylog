import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";

// Next.js 16 renamed `middleware` to `proxy` (runs on the nodejs runtime).
// This provides an optimistic redirect for protected routes via Auth.js's
// `authorized` callback in auth.config.ts. The authoritative session check
// still happens server-side inside each protected page (see rules.md §2).
export const { auth: proxy } = NextAuth(authConfig);

export const config = {
  // Run on app routes only; skip API, static assets, and image optimization.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
