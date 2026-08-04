import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { listProjects } from "@/lib/projects";
import { formatStamp } from "@/lib/format";
import { AppShell } from "@/components/AppShell";
import { NewProjectForm } from "@/components/NewProjectForm";
import { ProjectRow } from "@/components/ProjectRow";

export default async function DashboardPage() {
  // Authoritative check: always re-derive the session user server-side rather
  // than trusting the client or the optimistic proxy check (rules.md §2).
  const session = await auth();
  if (!session?.user) redirect("/");

  // Scoped to the session user by the shared data-access helper — the list can
  // only ever contain this account's own projects.
  const projects = await listProjects(session.user.id);
  const active = projects.filter((p) => !p.archivedAt);
  const archived = projects.filter((p) => p.archivedAt);

  // Same shell as every other view; no project highlighted in the sidebar.
  const shellProjects = active.map((p) => ({ id: p.id, name: p.name }));

  return (
    <AppShell email={session.user.email} projects={shellProjects}>
      <div className="c-head">
        <div>
          <h1>Your initiatives</h1>
          <p className="c-sub">
            {active.length} {active.length === 1 ? "project" : "projects"}
            {archived.length > 0 && ` · ${archived.length} archived`}
          </p>
        </div>
      </div>

      <div className="c-body">
        <div id="new-project" className="scroll-mt-24">
          <NewProjectForm />
        </div>

        <section className="mt-8">
          {active.length === 0 ? (
            <div className="rounded-md border border-dashed border-rule bg-surface p-10 text-center">
              <p className="font-serif text-muted">
                No projects yet. Create one to start logging decisions.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border border-rule">
              {active.map((project) => (
                <ProjectRow
                  key={project.id}
                  id={project.id}
                  name={project.name}
                  description={project.description}
                  dateStamp={formatStamp(project.createdAt)}
                  archived={false}
                />
              ))}
            </div>
          )}
        </section>

        {archived.length > 0 && (
          <section className="mt-10">
            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">
              Archived
            </p>
            <div className="overflow-hidden rounded-md border border-rule">
              {archived.map((project) => (
                <ProjectRow
                  key={project.id}
                  id={project.id}
                  name={project.name}
                  description={project.description}
                  dateStamp={formatStamp(project.createdAt)}
                  archived={true}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
