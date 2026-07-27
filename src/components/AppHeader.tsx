import Link from "next/link";

import { signOut } from "@/auth";

type AppHeaderProps = {
  email?: string | null;
  // Optional breadcrumb-style back link shown next to the brand.
  back?: { href: string; label: string };
};

// Shared top bar: brand (→ dashboard), optional back link, email, sign out.
export function AppHeader({ email, back }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="font-mono text-xs uppercase tracking-[0.3em] text-brass"
        >
          WhyLog
        </Link>
        {back && (
          <Link
            href={back.href}
            className="max-w-[40vw] truncate font-mono text-xs text-muted transition-colors hover:text-brass-light"
          >
            ← {back.label}
          </Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        <Link
          href="/search"
          className="font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-brass-light"
        >
          Search
        </Link>
        {email && (
          <span className="hidden font-mono text-xs text-muted sm:inline">
            {email}
          </span>
        )}
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
  );
}
