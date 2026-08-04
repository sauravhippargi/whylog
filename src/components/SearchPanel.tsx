"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { formatStamp } from "@/lib/format";
import { SupersededTag } from "@/components/SupersededTag";

type SearchMatch = {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  decisionSummary: string;
  decisionDate: string; // ISO string over the wire
  tags: string[];
  supersededById: string | null;
  distance: number;
};

type SearchResponse = { answer: string; matches: SearchMatch[] };

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "done"; data: SearchResponse };

/**
 * Renders the results for a query supplied by the top-bar search. The query and
 * scope now live in the shell, so this component has no input of its own —
 * refining a search happens in the always-visible top bar.
 *
 * Callers should key this on `query|projectId` so a new search remounts it with
 * the correct initial state. It calls the existing POST /api/search unchanged,
 * sending projectId only when the shell's scope toggle asked for it.
 */
export function SearchPanel({
  query,
  projectId,
}: {
  query: string;
  projectId?: string;
}) {
  const [state, setState] = useState<State>(
    query ? { kind: "loading" } : { kind: "idle" },
  );

  useEffect(() => {
    if (!query) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, projectId }),
        });
        if (cancelled) return;
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setState({
            kind: "error",
            message: data.error ?? "Search failed. Try again.",
          });
          return;
        }
        const data = (await res.json()) as SearchResponse;
        if (!cancelled) setState({ kind: "done", data });
      } catch {
        if (!cancelled) {
          setState({
            kind: "error",
            message:
              "Couldn't reach the server. Check your connection and try again.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [query, projectId]);

  if (state.kind === "idle") {
    return (
      <div className="rounded-md border border-dashed border-rule bg-surface p-8 text-center">
        <p className="font-serif text-muted">
          Ask a question in plain language using the search bar above. Search
          runs across all your projects unless you narrow it to one.
        </p>
      </div>
    );
  }

  if (state.kind === "loading") {
    return (
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        Searching…
      </p>
    );
  }

  if (state.kind === "error") {
    return (
      <p role="alert" className="font-mono text-xs text-brass-light">
        {state.message}
      </p>
    );
  }

  const result = state.data;

  if (result.matches.length === 0) {
    return <p className="font-serif text-muted">{result.answer}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Verdict card — the synthesized answer, in serif. */}
      <div className="rounded-md border border-brass/40 bg-surface p-5">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-brass">
          Verdict
        </p>
        <p className="whitespace-pre-wrap font-serif text-lg leading-relaxed text-parchment">
          {result.answer}
        </p>
        <p className="mt-4 border-t border-rule pt-3 font-mono text-[10px] uppercase tracking-widest text-muted">
          Drawn from: {result.matches.map((m) => m.title).join(" · ")}
        </p>
      </div>

      {/* Supporting entries — ordinary ledger rows, to verify the answer. */}
      <div>
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">
          Matched entries
        </p>
        <div className="overflow-hidden rounded-md border border-rule">
          {result.matches.map((m) => (
            <Link
              key={m.id}
              href={`/decisions/${m.id}`}
              className="ledger-row group flex items-baseline gap-4 border-b border-rule-soft px-4 py-3 last:border-b-0"
            >
              <span className="shrink-0 font-mono text-xs text-muted">
                {formatStamp(new Date(m.decisionDate))}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <p
                    className={`truncate font-serif transition-colors group-hover:text-brass-light ${
                      m.supersededById ? "text-parchment/70" : "text-parchment"
                    }`}
                  >
                    {m.title}
                  </p>
                  {m.supersededById && <SupersededTag />}
                </div>
                <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-widest text-muted">
                  {m.projectName}
                  {m.tags.length > 0 && ` · ${m.tags.join(" · ")}`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
