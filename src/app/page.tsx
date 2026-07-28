import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-16 text-center">
      <div className="max-w-xl">
        <Image
          src="/logo.png"
          alt="WhyLog"
          width={160}
          height={160}
          className="mx-auto mb-2 h-32 w-32 sm:h-40 sm:w-40"
          priority
        />
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">
          WhyLog
        </p>
        <h1 className="mt-4 font-serif text-4xl leading-tight text-parchment sm:text-5xl">
          The record of why.
        </h1>
        <p className="mt-4 font-serif text-lg text-muted">
          A searchable log of the decisions you&apos;ve made — what was decided,
          the alternatives, and the reasoning — so the &ldquo;why&rdquo; is never
          lost to a stale doc or someone&apos;s memory.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/signup"
          className="rounded-sm bg-brass px-5 py-2 font-mono text-sm font-medium uppercase tracking-widest text-ink transition-opacity hover:opacity-90"
        >
          Create account
        </Link>
        <Link
          href="/login"
          className="rounded-sm border border-brass/40 px-5 py-2 font-mono text-sm font-medium uppercase tracking-widest text-brass-light transition-colors hover:border-brass"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
