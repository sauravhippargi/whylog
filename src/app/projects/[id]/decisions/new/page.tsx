import { redirect, notFound } from "next/navigation";

import { auth } from "@/auth";
import { getOwnedProject } from "@/lib/projects";
import { NotFoundError } from "@/lib/errors";
import { AppHeader } from "@/components/AppHeader";
import { DecisionForm } from "@/components/DecisionForm";

type PageProps = { params: Promise<{ id: string }> };

export default async function NewDecisionPage({ params }: PageProps) {
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

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        email={session.user.email}
        back={{ href: `/projects/${id}`, label: project.name }}
      />

      <main className="mx-auto w-full max-w-2xl px-6 py-12">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          {project.name}
        </p>
        <h1 className="mb-8 mt-2 font-serif text-3xl text-parchment">
          Log a decision
        </h1>

        <DecisionForm mode="create" projectId={id} cancelHref={`/projects/${id}`} />
      </main>
    </div>
  );
}
