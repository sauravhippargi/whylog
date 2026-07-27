import { auth } from "@/auth";

// Re-derive the authenticated user id from the Auth.js session server-side.
// Never trust a client-supplied id (rules.md §2) — every route/page resolves
// the current user through this, then passes the id to the ownership helpers.
export async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
