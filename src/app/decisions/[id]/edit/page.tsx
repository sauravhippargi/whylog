import { redirect, notFound } from "next/navigation";

import { auth } from "@/auth";
import { getOwnedDecision } from "@/lib/decisions";
import { NotFoundError } from "@/lib/errors";
import { toDateInputValue } from "@/lib/format";
import { AppHeader } from "@/components/AppHeader";
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

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        email={session.user.email}
        back={{ href: `/decisions/${decision.id}`, label: decision.title }}
      />

      <main className="mx-auto w-full max-w-2xl px-6 py-12">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          {decision.project.name}
        </p>
        <h1 className="mb-8 mt-2 font-serif text-3xl text-parchment">
          Edit decision
        </h1>

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
      </main>
    </div>
  );
}
