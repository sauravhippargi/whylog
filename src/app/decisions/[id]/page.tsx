import Link from "next/link";
import { redirect, notFound } from "next/navigation";

import { auth } from "@/auth";
import { getOwnedDecision } from "@/lib/decisions";
import { relatedDecisions } from "@/lib/search";
import { NotFoundError } from "@/lib/errors";
import { formatStamp } from "@/lib/format";
import { AppHeader } from "@/components/AppHeader";
import { DeleteDecisionButton } from "@/components/DeleteDecisionButton";

type PageProps = { params: Promise<{ id: string }> };

// A labeled ledger line: mono label on the left, serif value on the right.
function LedgerLine({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-white/5 py-4 sm:grid-cols-[8rem_1fr] sm:gap-4">
      <span className="pt-0.5 font-mono text-xs uppercase tracking-widest text-muted">
        {label}
      </span>
      <div className="font-serif text-parchment">{children}</div>
    </div>
  );
}

export default async function DecisionPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  let decision;
  try {
    decision = await getOwnedDecision(session.user.id, id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const entryId = decision.id.slice(-8).toUpperCase();
  const related = await relatedDecisions(session.user.id, id);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        email={session.user.email}
        back={{ href: `/projects/${decision.project.id}`, label: decision.project.name }}
      />

      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <div className="flex items-start justify-between gap-4">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            Entry {entryId} · {formatStamp(decision.decisionDate)}
          </p>
          <div className="flex shrink-0 items-center gap-4">
            <Link
              href={`/decisions/${decision.id}/edit`}
              className="font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-brass-light"
            >
              Edit
            </Link>
            <DeleteDecisionButton
              decisionId={decision.id}
              projectId={decision.project.id}
            />
          </div>
        </div>

        <h1 className="mt-3 font-serif text-3xl leading-tight text-parchment">
          {decision.title}
        </h1>

        <div className="mt-8">
          <LedgerLine label="Decided">
            <p className="whitespace-pre-wrap">{decision.decisionSummary}</p>
          </LedgerLine>

          <LedgerLine label="Why">
            <p className="whitespace-pre-wrap">{decision.rationale}</p>
          </LedgerLine>

          {decision.alternativesConsidered && (
            <LedgerLine label="Alternatives">
              <p className="whitespace-pre-wrap">
                {decision.alternativesConsidered}
              </p>
            </LedgerLine>
          )}

          {decision.decidedBy && (
            <LedgerLine label="Who">{decision.decidedBy}</LedgerLine>
          )}

          {decision.tags.length > 0 && (
            <LedgerLine label="Tags">
              <span className="flex flex-wrap gap-2">
                {decision.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-sm border border-white/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </span>
            </LedgerLine>
          )}

          {decision.links.length > 0 && (
            <LedgerLine label="Links">
              <ul className="flex flex-col gap-1">
                {decision.links.map((link) => (
                  <li key={link}>
                    <a
                      href={link}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="break-all font-mono text-sm text-brass-light hover:underline"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </LedgerLine>
          )}
        </div>

        <p className="mt-6 font-mono text-[11px] text-muted">
          Logged {formatStamp(decision.createdAt)} · Updated{" "}
          {formatStamp(decision.updatedAt)}
        </p>

        <section className="mt-12">
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">
            Related decisions
          </p>
          {related.length === 0 ? (
            <p className="font-serif text-sm text-muted">
              No related entries yet.
            </p>
          ) : (
            <div className="overflow-hidden rounded-md border border-white/10">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/decisions/${r.id}`}
                  className="group flex items-baseline gap-3 border-b border-white/5 px-3 py-2 transition-colors last:border-b-0 hover:border-brass/30"
                >
                  <span className="shrink-0 font-mono text-[11px] text-muted">
                    {formatStamp(r.decisionDate)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-sm text-parchment transition-colors group-hover:text-brass-light">
                      {r.title}
                    </p>
                    {r.tags.length > 0 && (
                      <p className="truncate font-mono text-[10px] uppercase tracking-widest text-muted">
                        {r.tags.join(" · ")}
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
