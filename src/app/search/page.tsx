import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getOwnedProject } from "@/lib/projects";
import { getShellProjects } from "@/lib/shell";
import { NotFoundError } from "@/lib/errors";
import { AppShell } from "@/components/AppShell";
import { SearchPanel } from "@/components/SearchPanel";

// Next.js 16: searchParams is async.
type PageProps = { searchParams: Promise<{ q?: string; projectId?: string }> };

export default async function SearchPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/");

  const { q, projectId } = await searchParams;
  const shellProjects = await getShellProjects(session.user.id);

  // Only honor a projectId the caller actually owns — re-derived server-side
  // via the shared ownership helper, never trusted from the query string
  // (rules.md §2).
  let scopedProject: { id: string; name: string } | undefined;
  if (projectId) {
    try {
      const project = await getOwnedProject(session.user.id, projectId);
      scopedProject = { id: project.id, name: project.name };
    } catch (error) {
      if (!(error instanceof NotFoundError)) throw error;
      // Unknown/foreign id: fall back to a global search rather than erroring.
    }
  }

  const query = q?.trim() ?? "";

  return (
    <AppShell
      email={session.user.email}
      projects={shellProjects}
      currentProject={scopedProject}
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
