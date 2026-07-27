import type { Project } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";

// All Project database access is centralized here so ownership scoping lives in
// one place, never ad hoc in a route handler (architecture.md §6, rules.md §2).
// Every helper takes the session-derived userId; none trusts a client id.

/** List the caller's own projects, newest first (active and archived). */
export async function listProjects(userId: string): Promise<Project[]> {
  return prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Fetch a single project only if it belongs to the caller. Throws NotFoundError
 * otherwise — this is the shared ownership check every mutation routes through.
 */
export async function getOwnedProject(
  userId: string,
  projectId: string,
): Promise<Project> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) throw new NotFoundError("Project not found");
  return project;
}

export async function createProject(
  userId: string,
  input: { name: string; description?: string | null },
): Promise<Project> {
  return prisma.project.create({
    data: {
      userId,
      name: input.name,
      description: input.description ?? null,
    },
  });
}

/** Rename / edit a project. Ownership is enforced via getOwnedProject first. */
export async function updateProject(
  userId: string,
  projectId: string,
  input: { name?: string; description?: string | null },
): Promise<Project> {
  await getOwnedProject(userId, projectId);
  return prisma.project.update({
    where: { id: projectId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
    },
  });
}

/** Archive a project (soft removal — the only removal path). Idempotent. */
export async function archiveProject(
  userId: string,
  projectId: string,
): Promise<Project> {
  const project = await getOwnedProject(userId, projectId);
  if (project.archivedAt) return project;
  return prisma.project.update({
    where: { id: projectId },
    data: { archivedAt: new Date() },
  });
}
