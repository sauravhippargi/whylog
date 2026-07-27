import Link from "next/link";
import { redirect, notFound } from "next/navigation";

import { auth } from "@/auth";
import { getOwnedProject } from "@/lib/projects";
import { listDecisions } from "@/lib/decisions";
import { NotFoundError } from "@/lib/errors";
import { formatStamp } from "@/lib/format";
import { AppHeader } from "@/components/AppHeader";

type PageProps = { params: Promise<{ id: string }> };

export default async function ProjectPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  let project;
  try {
    project = await getOwnedProject(session.user.id, id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const decisions = await listDecisions(session.user.id, id);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        email={session.user.email}
        back={{ href: "/dashboard", label: "Projects" }}
      />

      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Project
              {project.archivedAt && (
                <span className="ml-2 text-verdigris">· Archived</span>
              )}
            </p>
            <h1 className="mt-2 font-serif text-3xl text-parchment">
              {project.name}
            </h1>
            {project.description && (
              <p className="mt-2 font-serif text-muted">{project.description}</p>
            )}
            <Link
              href={`/search?projectId=${id}`}
              className="mt-3 inline-block font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-brass-light"
            >
              Search →
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href={`/projects/${id}/import`}
              className="rounded-sm border border-brass/40 px-4 py-2 font-mono text-xs font-medium uppercase tracking-widest text-brass-light transition-colors hover:border-brass"
            >
              Import
            </Link>
            <Link
              href={`/projects/${id}/decisions/new`}
              className="rounded-sm bg-brass px-4 py-2 font-mono text-xs font-medium uppercase tracking-widest text-ink transition-opacity hover:opacity-90"
            >
              Log decision
            </Link>
          </div>
        </div>

        <section className="mt-10">
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
                    <p className="truncate font-serif text-parchment transition-colors group-hover:text-brass-light">
                      {decision.title}
                    </p>
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
      </main>
    </div>
  );
}
