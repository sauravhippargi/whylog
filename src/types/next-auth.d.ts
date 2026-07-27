import type { DefaultSession } from "next-auth";

// Expose the user id on the session and JWT so server code can re-derive the
// authenticated user without trusting any client-supplied id (rules.md §2).
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}
