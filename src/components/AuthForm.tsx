"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = event.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          setError(data.error ?? "Couldn't create the account. Try again.");
          setPending(false);
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          mode === "login"
            ? "Invalid email or password."
            : "Account created, but sign-in failed. Try logging in.",
        );
        setPending(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <label className="flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-widest text-muted">
          Email
        </span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-sm border border-white/10 bg-ink px-3 py-2 font-mono text-sm text-parchment outline-none focus:border-brass"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-widest text-muted">
          Password
        </span>
        <input
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={8}
          className="rounded-sm border border-white/10 bg-ink px-3 py-2 font-mono text-sm text-parchment outline-none focus:border-brass"
        />
        {mode === "signup" && (
          <span className="font-mono text-xs text-muted">
            At least 8 characters.
          </span>
        )}
      </label>

      {error && (
        <p
          role="alert"
          className="font-mono text-xs leading-relaxed text-brass-light"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-sm bg-brass px-4 py-2 font-mono text-sm font-medium uppercase tracking-widest text-ink transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending
          ? mode === "login"
            ? "Signing in…"
            : "Creating…"
          : mode === "login"
            ? "Sign in"
            : "Create account"}
      </button>
    </form>
  );
}
