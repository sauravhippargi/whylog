"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewProjectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description || undefined }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Couldn't create the project. Try again.");
        setPending(false);
        return;
      }

      setName("");
      setDescription("");
      setPending(false);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-md border border-rule bg-surface p-5"
      noValidate
    >
      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">
        New project
      </p>
      <div className="flex flex-col gap-3">
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project name"
          maxLength={100}
          required
          className="rounded-sm border border-rule bg-ink px-3 py-2 font-serif text-parchment outline-none placeholder:text-muted/60 focus:border-brass"
        />
        <input
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          maxLength={500}
          className="rounded-sm border border-rule bg-ink px-3 py-2 font-serif text-sm text-parchment outline-none placeholder:text-muted/60 focus:border-brass"
        />

        {error && (
          <p role="alert" className="font-mono text-xs text-brass-light">
            {error}
          </p>
        )}

        <div>
          <button
            type="submit"
            disabled={pending || name.trim().length === 0}
            className="rounded-sm bg-brass-fill px-4 py-2 font-mono text-xs font-medium uppercase tracking-widest text-on-brass transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Creating…" : "Create project"}
          </button>
        </div>
      </div>
    </form>
  );
}
