"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

type Mode = "login" | "signup";

// The app's single sign-in / sign-up surface. Sign-up POSTs to
// /api/auth/signup, then both modes call signIn("credentials").
// `initialMode` lets the legacy /signup URL deep-link straight to the sign-up
// tab instead of dropping the visitor on sign-in.
export function LandingAuth({ initialMode = "login" }: { initialMode?: Mode }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setError(null);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = event.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;

    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
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
    <div className="auth-card" id="auth-card">
      <div className="tabs" role="tablist" aria-label="Sign in or sign up">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          className={mode === "login" ? "active" : undefined}
          onClick={() => switchMode("login")}
        >
          SIGN IN
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          className={mode === "signup" ? "active" : undefined}
          onClick={() => switchMode("signup")}
        >
          SIGN UP
        </button>
      </div>

      <form onSubmit={onSubmit} noValidate>
        <label htmlFor="auth-email">EMAIL</label>
        <input
          id="auth-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
        />

        <label htmlFor="auth-password">PASSWORD</label>
        <input
          id="auth-password"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder="••••••••••"
          required
          minLength={mode === "signup" ? 8 : undefined}
        />
        {mode === "signup" && (
          <p className="auth-hint">At least 8 characters.</p>
        )}

        {error && (
          <p role="alert" className="auth-error">
            {error}
          </p>
        )}

        <button type="submit" className="submit" disabled={pending}>
          {pending
            ? mode === "login"
              ? "Signing in…"
              : "Creating…"
            : mode === "login"
              ? "SIGN IN"
              : "CREATE ACCOUNT"}
        </button>
      </form>
    </div>
  );
}
