# Phases — WhyLog

Deploy early and often (same as SyncPM) — get a live Vercel URL working from Phase 0 onward, rather than building everything locally and deploying once at the end.

## Phase 0 — Scaffolding
- Next.js App Router + TypeScript + Tailwind setup
- Prisma init, Supabase Postgres connection
- Auth.js Credentials provider (sign up / login)
- Deploy skeleton to Vercel, confirm env vars (`DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`) work in production

**Done when:** you can sign up, log in, and see an empty authenticated dashboard on a live URL.

## Phase 1 — Projects
- `Project` model (no `Decision` yet)
- Ownership-check helper (`getOwnedProject`)
- Project CRUD: create, rename, archive
- Project list UI

**Done when:** a logged-in user can create and manage projects, scoped to their own account.

## Phase 2 — Decisions (plain CRUD, no AI yet)
- `Decision` model, including `supersededById` field (built now, wired up in Phase 6)
- Decision create/edit form (all PRD fields)
- Decision list/timeline view within a project
- Decision detail page

**Done when:** a user can fully log and browse decisions with no AI involved — the core object model is solid before AI complexity gets layered on.

## Phase 3 — Embeddings
- Enable `pgvector` extension, raw-SQL migration for the `embedding` column
- Gemini embedding call on decision create/update (concatenated `title + decisionSummary + rationale + alternativesConsidered`)
- `$queryRaw`/`$executeRaw` read-write layer for the vector column

**Done when:** every decision silently gets an embedding on save, verifiable by inspecting the DB — no user-facing feature yet.

## Phase 4 — Semantic Search
- `/api/search` endpoint: embed query → pgvector similarity query (global or project-scoped) → Gemini-synthesized answer
- Search UI: input, synthesized answer, matched decision cards shown together

**Done when:** a natural-language question with no keyword overlap with the original entry returns the right decision, with a synthesized answer citing it.

## Phase 5 — Related Decisions
- Similarity query on the detail page (same project, excluding itself)
- "Related decisions" panel

**Done when:** opening any decision shows a handful of genuinely related ones underneath it.

## Phase 6 — Supersede
- UI to mark a decision as superseded by another (search/select within the project)
- Bidirectional display: "Superseded by X" / "Supersedes Y" badges

**Done when:** a chain of reversed decisions is visibly traceable instead of orphaned.

## Phase 7 — Design Pass
- Apply the palette/system decided in design.md
- Empty states, loading states, error handling across all flows
- Responsive pass

## Phase 8 — Stretch (optional, only if time allows)
- FR8: "Paste & draft" — paste transcript excerpt, Gemini drafts fields, user reviews/edits before save

## Phase 9 — Wrap-up
- Final deploy check
- Add to portfolio site
