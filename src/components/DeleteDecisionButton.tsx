"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DeleteDecisionButtonProps = {
  decisionId: string;
  projectId: string;
};

export function DeleteDecisionButton({
  decisionId,
  projectId,
}: DeleteDecisionButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/decisions/${decisionId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Couldn't delete this entry. Try again.");
        setPending(false);
        return;
      }
      router.push(`/projects/${projectId}`);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setPending(false);
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-brass-light"
      >
        Delete
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <span className="font-mono text-xs text-muted">Delete entry?</span>
      <button
        onClick={onDelete}
        disabled={pending}
        className="rounded-sm border border-brass/40 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-brass-light transition-colors hover:border-brass disabled:opacity-50"
      >
        {pending ? "…" : "Confirm"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        disabled={pending}
        className="px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-muted transition-colors hover:text-parchment"
      >
        Cancel
      </button>
      {error && (
        <span role="alert" className="font-mono text-xs text-brass-light">
          {error}
        </span>
      )}
    </span>
  );
}
