"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export type DecisionFormValues = {
  title: string;
  decisionDate: string; // YYYY-MM-DD
  decisionSummary: string;
  rationale: string;
  alternativesConsidered: string;
  decidedBy: string;
  tagsText: string; // comma-separated
  linksText: string; // one URL per line
};

type DecisionFormProps =
  | { mode: "create"; projectId: string; cancelHref: string; initial?: DecisionFormValues; decisionId?: undefined }
  | { mode: "edit"; decisionId: string; cancelHref: string; initial: DecisionFormValues; projectId?: undefined };

export const EMPTY_DECISION_FORM: DecisionFormValues = {
  title: "",
  decisionDate: "",
  decisionSummary: "",
  rationale: "",
  alternativesConsidered: "",
  decidedBy: "",
  tagsText: "",
  linksText: "",
};

const labelClass =
  "font-mono text-xs uppercase tracking-widest text-muted";
const inputClass =
  "rounded-sm border border-rule bg-ink px-3 py-2 font-serif text-parchment outline-none placeholder:text-muted/50 focus:border-brass";

export function DecisionForm(props: DecisionFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<DecisionFormValues>(
    props.initial ?? EMPTY_DECISION_FORM,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function set<K extends keyof DecisionFormValues>(
    key: K,
    value: DecisionFormValues[K],
  ) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function toArray(text: string, separator: "," | "\n"): string[] {
    return text
      .split(separator)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const payload = {
      title: values.title,
      decisionDate: values.decisionDate,
      decisionSummary: values.decisionSummary,
      rationale: values.rationale,
      alternativesConsidered: values.alternativesConsidered || null,
      decidedBy: values.decidedBy || null,
      tags: toArray(values.tagsText, ","),
      links: toArray(values.linksText, "\n"),
    };

    try {
      const res =
        props.mode === "create"
          ? await fetch(`/api/projects/${props.projectId}/decisions`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/decisions/${props.decisionId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Couldn't save this entry. Try again.");
        setPending(false);
        return;
      }

      const data = (await res.json()) as { decision: { id: string } };
      // Newly-logged decisions get the stamp animation on arrival; edits don't.
      const suffix = props.mode === "create" ? "?stamped=1" : "";
      router.push(`/decisions/${data.decision.id}${suffix}`);
      router.refresh();
    } catch {
      setError("Couldn't save this entry. Check your connection and try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <label className="flex flex-col gap-2">
        <span className={labelClass}>Title</span>
        <input
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          maxLength={200}
          required
          className={inputClass}
        />
      </label>

      <label className="flex max-w-xs flex-col gap-2">
        <span className={labelClass}>Decision date</span>
        <input
          type="date"
          value={values.decisionDate}
          onChange={(e) => set("decisionDate", e.target.value)}
          required
          className={`${inputClass} font-mono text-sm`}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className={labelClass}>What was decided</span>
        <textarea
          value={values.decisionSummary}
          onChange={(e) => set("decisionSummary", e.target.value)}
          maxLength={2000}
          required
          rows={3}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className={labelClass}>Why (rationale)</span>
        <textarea
          value={values.rationale}
          onChange={(e) => set("rationale", e.target.value)}
          maxLength={5000}
          required
          rows={4}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className={labelClass}>Alternatives considered (optional)</span>
        <textarea
          value={values.alternativesConsidered}
          onChange={(e) => set("alternativesConsidered", e.target.value)}
          maxLength={5000}
          rows={3}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className={labelClass}>Decided by (optional)</span>
        <input
          value={values.decidedBy}
          onChange={(e) => set("decidedBy", e.target.value)}
          maxLength={200}
          placeholder="Name or role"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className={labelClass}>Tags (optional, comma-separated)</span>
        <input
          value={values.tagsText}
          onChange={(e) => set("tagsText", e.target.value)}
          placeholder="roadmap, mobile, q3"
          className={`${inputClass} font-mono text-sm`}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className={labelClass}>Links (optional, one URL per line)</span>
        <textarea
          value={values.linksText}
          onChange={(e) => set("linksText", e.target.value)}
          rows={2}
          placeholder="https://…"
          className={`${inputClass} font-mono text-sm`}
        />
      </label>

      {error && (
        <p role="alert" className="font-mono text-xs text-brass-light">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-sm bg-brass-fill px-4 py-2 font-mono text-xs font-medium uppercase tracking-widest text-on-brass transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending
            ? props.mode === "create"
              ? "Logging…"
              : "Saving…"
            : props.mode === "create"
              ? "Log decision"
              : "Save changes"}
        </button>
        <Link
          href={props.cancelHref}
          className="font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-brass-light"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
