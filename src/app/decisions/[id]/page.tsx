import Link from "next/link";
import { redirect, notFound } from "next/navigation";

import { auth } from "@/auth";
import { getOwnedDecision, listDecisions } from "@/lib/decisions";
import { relatedDecisions } from "@/lib/search";
import { NotFoundError } from "@/lib/errors";
import { formatStamp } from "@/lib/format";
import { AppHeader } from "@/components/AppHeader";
import { DeleteDecisionButton } from "@/components/DeleteDecisionButton";
import { SupersedeControl } from "@/components/SupersedeControl";
import { EntryStamp } from "@/components/EntryStamp";
import { SupersededTag } from "@/components/SupersededTag";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ stamped?: string }>;
};

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

export default async function DecisionPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/");

  const { id } = await params;
  const { stamped } = await searchParams;

  let decision;
  try {
    decision = await getOwnedDecision(session.user.id, id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const entryId = decision.id.slice(-8).toUpperCase();
  const related = await relatedDecisions(session.user.id, id);

  // Other decisions in this project, for the supersede picker (excludes self).
  const supersedeOptions = (
    await listDecisions(session.user.id, decision.project.id)
  )
    .filter((d) => d.id !== decision.id)
    .map((d) => ({
      id: d.id,
      title: d.title,
      dateStamp: formatStamp(d.decisionDate),
    }));

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        email={session.user.email}
        back={{ href: `/projects/${decision.project.id}`, label: decision.project.name }}
      />

      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <div className="flex items-start justify-between gap-4">
          <EntryStamp
            entryId={entryId}
            dateStamp={formatStamp(decision.decisionDate)}
            animate={stamped === "1"}
          />
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

        {/* Supersession — bidirectional brass-seal / verdigris badges + control. */}
        <div className="mt-4 flex flex-col items-start gap-3">
          {decision.supersededBy && (
            <div className="inline-flex items-center gap-2 rounded-sm border border-brass/50 bg-brass/10 px-3 py-1.5">
              <span className="font-mono text-[10px] uppercase tracking-widest text-brass">
                ◈ Superseded by
              </span>
              <Link
                href={`/decisions/${decision.supersededBy.id}`}
                className="font-serif text-sm text-brass-light hover:underline"
              >
                {decision.supersededBy.title}
              </Link>
            </div>
          )}
          {decision.supersedes && (
            <div className="inline-flex items-center gap-2 rounded-sm border border-verdigris/50 bg-verdigris/10 px-3 py-1.5">
              <span className="font-mono text-[10px] uppercase tracking-widest text-verdigris">
                Supersedes
              </span>
              <Link
                href={`/decisions/${decision.supersedes.id}`}
                className="font-serif text-sm text-parchment hover:text-brass-light hover:underline"
              >
                {decision.supersedes.title}
              </Link>
            </div>
          )}
          <SupersedeControl
            decisionId={decision.id}
            current={
              decision.supersededBy
                ? { id: decision.supersededBy.id, title: decision.supersededBy.title }
                : null
            }
            options={supersedeOptions}
          />
        </div>

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
                  className="ledger-row group flex items-baseline gap-3 border-b border-white/5 px-3 py-2 last:border-b-0"
                >
                  <span className="shrink-0 font-mono text-[11px] text-muted">
                    {formatStamp(r.decisionDate)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <p
                        className={`truncate font-serif text-sm transition-colors group-hover:text-brass-light ${
                          r.supersededById
                            ? "text-parchment/70"
                            : "text-parchment"
                        }`}
                      >
                        {r.title}
                      </p>
                      {r.supersededById && <SupersededTag />}
                    </div>
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
