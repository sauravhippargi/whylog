import type { Decision } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { getOwnedProject } from "@/lib/projects";
import { buildEmbeddingInput, embedDocument } from "@/lib/embeddings";

// All Decision database access is centralized here. Ownership is enforced by
// joining through the decision's project to the session user (architecture.md
// §6, rules.md §2) — never by trusting a client-supplied id.

// The four fields whose text feeds the embedding. A change to any of these
// triggers a re-embed; changes to tags/links/decidedBy/decisionDate do not
// (rules.md §1).
type EmbeddedFields = Pick<
  Decision,
  "id" | "title" | "decisionSummary" | "rationale" | "alternativesConsidered"
>;

// Generate the embedding for a decision and write it into the vector column via
// raw SQL (rules.md §4 — the client API can't see the vector type). Embedding
// failures are logged but never break the user's save; the row simply keeps a
// null embedding and can be re-embedded later.
async function embedDecisionRow(decision: EmbeddedFields): Promise<void> {
  try {
    const input = buildEmbeddingInput(decision);
    const values = await embedDocument(input);
    const literal = `[${values.join(",")}]`;
    await prisma.$executeRaw`UPDATE "Decision" SET embedding = ${literal}::vector WHERE id = ${decision.id}`;
  } catch (error) {
    console.error(`Failed to embed decision ${decision.id}:`, error);
  }
}

export type DecisionInput = {
  title: string;
  decisionSummary: string;
  rationale: string;
  decisionDate: Date;
  alternativesConsidered?: string | null;
  decidedBy?: string | null;
  tags?: string[];
  links?: string[];
};

/** List a project's decisions, newest first — but only if the project is the
 * caller's own (verified via getOwnedProject, which throws otherwise). */
export async function listDecisions(
  userId: string,
  projectId: string,
): Promise<Decision[]> {
  await getOwnedProject(userId, projectId);
  return prisma.decision.findMany({
    where: { projectId },
    orderBy: [{ decisionDate: "desc" }, { createdAt: "desc" }],
  });
}

/** Fetch one decision only if it belongs to the caller (join through project).
 * Includes the parent project's id/name plus both sides of the supersession
 * link for display. Throws otherwise. */
export async function getOwnedDecision(userId: string, decisionId: string) {
  const decision = await prisma.decision.findFirst({
    where: { id: decisionId, project: { userId } },
    include: {
      project: { select: { id: true, name: true } },
      // supersededBy: the newer decision that replaces this one.
      supersededBy: { select: { id: true, title: true } },
      // supersedes: the older decision this one replaces (back-relation).
      supersedes: { select: { id: true, title: true } },
    },
  });
  if (!decision) throw new NotFoundError("Decision not found");
  return decision;
}

export async function createDecision(
  userId: string,
  projectId: string,
  input: DecisionInput,
): Promise<Decision> {
  await getOwnedProject(userId, projectId);
  const decision = await prisma.decision.create({
    data: {
      projectId,
      title: input.title,
      decisionSummary: input.decisionSummary,
      rationale: input.rationale,
      decisionDate: input.decisionDate,
      alternativesConsidered: input.alternativesConsidered ?? null,
      decidedBy: input.decidedBy ?? null,
      tags: input.tags ?? [],
      links: input.links ?? [],
    },
  });
  // New decisions always get an embedding.
  await embedDecisionRow(decision);
  return decision;
}

// Validate an explicit supersession link before it's set. `null` (unset) is
// always allowed. Otherwise the target must be a different decision the caller
// owns, in the same project, and not already pointing back at this one (which
// would form a two-decision cycle). The one-to-one @unique on supersededById —
// a decision can supersede at most one other — is enforced by the DB and caught
// as P2002 at write time.
async function assertValidSupersession(
  userId: string,
  current: { id: string; projectId: string },
  supersedingId: string,
): Promise<void> {
  if (supersedingId === current.id) {
    throw new ValidationError("A decision can't supersede itself.");
  }

  let target;
  try {
    target = await getOwnedDecision(userId, supersedingId);
  } catch {
    throw new ValidationError("That decision wasn't found in your projects.");
  }

  if (target.projectId !== current.projectId) {
    throw new ValidationError(
      "A decision can only be superseded by another in the same project.",
    );
  }

  if (target.supersededById === current.id) {
    throw new ValidationError(
      "Those two decisions can't supersede each other.",
    );
  }
}

export async function updateDecision(
  userId: string,
  decisionId: string,
  input: Partial<DecisionInput> & { supersededById?: string | null },
): Promise<Decision> {
  const existing = await getOwnedDecision(userId, decisionId);

  if (
    input.supersededById !== undefined &&
    input.supersededById !== null
  ) {
    await assertValidSupersession(userId, existing, input.supersededById);
  }

  let updated: Decision;
  try {
    updated = await prisma.decision.update({
      where: { id: decisionId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.decisionSummary !== undefined
          ? { decisionSummary: input.decisionSummary }
          : {}),
        ...(input.rationale !== undefined ? { rationale: input.rationale } : {}),
        ...(input.decisionDate !== undefined
          ? { decisionDate: input.decisionDate }
          : {}),
        ...(input.alternativesConsidered !== undefined
          ? { alternativesConsidered: input.alternativesConsidered }
          : {}),
        ...(input.decidedBy !== undefined ? { decidedBy: input.decidedBy } : {}),
        ...(input.tags !== undefined ? { tags: input.tags } : {}),
        ...(input.links !== undefined ? { links: input.links } : {}),
        ...(input.supersededById !== undefined
          ? { supersededById: input.supersededById }
          : {}),
      },
    });
  } catch (error) {
    // @unique on supersededById: the chosen decision already supersedes another.
    if ((error as { code?: string })?.code === "P2002") {
      throw new ValidationError("That decision already supersedes another entry.");
    }
    throw error;
  }

  // Re-embed only when one of the four embedded fields actually changed
  // (rules.md §1) — editing tags/links/decidedBy/decisionDate must not.
  const embeddedFieldChanged =
    (input.title !== undefined && input.title !== existing.title) ||
    (input.decisionSummary !== undefined &&
      input.decisionSummary !== existing.decisionSummary) ||
    (input.rationale !== undefined && input.rationale !== existing.rationale) ||
    (input.alternativesConsidered !== undefined &&
      (input.alternativesConsidered ?? null) !==
        (existing.alternativesConsidered ?? null));

  if (embeddedFieldChanged) {
    await embedDecisionRow(updated);
  }

  return updated;
}

export async function deleteDecision(
  userId: string,
  decisionId: string,
): Promise<void> {
  await getOwnedDecision(userId, decisionId);
  await prisma.decision.delete({ where: { id: decisionId } });
}
