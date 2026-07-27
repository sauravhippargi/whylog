"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Option = { id: string; title: string; dateStamp: string };

export function SupersedeControl({
  decisionId,
  current,
  options,
}: {
  decisionId: string;
  current: { id: string; title: string } | null;
  options: Option[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState(current?.id ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function apply(value: string | null) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/decisions/${decisionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supersededById: value }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Couldn't update this link. Try again.");
        setPending(false);
        return;
      }
      setPending(false);
      setEditing(false);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setPending(false);
    }
  }

  // Nothing to link to yet.
  if (options.length === 0 && !current) {
    return (
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted/70">
        Add another decision to this project to mark this one superseded.
      </p>
    );
  }

  if (!editing) {
    return (
      <button
        onClick={() => {
          setSelected(current?.id ?? "");
          setError(null);
          setEditing(true);
        }}
        className="font-mono text-[11px] uppercase tracking-widest text-muted transition-colors hover:text-brass-light"
      >
        {current ? "Change supersession" : "Mark as superseded…"}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        aria-label="Superseded by"
        className="max-w-full rounded-sm border border-white/10 bg-ink px-2 py-1.5 font-mono text-xs text-parchment outline-none focus:border-brass"
      >
        <option value="">— Not superseded —</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.dateStamp} · {o.title}
          </option>
        ))}
      </select>

      {error && (
        <p role="alert" className="font-mono text-xs text-brass-light">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={() => apply(selected ? selected : null)}
          disabled={pending}
          className="rounded-sm bg-brass px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => {
            setEditing(false);
            setError(null);
          }}
          disabled={pending}
          className="font-mono text-[10px] uppercase tracking-widest text-muted transition-colors hover:text-parchment"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
