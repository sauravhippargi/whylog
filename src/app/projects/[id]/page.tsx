import Link from "next/link";
import { redirect, notFound } from "next/navigation";

import { auth } from "@/auth";
import { getOwnedProject } from "@/lib/projects";
import { listDecisions } from "@/lib/decisions";
import { getShellProjects } from "@/lib/shell";
import { NotFoundError } from "@/lib/errors";
import { formatStamp } from "@/lib/format";
import { AppShell } from "@/components/AppShell";
import { SupersededTag } from "@/components/SupersededTag";

type PageProps = { params: Promise<{ id: string }> };

export default async function ProjectPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/");

  const { id } = await params;

  let project;
  try {
    project = await getOwnedProject(session.user.id, id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const decisions = await listDecisions(session.user.id, id);
  const shellProjects = await getShellProjects(session.user.id);
  const supersededCount = decisions.filter((d) => d.supersededById).length;

  return (
    <AppShell
      email={session.user.email}
      projects={shellProjects}
      currentProject={{ id: project.id, name: project.name }}
    >
      {/* Page-scoped actions live here, not in the global top bar. */}
      <div className="c-head">
        <div className="min-w-0">
          <h1>{project.name}</h1>
          <p className="c-sub">
            {decisions.length}{" "}
            {decisions.length === 1 ? "decision" : "decisions"}
            {supersededCount > 0 && ` · ${supersededCount} superseded`}
            {project.archivedAt && (
              <span className="text-verdigris"> · Archived</span>
            )}
          </p>
        </div>
        <div className="c-actions">
          <Link
            href={`/projects/${id}/import`}
            className="shell-btn shell-btn-secondary"
          >
            Import
          </Link>
          <Link
            href={`/projects/${id}/decisions/new`}
            className="shell-btn shell-btn-primary"
          >
            + Log decision
          </Link>
        </div>
      </div>

      <div className="c-body">
        {project.description && (
          <p className="mb-6 font-serif text-muted">{project.description}</p>
        )}

        <section>
          {decisions.length === 0 ? (
            <div className="rounded-md border border-dashed border-white/10 bg-surface p-10 text-center">
              <p className="font-serif text-muted">
                No decisions logged yet for this project.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border border-white/10">
              {decisions.map((decision) => (
                <Link
                  key={decision.id}
                  href={`/decisions/${decision.id}`}
                  className="ledger-row group flex items-baseline gap-4 border-b border-white/5 px-4 py-3 last:border-b-0"
                >
                  <span className="shrink-0 font-mono text-xs text-muted">
                    {formatStamp(decision.decisionDate)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      {/* Superseded entries read as historical at a glance. */}
                      <p
                        className={`truncate font-serif transition-colors group-hover:text-brass-light ${
                          decision.supersededById
                            ? "text-parchment/70"
                            : "text-parchment"
                        }`}
                      >
                        {decision.title}
                      </p>
                      {decision.supersededById && <SupersededTag />}
                    </div>
                    {decision.tags.length > 0 && (
                      <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-widest text-muted">
                        {decision.tags.join(" · ")}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
