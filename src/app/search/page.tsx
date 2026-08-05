import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getOwnedProject } from "@/lib/projects";
import { getShellProjects } from "@/lib/shell";
import { NotFoundError } from "@/lib/errors";
import { AppShell } from "@/components/AppShell";
import { SearchPanel } from "@/components/SearchPanel";

// Next.js 16: searchParams is async.
// `projectId` = the scope actually applied to the search.
// `ctx`       = project context only, when the user widened to all projects —
//               it keeps the scope toggle on screen so widening is reversible.
type PageProps = {
  searchParams: Promise<{ q?: string; projectId?: string; ctx?: string }>;
};

export default async function SearchPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/");

  const { q, projectId, ctx } = await searchParams;
  const shellProjects = await getShellProjects(session.user.id);

  // Only honor an id the caller actually owns — re-derived server-side via the
  // shared ownership helper, never trusted from the query string (rules.md §2).
  async function ownedProject(id?: string) {
    if (!id) return undefined;
    try {
      const project = await getOwnedProject(session!.user!.id, id);
      return { id: project.id, name: project.name };
    } catch (error) {
      if (!(error instanceof NotFoundError)) throw error;
      // Unknown/foreign id: fall back to a global search rather than erroring.
      return undefined;
    }
  }

  const scopedProject = await ownedProject(projectId);
  // Context for the toggle: the applied scope, or the carried-forward project.
  const contextProject = scopedProject ?? (await ownedProject(ctx));

  const query = q?.trim() ?? "";

  return (
    <AppShell
      email={session.user.email}
      projects={shellProjects}
      currentProject={contextProject}
      initialQuery={query}
      scopedToProject={!!scopedProject}
    >
      <div className="c-head">
        <div className="min-w-0">
          <h1>{query ? "Search results" : "Ask your decision log"}</h1>
          <p className="c-sub">
            {scopedProject
              ? `Scoped to ${scopedProject.name}`
              : "Across all projects"}
          </p>
        </div>
      </div>

      <div className="c-body mx-auto w-full max-w-3xl">
        {/* Keyed so each new query remounts with the right initial state. */}
        <SearchPanel
          key={`${query}|${scopedProject?.id ?? ""}`}
          query={query}
          projectId={scopedProject?.id}
        />
      </div>
    </AppShell>
  );
}
