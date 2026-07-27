import { z } from "zod";

import { generateJson, type ResponseSchema } from "@/lib/generation";

// Extraction of candidate decisions from pasted text (FR8) or a full document
// (FR9). Nothing here saves anything — it returns unsaved candidates for the
// user to review. Model output is always zod-validated (rules.md §1: never
// trust it blindly) and normalized so it can pass the create-time validation.

export type DraftCandidate = {
  title: string;
  decisionSummary: string;
  rationale: string;
  alternativesConsidered?: string;
  decidedBy?: string;
  decisionDate?: string; // YYYY-MM-DD
  tags?: string[];
};

// Schema handed to Gemini so it returns parseable, well-shaped JSON. Only the
// three narrative fields are required; the rest are omitted when not inferable.
const CANDIDATE_SCHEMA: ResponseSchema = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    decisionSummary: { type: "STRING" },
    rationale: { type: "STRING" },
    alternativesConsidered: { type: "STRING" },
    decidedBy: { type: "STRING" },
    decisionDate: { type: "STRING" },
    tags: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["title", "decisionSummary", "rationale"],
};

// Loose validation of one raw model object. Required fields must be present and
// non-empty; everything else is optional. Lengths are enforced in normalize().
const rawCandidateSchema = z.object({
  title: z.string().min(1),
  decisionSummary: z.string().min(1),
  rationale: z.string().min(1),
  alternativesConsidered: z.string().optional(),
  decidedBy: z.string().optional(),
  decisionDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const FIELD_RULES = `Rules:
- Use ONLY information present in the text. Never invent, guess, or add placeholder values.
- Omit any optional field you cannot reasonably determine from the text.
- title: a short summary of the decision (a few words).
- decisionSummary: what was decided.
- rationale: why it was decided.
- alternativesConsidered: other options that were weighed, only if mentioned.
- decidedBy: the person or role who made the call, only if stated.
- decisionDate: the decision's date as YYYY-MM-DD, only if a concrete date is present in the text.
- tags: a few short topical keywords, only if clearly applicable.`;

const DRAFT_SYSTEM = `You extract a single decision from pasted source text (e.g. a Slack thread, meeting notes, or a document excerpt) into structured JSON for a decision log.
${FIELD_RULES}
Return one JSON object for the single most significant decision in the text.`;

const IMPORT_SYSTEM = `You extract decisions from an existing document (e.g. a PR-FAQ, a design doc, or a "Decisions" section) into structured JSON for a decision log.
Segment the document into DISTINCT decisions — such a document often records several. Return a JSON array with one object per distinct decision, in the order they appear. If only one decision is present, return an array of one. If none, return an empty array.
${FIELD_RULES}`;

function trimTo(value: string, max: number): string {
  return value.trim().slice(0, max);
}

// Normalize a date-ish string to YYYY-MM-DD, or undefined if unparseable.
function normalizeDate(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return undefined;
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Truncate to the same limits the create endpoint enforces (see validation.ts)
// so a prefilled/committed candidate always saves cleanly. Empty optionals are
// dropped rather than sent as blank.
function normalizeCandidate(raw: z.infer<typeof rawCandidateSchema>): DraftCandidate {
  const alternatives = raw.alternativesConsidered
    ? trimTo(raw.alternativesConsidered, 5000)
    : "";
  const decidedBy = raw.decidedBy ? trimTo(raw.decidedBy, 200) : "";
  const tags = (raw.tags ?? [])
    .map((t) => trimTo(t, 50))
    .filter((t) => t.length > 0)
    .slice(0, 30);

  return {
    title: trimTo(raw.title, 200),
    decisionSummary: trimTo(raw.decisionSummary, 2000),
    rationale: trimTo(raw.rationale, 5000),
    ...(alternatives ? { alternativesConsidered: alternatives } : {}),
    ...(decidedBy ? { decidedBy } : {}),
    ...(normalizeDate(raw.decisionDate)
      ? { decisionDate: normalizeDate(raw.decisionDate) }
      : {}),
    ...(tags.length > 0 ? { tags } : {}),
  };
}

/** FR8 — extract one candidate decision from raw pasted text. */
export async function draftDecision(rawText: string): Promise<DraftCandidate> {
  const json = await generateJson(DRAFT_SYSTEM, rawText, CANDIDATE_SCHEMA);
  const parsed = rawCandidateSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Could not extract a decision from that text.");
  }
  return normalizeCandidate(parsed.data);
}

/** FR9 — segment a document into multiple candidate decisions. Invalid entries
 * from the model are skipped rather than failing the whole import. */
export async function importDecisions(rawDoc: string): Promise<DraftCandidate[]> {
  const json = await generateJson(IMPORT_SYSTEM, rawDoc, {
    type: "ARRAY",
    items: CANDIDATE_SCHEMA,
  });

  const array = z.array(z.unknown()).safeParse(json);
  if (!array.success) return [];

  const candidates: DraftCandidate[] = [];
  for (const item of array.data) {
    const parsed = rawCandidateSchema.safeParse(item);
    if (parsed.success) candidates.push(normalizeCandidate(parsed.data));
  }
  return candidates;
}
