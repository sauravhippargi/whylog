import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { listProjects } from "@/lib/projects";
import { formatStamp } from "@/lib/format";
import { AppHeader } from "@/components/AppHeader";
import { NewProjectForm } from "@/components/NewProjectForm";
import { ProjectRow } from "@/components/ProjectRow";

export default async function DashboardPage() {
  // Authoritative check: always re-derive the session user server-side rather
  // than trusting the client or the optimistic proxy check (rules.md §2).
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Scoped to the session user by the shared data-access helper — the list can
  // only ever contain this account's own projects.
  const projects = await listProjects(session.user.id);
  const active = projects.filter((p) => !p.archivedAt);
  const archived = projects.filter((p) => p.archivedAt);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader email={session.user.email} />

      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          Projects
        </p>
        <h1 className="mb-8 mt-2 font-serif text-3xl text-parchment">
          Your initiatives
        </h1>

        <NewProjectForm />

        <section className="mt-10">
          {active.length === 0 ? (
            <div className="rounded-md border border-dashed border-white/10 bg-surface p-10 text-center">
              <p className="font-serif text-muted">
                No projects yet. Create one to start logging decisions.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border border-white/10">
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
            <div className="overflow-hidden rounded-md border border-white/10">
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
      </main>
    </div>
  );
}
