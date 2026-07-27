import type { NextAuthConfig } from "next-auth";

// Base Auth.js config shared between the full server config (auth.ts) and the
// route-protection proxy (proxy.ts). It intentionally contains NO provider that
// imports Prisma/bcrypt, so it stays lightweight everywhere it's used.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    // Optimistic gate used by the proxy. The authoritative check still happens
    // server-side in each protected page/route (see rules.md §2).
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;
      const isProtected =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/projects") ||
        pathname.startsWith("/decisions") ||
        pathname.startsWith("/search");

      if (isProtected) {
        // Returning false triggers a redirect to the configured signIn page.
        return isLoggedIn;
      }

      // Send already-authenticated users away from the auth pages.
      if (isLoggedIn && (nextUrl.pathname === "/login" || nextUrl.pathname === "/signup")) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
    // Persist the user id onto the JWT and expose it on the session.
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
