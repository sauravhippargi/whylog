import { redirect, notFound } from "next/navigation";

import { auth } from "@/auth";
import { getOwnedDecision } from "@/lib/decisions";
import { getShellProjects } from "@/lib/shell";
import { NotFoundError } from "@/lib/errors";
import { toDateInputValue } from "@/lib/format";
import { AppShell } from "@/components/AppShell";
import { DecisionForm } from "@/components/DecisionForm";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditDecisionPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/");

  const { id } = await params;

  let decision;
  try {
    decision = await getOwnedDecision(session.user.id, id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const shellProjects = await getShellProjects(session.user.id);

  return (
    <AppShell
      email={session.user.email}
      projects={shellProjects}
      currentProject={{ id: decision.project.id, name: decision.project.name }}
    >
      <div className="c-head">
        <div className="min-w-0">
          <h1>Edit decision</h1>
          <p className="c-sub">{decision.title}</p>
        </div>
      </div>

      <div className="c-body mx-auto w-full max-w-2xl">
        {/* The form's own Cancel returns to this decision — the sidebar covers
            project-level navigation, so no header back-link is needed. */}
        <DecisionForm
          mode="edit"
          decisionId={decision.id}
          cancelHref={`/decisions/${decision.id}`}
          initial={{
            title: decision.title,
            decisionDate: toDateInputValue(decision.decisionDate),
            decisionSummary: decision.decisionSummary,
            rationale: decision.rationale,
            alternativesConsidered: decision.alternativesConsidered ?? "",
            decidedBy: decision.decidedBy ?? "",
            tagsText: decision.tags.join(", "),
            linksText: decision.links.join("\n"),
          }}
        />
      </div>
    </AppShell>
  );
}
