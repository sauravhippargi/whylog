"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import type { DecisionFormValues } from "./DecisionForm";
import {
  PasteFromClipboardButton,
  SECONDARY_PILL,
} from "./PasteFromClipboardButton";

type DraftCandidate = {
  title: string;
  decisionSummary: string;
  rationale: string;
  alternativesConsidered?: string;
  decidedBy?: string;
  decisionDate?: string;
  tags?: string[];
};

type ReviewItem = {
  key: string;
  status: "accepted" | "rejected";
  values: DecisionFormValues;
};

function candidateToValues(c: DraftCandidate): DecisionFormValues {
  return {
    title: c.title ?? "",
    decisionDate: c.decisionDate ?? "",
    decisionSummary: c.decisionSummary ?? "",
    rationale: c.rationale ?? "",
    alternativesConsidered: c.alternativesConsidered ?? "",
    decidedBy: c.decidedBy ?? "",
    tagsText: (c.tags ?? []).join(", "),
    linksText: "",
  };
}

function toArray(text: string, separator: "," | "\n"): string[] {
  return text
    .split(separator)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

const labelClass = "font-mono text-[10px] uppercase tracking-widest text-muted";
const fieldClass =
  "w-full rounded-sm border border-rule bg-ink px-2 py-1.5 font-serif text-sm text-parchment outline-none placeholder:text-muted/50 focus:border-brass";

export function ImportPanel({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [rawDoc, setRawDoc] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ReviewItem[] | null>(null);
  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState<{ created: number; failed: number } | null>(
    null,
  );

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setRawDoc(text);
  }

  async function onExtract() {
    setError(null);
    setResult(null);
    setExtracting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/decisions/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawDoc }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Couldn't extract decisions. Try again.");
        setExtracting(false);
        return;
      }
      const { candidates } = (await res.json()) as {
        candidates: DraftCandidate[];
      };
      setItems(
        candidates.map((c) => ({
          key: crypto.randomUUID(),
          status: "accepted" as const,
          values: candidateToValues(c),
        })),
      );
      setExtracting(false);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setExtracting(false);
    }
  }

  function updateField(
    key: string,
    field: keyof DecisionFormValues,
    value: string,
  ) {
    setItems(
      (prev) =>
        prev?.map((it) =>
          it.key === key ? { ...it, values: { ...it.values, [field]: value } } : it,
        ) ?? null,
    );
  }

  function setStatus(key: string, status: ReviewItem["status"]) {
    setItems(
      (prev) =>
        prev?.map((it) => (it.key === key ? { ...it, status } : it)) ?? null,
    );
  }

  async function onCommit() {
    if (!items) return;
    setError(null);
    const accepted = items.filter((it) => it.status === "accepted");
    if (accepted.length === 0) {
      setError("Accept at least one decision to commit.");
      return;
    }
    // Required fields must be filled before an accepted candidate can be saved.
    const incomplete = accepted.filter(
      (it) =>
        !it.values.title.trim() ||
        !it.values.decisionSummary.trim() ||
        !it.values.rationale.trim() ||
        !it.values.decisionDate.trim(),
    );
    if (incomplete.length > 0) {
      setError(
        `${incomplete.length} accepted ${incomplete.length === 1 ? "entry needs" : "entries need"} a title, summary, rationale, and date before committing.`,
      );
      return;
    }

    setCommitting(true);
    let created = 0;
    let failed = 0;
    const remaining: ReviewItem[] = [];

    // Create one at a time through the normal endpoint so each is embedded
    // individually, exactly like any other decision.
    for (const it of items) {
      if (it.status !== "accepted") {
        remaining.push(it);
        continue;
      }
      try {
        const res = await fetch(`/api/projects/${projectId}/decisions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: it.values.title,
            decisionDate: it.values.decisionDate,
            decisionSummary: it.values.decisionSummary,
            rationale: it.values.rationale,
            alternativesConsidered: it.values.alternativesConsidered || null,
            decidedBy: it.values.decidedBy || null,
            tags: toArray(it.values.tagsText, ","),
            links: toArray(it.values.linksText, "\n"),
          }),
        });
        if (res.ok) {
          created += 1;
        } else {
          failed += 1;
          remaining.push(it); // keep failed ones for another attempt
        }
      } catch {
        failed += 1;
        remaining.push(it);
      }
    }

    setCommitting(false);
    setResult({ created, failed });
    setItems(remaining.length > 0 ? remaining : null);
    router.refresh();
  }

  const acceptedCount = items?.filter((it) => it.status === "accepted").length ?? 0;

  return (
    <div className="flex flex-col gap-8">
      {result && (
        <div className="rounded-md border border-brass/40 bg-surface p-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="seal-drop inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-brass/70 bg-brass-tint text-xs text-brass"
            >
              ◈
            </span>
            <p className="font-serif text-parchment">
              Logged {result.created}{" "}
              {result.created === 1 ? "decision" : "decisions"}
              {result.failed > 0 && `, ${result.failed} failed`}.
            </p>
          </div>
          <Link
            href={`/projects/${projectId}`}
            className="mt-3 inline-block font-mono text-xs uppercase tracking-widest text-brass-light hover:underline"
          >
            View project ledger →
          </Link>
        </div>
      )}

      <section className="rounded-md border border-rule bg-surface p-5">
        <p className="mb-1 font-mono text-xs uppercase tracking-widest text-muted">
          Import from a document
        </p>
        <p className="mb-3 font-serif text-sm text-muted">
          Paste an existing decision document (e.g. a PR-FAQ) or upload a text
          file. Gemini extracts the decisions into a review queue — nothing is
          saved until you commit.
        </p>
        <textarea
          value={rawDoc}
          onChange={(e) => setRawDoc(e.target.value)}
          rows={8}
          placeholder="Paste document text…"
          className="w-full rounded-sm border border-rule bg-ink px-3 py-2 font-serif text-parchment outline-none placeholder:text-muted/50 focus:border-brass"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <PasteFromClipboardButton
            onText={(text) => {
              setRawDoc(text);
              setError(null);
            }}
            onError={setError}
          />
          <label
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.currentTarget.querySelector("input")?.click();
              }
            }}
            className={SECONDARY_PILL}
          >
            Upload .txt / .md
            <input
              type="file"
              accept=".txt,.md,.markdown,text/plain,text/markdown"
              onChange={onFile}
              className="hidden"
            />
          </label>
          <button
            onClick={onExtract}
            disabled={extracting || rawDoc.trim().length === 0}
            className="rounded-sm bg-brass-fill px-4 py-2 font-mono text-xs font-medium uppercase tracking-widest text-on-brass transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {extracting ? "Extracting…" : "Extract decisions"}
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-3 font-mono text-xs text-brass-light">
            {error}
          </p>
        )}
      </section>

      {items && items.length === 0 && (
        <p className="font-serif text-muted">
          No distinct decisions were found in that document.
        </p>
      )}

      {items && items.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Review queue · {acceptedCount} of {items.length} accepted
            </p>
            <button
              onClick={onCommit}
              disabled={committing || acceptedCount === 0}
              className="rounded-sm bg-brass-fill px-4 py-2 font-mono text-xs font-medium uppercase tracking-widest text-on-brass transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {committing
                ? "Committing…"
                : `Commit ${acceptedCount} accepted`}
            </button>
          </div>

          {items.map((it, index) => {
            const rejected = it.status === "rejected";
            return (
              <div
                key={it.key}
                className={`rounded-md border p-4 ${rejected ? "border-rule-soft opacity-50" : "border-rule bg-surface"}`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                    Candidate {index + 1}
                    {rejected && " · Rejected"}
                  </span>
                  {/* Secondary/outline pills, same language as the upload
                      control — deliberately not filled, so neither competes
                      with "Commit accepted" for weight. */}
                  {rejected ? (
                    <button
                      type="button"
                      onClick={() => setStatus(it.key, "accepted")}
                      className={SECONDARY_PILL}
                    >
                      Restore
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setStatus(it.key, "rejected")}
                      className={SECONDARY_PILL}
                    >
                      Reject
                    </button>
                  )}
                </div>

                {!rejected && (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <span className={labelClass}>Title</span>
                      <input
                        value={it.values.title}
                        onChange={(e) => updateField(it.key, "title", e.target.value)}
                        className={fieldClass}
                      />
                    </div>
                    <div className="flex max-w-xs flex-col gap-1">
                      <span className={labelClass}>Decision date</span>
                      <input
                        type="date"
                        value={it.values.decisionDate}
                        onChange={(e) =>
                          updateField(it.key, "decisionDate", e.target.value)
                        }
                        className={`${fieldClass} font-mono`}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className={labelClass}>What was decided</span>
                      <textarea
                        value={it.values.decisionSummary}
                        onChange={(e) =>
                          updateField(it.key, "decisionSummary", e.target.value)
                        }
                        rows={2}
                        className={fieldClass}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className={labelClass}>Why (rationale)</span>
                      <textarea
                        value={it.values.rationale}
                        onChange={(e) =>
                          updateField(it.key, "rationale", e.target.value)
                        }
                        rows={3}
                        className={fieldClass}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className={labelClass}>Alternatives (optional)</span>
                      <textarea
                        value={it.values.alternativesConsidered}
                        onChange={(e) =>
                          updateField(
                            it.key,
                            "alternativesConsidered",
                            e.target.value,
                          )
                        }
                        rows={2}
                        className={fieldClass}
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <span className={labelClass}>Decided by (optional)</span>
                        <input
                          value={it.values.decidedBy}
                          onChange={(e) =>
                            updateField(it.key, "decidedBy", e.target.value)
                          }
                          className={fieldClass}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className={labelClass}>Tags (comma-separated)</span>
                        <input
                          value={it.values.tagsText}
                          onChange={(e) =>
                            updateField(it.key, "tagsText", e.target.value)
                          }
                          className={`${fieldClass} font-mono`}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
