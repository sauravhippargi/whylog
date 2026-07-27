import { redirect } from "next/navigation";

import { auth, signOut } from "@/auth";

export default async function DashboardPage() {
  // Authoritative check: always re-derive the session user server-side rather
  // than trusting the client or the optimistic proxy check (rules.md §2).
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-brass">
          WhyLog
        </span>
        <div className="flex items-center gap-4">
          <span className="hidden font-mono text-xs text-muted sm:inline">
            {session.user.email}
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="rounded-sm border border-white/10 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:border-brass hover:text-brass-light"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-16">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          Dashboard
        </p>
        <h1 className="mt-2 font-serif text-3xl text-parchment">
          Your log is open.
        </h1>
        <p className="mt-3 font-serif text-muted">
          Signed in as{" "}
          <span className="font-mono text-sm text-parchment">
            {session.user.email}
          </span>
          .
        </p>

        <div className="mt-10 rounded-md border border-dashed border-white/10 bg-surface p-10 text-center">
          <p className="font-serif text-muted">
            No projects yet. Project and decision logging arrive in the next
            phase.
          </p>
        </div>
      </main>
    </div>
  );
}
