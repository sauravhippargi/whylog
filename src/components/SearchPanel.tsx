"use client";

import { useState } from "react";
import Link from "next/link";

import { formatStamp } from "@/lib/format";

type SearchMatch = {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  decisionSummary: string;
  decisionDate: string; // ISO string over the wire
  tags: string[];
  distance: number;
};

type SearchResponse = { answer: string; matches: SearchMatch[] };

type ProjectOption = { id: string; name: string };

export function SearchPanel({
  projects,
  initialProjectId,
}: {
  projects: ProjectOption[];
  initialProjectId?: string;
}) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<string>(initialProjectId ?? "all");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResponse | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    setResult(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          projectId: scope === "all" ? undefined : scope,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Search failed. Try again.");
        setPending(false);
        return;
      }
      setResult((await res.json()) as SearchResponse);
      setPending(false);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask why a decision was made…"
          className="rounded-sm border border-white/10 bg-ink px-3 py-2 font-serif text-parchment outline-none placeholder:text-muted/50 focus:border-brass"
        />
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="rounded-sm border border-white/10 bg-ink px-2 py-2 font-mono text-xs text-parchment outline-none focus:border-brass"
          >
            <option value="all">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={pending || query.trim().length === 0}
            className="rounded-sm bg-brass px-4 py-2 font-mono text-xs font-medium uppercase tracking-widest text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Searching…" : "Search"}
          </button>
        </div>
        {error && (
          <p role="alert" className="font-mono text-xs text-brass-light">
            {error}
          </p>
        )}
      </form>

      {result && result.matches.length === 0 && (
        <p className="font-serif text-muted">{result.answer}</p>
      )}

      {result && result.matches.length > 0 && (
        <div className="flex flex-col gap-6">
          {/* Verdict card — the synthesized answer, in serif. */}
          <div className="rounded-md border border-brass/40 bg-surface p-5">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-brass">
              Verdict
            </p>
            <p className="whitespace-pre-wrap font-serif text-lg leading-relaxed text-parchment">
              {result.answer}
            </p>
            <p className="mt-4 border-t border-white/10 pt-3 font-mono text-[10px] uppercase tracking-widest text-muted">
              Drawn from: {result.matches.map((m) => m.title).join(" · ")}
            </p>
          </div>

          {/* Supporting entries — ordinary ledger rows, to verify the answer. */}
          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">
              Matched entries
            </p>
            <div className="overflow-hidden rounded-md border border-white/10">
              {result.matches.map((m) => (
                <Link
                  key={m.id}
                  href={`/decisions/${m.id}`}
                  className="group flex items-baseline gap-4 border-b border-white/5 px-4 py-3 transition-colors last:border-b-0 hover:border-brass/30"
                >
                  <span className="shrink-0 font-mono text-xs text-muted">
                    {formatStamp(new Date(m.decisionDate))}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-parchment transition-colors group-hover:text-brass-light">
                      {m.title}
                    </p>
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
      )}
    </div>
  );
}
