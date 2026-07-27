import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { embedQuery } from "@/lib/embeddings";
import { generateJson } from "@/lib/generation";

// Semantic search over the caller's own decisions. All Decision access here is
// scoped to the session user via the project join (rules.md §2) — never by a
// client-supplied id.

const K = 5;

// Cosine distance (pgvector `<=>`) on L2-normalized vectors is in [0, 2]:
// 0 = identical direction, 1 = orthogonal, 2 = opposite. Tuned against measured
// distances during Phase 5 verification: a genuinely on-topic decision lands at
// ~0.20–0.35 even with zero keyword overlap between the question and the entry,
// while questions with no matching decision sit at ~0.46+. 0.45 falls between
// those clusters. Anything past it is "no strong match" — we return no matches
// and refuse to synthesize a confident answer (rules.md §1 — never fabricate).
// (A fixed cutoff is inherently corpus-dependent; revisit if data shifts.)
const WEAK_MATCH_DISTANCE = 0.45;

export type SearchMatch = {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  decisionSummary: string;
  rationale: string;
  decidedBy: string | null;
  decisionDate: Date;
  tags: string[];
  distance: number;
};

export type SearchResult = {
  answer: string;
  matches: SearchMatch[];
};

const NO_MATCH_MESSAGE =
  "No decision in your log strongly matches that question. Try rephrasing, or log the decision if it isn't recorded yet.";

const answerSchema = z.object({ answer: z.string().min(1) });

async function synthesizeAnswer(
  query: string,
  matches: SearchMatch[],
): Promise<string> {
  const decisionsBlock = matches
    .map((m, i) => {
      const parts = [
        `[${i + 1}] Title: ${m.title}`,
        `Decided: ${m.decisionSummary}`,
        `Why: ${m.rationale}`,
      ];
      return parts.join("\n");
    })
    .join("\n\n");

  const system = `You answer a user's question about their own past decisions, using ONLY the decisions provided below. Rules:
- Use only the provided decisions. Do not use outside knowledge or invent any specifics not present in them.
- Cite the decision(s) you draw from by their exact Title, in quotes.
- If the provided decisions do not actually answer the question, say so plainly rather than guessing.
- Keep the answer to a few sentences, factual and terse.
Return JSON: { "answer": "..." }.`;

  const user = `Question: ${query}\n\nDecisions:\n${decisionsBlock}`;

  const json = await generateJson(system, user, {
    type: "OBJECT",
    properties: { answer: { type: "STRING" } },
    required: ["answer"],
  });

  const parsed = answerSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Answer generation returned an unexpected shape.");
  }
  return parsed.data.answer.trim();
}

/**
 * Embed the query, rank the user's decisions by cosine distance, and (if a
 * strong match exists) synthesize a cited answer. `projectId`, when given, must
 * already be confirmed as the caller's (the route does that via getOwnedProject).
 */
export async function searchDecisions(
  userId: string,
  query: string,
  projectId?: string,
): Promise<SearchResult> {
  const queryVector = await embedQuery(query);
  const literal = `[${queryVector.join(",")}]`;

  const rows = await prisma.$queryRaw<SearchMatch[]>`
    SELECT
      d.id,
      d."projectId",
      p.name AS "projectName",
      d.title,
      d."decisionSummary",
      d.rationale,
      d."decidedBy",
      d."decisionDate",
      d.tags,
      (d.embedding <=> ${literal}::vector) AS distance
    FROM "Decision" d
    JOIN "Project" p ON d."projectId" = p.id
    WHERE p."userId" = ${userId}
      AND d.embedding IS NOT NULL
      ${projectId ? Prisma.sql`AND d."projectId" = ${projectId}` : Prisma.empty}
    ORDER BY distance ASC
    LIMIT ${K}
  `;

  // Keep only reasonably-close matches; if the best is weak, don't answer.
  const strong = rows.filter((r) => Number(r.distance) <= WEAK_MATCH_DISTANCE);
  if (strong.length === 0) {
    return { answer: NO_MATCH_MESSAGE, matches: [] };
  }

  // pg returns float8 as a number already, but normalize defensively.
  const matches = strong.map((m) => ({ ...m, distance: Number(m.distance) }));

  // Retrieval (embeddings + pgvector) and answer synthesis use separate Gemini
  // quotas. If synthesis fails (e.g. the free-tier generation quota is spent),
  // still return the matched decisions rather than failing the whole search —
  // the matches are the verifiable substance; the written answer sits on top.
  let answer: string;
  try {
    answer = await synthesizeAnswer(query, matches);
  } catch (error) {
    console.error("Answer synthesis failed; returning matches only:", error);
    answer =
      "Showing the closest matching decisions below. A written summary couldn't be generated just now — try again shortly.";
  }

  return { answer, matches };
}
