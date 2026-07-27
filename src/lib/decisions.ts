import type { Decision } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import { getOwnedProject } from "@/lib/projects";

// All Decision database access is centralized here. Ownership is enforced by
// joining through the decision's project to the session user (architecture.md
// §6, rules.md §2) — never by trusting a client-supplied id.

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
 * Includes the parent project's id/name for navigation. Throws otherwise. */
export async function getOwnedDecision(userId: string, decisionId: string) {
  const decision = await prisma.decision.findFirst({
    where: { id: decisionId, project: { userId } },
    include: { project: { select: { id: true, name: true } } },
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
  return prisma.decision.create({
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
}

export async function updateDecision(
  userId: string,
  decisionId: string,
  input: Partial<DecisionInput>,
): Promise<Decision> {
  await getOwnedDecision(userId, decisionId);
  return prisma.decision.update({
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
    },
  });
}

export async function deleteDecision(
  userId: string,
  decisionId: string,
): Promise<void> {
  await getOwnedDecision(userId, decisionId);
  await prisma.decision.delete({ where: { id: decisionId } });
}
