import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AuthForm } from "@/components/AuthForm";

export default async function LoginPage() {
  // Re-derive the session server-side; already-authenticated users skip the form.
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-md border border-white/10 bg-surface p-8">
        <Image
          src="/logo-mark.png"
          alt=""
          width={40}
          height={40}
          className="mb-3 h-10 w-10"
          priority
        />
        <p className="font-mono text-xs uppercase tracking-widest text-brass">
          WhyLog
        </p>
        <h1 className="mt-2 font-serif text-2xl text-parchment">Sign in</h1>
        <p className="mb-6 mt-1 font-mono text-xs text-muted">
          Access your decision log.
        </p>

        <AuthForm mode="login" />

        <p className="mt-6 font-mono text-xs text-muted">
          No account?{" "}
          <Link href="/signup" className="text-brass-light hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
