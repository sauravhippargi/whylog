"use client";

import { useState } from "react";

import {
  DecisionForm,
  EMPTY_DECISION_FORM,
  type DecisionFormValues,
} from "./DecisionForm";

type DraftCandidate = {
  title: string;
  decisionSummary: string;
  rationale: string;
  alternativesConsidered?: string;
  decidedBy?: string;
  decisionDate?: string;
  tags?: string[];
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

// Two ways to start a decision: paste raw text and let Gemini draft it, or fill
// the form directly. The draft only pre-fills the form — saving still goes
// through the normal create path (so embedding-on-create fires as usual).
export function NewDecisionPanel({ projectId }: { projectId: string }) {
  const [rawText, setRawText] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initial, setInitial] = useState<DecisionFormValues>(
    EMPTY_DECISION_FORM,
  );
  const [drafted, setDrafted] = useState(false);
  // Remounting the form (key change) re-seeds it with the new draft values.
  const [formKey, setFormKey] = useState(0);

  async function onDraft() {
    setError(null);
    setDrafting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/decisions/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Couldn't draft a decision. Try again.");
        setDrafting(false);
        return;
      }
      const { candidate } = (await res.json()) as { candidate: DraftCandidate };
      setInitial(candidateToValues(candidate));
      setFormKey((k) => k + 1);
      setDrafted(true);
      setDrafting(false);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setDrafting(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-md border border-white/10 bg-surface p-5">
        <p className="mb-1 font-mono text-xs uppercase tracking-widest text-muted">
          Draft from pasted text
        </p>
        <p className="mb-3 font-serif text-sm text-muted">
          Paste a Slack thread, meeting notes, or a doc excerpt. Gemini drafts a
          decision for you to review — nothing is saved until you submit.
        </p>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          rows={6}
          placeholder="Paste source text…"
          className="w-full rounded-sm border border-white/10 bg-ink px-3 py-2 font-serif text-parchment outline-none placeholder:text-muted/50 focus:border-brass"
        />
        {error && (
          <p role="alert" className="mt-2 font-mono text-xs text-brass-light">
            {error}
          </p>
        )}
        <div className="mt-3">
          <button
            onClick={onDraft}
            disabled={drafting || rawText.trim().length === 0}
            className="rounded-sm bg-brass px-4 py-2 font-mono text-xs font-medium uppercase tracking-widest text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {drafting ? "Drafting…" : "Draft with AI"}
          </button>
        </div>
      </section>

      <div>
        <p className="mb-4 font-mono text-xs uppercase tracking-widest text-muted">
          {drafted ? "Review draft — edit anything, then log it" : "Or fill the form directly"}
        </p>
        <DecisionForm
          key={formKey}
          mode="create"
          projectId={projectId}
          initial={initial}
          cancelHref={`/projects/${projectId}`}
        />
      </div>
    </div>
  );
}
