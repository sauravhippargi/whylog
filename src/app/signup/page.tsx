import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AuthForm } from "@/components/AuthForm";

export default async function SignupPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-md border border-white/10 bg-surface p-8">
        <p className="font-mono text-xs uppercase tracking-widest text-brass">
          WhyLog
        </p>
        <h1 className="mt-2 font-serif text-2xl text-parchment">
          Create account
        </h1>
        <p className="mb-6 mt-1 font-mono text-xs text-muted">
          Start your decision log.
        </p>

        <AuthForm mode="signup" />

        <p className="mt-6 font-mono text-xs text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-brass-light hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
