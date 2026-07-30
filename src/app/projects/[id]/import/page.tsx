import { redirect, notFound } from "next/navigation";

import { auth } from "@/auth";
import { getOwnedProject } from "@/lib/projects";
import { getShellProjects } from "@/lib/shell";
import { NotFoundError } from "@/lib/errors";
import { AppShell } from "@/components/AppShell";
import { ImportPanel } from "@/components/ImportPanel";

type PageProps = { params: Promise<{ id: string }> };

export default async function ImportDecisionsPage({ params }: PageProps) {
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

  const shellProjects = await getShellProjects(session.user.id);

  return (
    <AppShell
      email={session.user.email}
      projects={shellProjects}
      currentProject={{ id: project.id, name: project.name }}
    >
      <div className="c-head">
        <div className="min-w-0">
          <h1>Import decisions</h1>
          <p className="c-sub">{project.name}</p>
        </div>
      </div>

      <div className="c-body mx-auto w-full max-w-2xl">
        <ImportPanel projectId={id} />
      </div>
    </AppShell>
  );
}
