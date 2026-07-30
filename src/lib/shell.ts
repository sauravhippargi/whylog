import { listProjects } from "@/lib/projects";
import type { ShellProject } from "@/components/AppShell";

/**
 * Sidebar data for the app shell: the caller's own active projects.
 *
 * Goes through the shared `listProjects` helper (rules.md §2) so scoping stays
 * in one place — this only reshapes its result for the chrome. Archived
 * projects are left out; they're the soft-removed state.
 */
export async function getShellProjects(userId: string): Promise<ShellProject[]> {
  const projects = await listProjects(userId);
  return projects
    .filter((p) => !p.archivedAt)
    .map((p) => ({ id: p.id, name: p.name }));
}
