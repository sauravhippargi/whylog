"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ProjectRowProps = {
  id: string;
  name: string;
  description: string | null;
  dateStamp: string;
  archived: boolean;
};

export function ProjectRow({
  id,
  name,
  description,
  dateStamp,
  archived,
}: ProjectRowProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "edit" | "confirmArchive">("view");
  const [draftName, setDraftName] = useState(name);
  const [draftDescription, setDraftDescription] = useState(description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save() {
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draftName,
          description: draftDescription ? draftDescription : null,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Couldn't save changes. Try again.");
        setPending(false);
        return;
      }
      setPending(false);
      setMode("view");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setPending(false);
    }
  }

  async function archive() {
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Couldn't archive this project. Try again.");
        setPending(false);
        return;
      }
      setPending(false);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setPending(false);
    }
  }

  // Archived rows are read-only (archiving is the only removal path; there's no
  // unarchive in Phase 1).
  if (archived) {
    return (
      <div className="flex items-baseline gap-4 border-b border-white/5 px-4 py-3 opacity-60">
        <span className="shrink-0 font-mono text-xs text-muted">{dateStamp}</span>
        <div className="min-w-0 flex-1">
          <Link
            href={`/projects/${id}`}
            className="truncate font-serif text-parchment line-through decoration-muted/50 hover:text-brass-light"
          >
            {name}
          </Link>
          {description && (
            <p className="truncate font-serif text-sm text-muted">{description}</p>
          )}
        </div>
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-verdigris">
          Archived
        </span>
      </div>
    );
  }

  if (mode === "edit") {
    return (
      <div className="border-b border-white/5 bg-surface/40 px-4 py-3">
        <div className="flex flex-col gap-2">
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            maxLength={100}
            aria-label="Project name"
            className="rounded-sm border border-white/10 bg-ink px-2 py-1.5 font-serif text-parchment outline-none focus:border-brass"
          />
          <input
            value={draftDescription}
            onChange={(e) => setDraftDescription(e.target.value)}
            maxLength={500}
            placeholder="Description (optional)"
            aria-label="Project description"
            className="rounded-sm border border-white/10 bg-ink px-2 py-1.5 font-serif text-sm text-parchment outline-none placeholder:text-muted/60 focus:border-brass"
          />
          {error && (
            <p role="alert" className="font-mono text-xs text-brass-light">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={pending || draftName.trim().length === 0}
              className="rounded-sm bg-brass px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => {
                setDraftName(name);
                setDraftDescription(description ?? "");
                setError(null);
                setMode("view");
              }}
              disabled={pending}
              className="rounded-sm border border-white/10 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:border-brass hover:text-brass-light"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ledger-row group flex items-baseline gap-4 border-b border-white/5 px-4 py-3">
      <span className="shrink-0 font-mono text-xs text-muted">{dateStamp}</span>
      <div className="min-w-0 flex-1">
        <Link
          href={`/projects/${id}`}
          className="block truncate font-serif text-parchment transition-colors hover:text-brass-light"
        >
          {name}
        </Link>
        {description && (
          <p className="truncate font-serif text-sm text-muted">{description}</p>
        )}
        {error && (
          <p role="alert" className="mt-1 font-mono text-xs text-brass-light">
            {error}
          </p>
        )}
      </div>

      {mode === "confirmArchive" ? (
        <div className="flex shrink-0 items-center gap-2">
          <span className="font-mono text-xs text-muted">Archive?</span>
          <button
            onClick={archive}
            disabled={pending}
            className="rounded-sm border border-brass/40 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-brass-light transition-colors hover:border-brass disabled:opacity-50"
          >
            {pending ? "…" : "Confirm"}
          </button>
          <button
            onClick={() => setMode("view")}
            disabled={pending}
            className="rounded-sm px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-muted transition-colors hover:text-parchment"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-3">
          <button
            onClick={() => setMode("edit")}
            className="font-mono text-[10px] uppercase tracking-widest text-muted transition-colors hover:text-brass-light"
          >
            Rename
          </button>
          <button
            onClick={() => setMode("confirmArchive")}
            className="font-mono text-[10px] uppercase tracking-widest text-muted transition-colors hover:text-brass-light"
          >
            Archive
          </button>
        </div>
      )}
    </div>
  );
}
