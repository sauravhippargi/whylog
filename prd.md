# PRD — WhyLog

## 1. Overview

Teams lose the "why" behind past decisions. Six months after a call gets made, no one can find what was decided, why, what alternatives were considered, or who made the call — it's buried in a Slack thread, a stale doc, or someone's memory. WhyLog is a tool for PMs/TPMs to log decisions against a project/initiative and later retrieve them by asking a natural-language question, not just a keyword search.

This is a portfolio project (same spirit as SyncPM): built to demonstrate real AI-building ability to interviewers, not a UI mockup. No paid APIs or infra — free tiers only.

**Differentiation from SyncPM:** Both projects use extraction, but differently — SyncPM's is automated (a Fathom webhook fires, no human triggers it), while WhyLog's is always a manual paste-and-review action, never a live pipeline. The capability with no SyncPM analog at all is *semantic retrieval* — embeddings, similarity search, and a synthesized answer over your own historical data — and that's the more novel half of WhyLog's AI story.

## 2. Goals

- Demonstrate a working RAG-style semantic search pipeline (embed → store → retrieve → synthesize) using free-tier tools end to end.
- Ship something a PM interviewer immediately understands the value of within 10 seconds of a demo.
- Keep scope tight enough to actually finish and deploy, like SyncPM and Meridian.

## 3. Non-Goals (v1)

- Team collaboration: invites, shared projects, roles/permissions. Framed as a multi-tenant SaaS product, but each account's data is private to that account — no real "team" feature.
- Integrations with Jira/Slack/Fathom or any external system.
- Notifications, reminders, approval workflows.
- Mobile app / native clients.
- Automated or webhook-based capture (e.g. a live meeting-transcript pipeline, à la SyncPM's Fathom integration). Capture in WhyLog is always a manual paste-and-review action — see FR8/FR9 in Section 7 — never something that runs without the user triggering it.

## 4. Target User / Persona

Primary: a PM or TPM who wants a running, searchable record of the calls they've made across their initiatives — for their own reference, and to demonstrate "why" to stakeholders later without digging through old docs.

Framing note: no real team will use this day-to-day. The product is designed *as if* institutional memory loss is the problem being solved, because that's the honest and compelling framing for a portfolio demo — but the build itself only needs to support isolated, single-owner accounts.

Two real scenarios shape how decisions actually get in: (1) a PM starting to log decisions for a new initiative as they happen, usually from whatever rough material already exists (Slack threads, meeting notes) rather than nothing; and (2) a PM inheriting or backfilling history that already exists somewhere else — most often a PR-FAQ or a "Decisions" section in an existing doc, containing many decisions at once. Neither scenario is well served by a blank form as the primary input method — see FR8/FR9.

## 5. Core Concepts

- **Project / Initiative** — a named container for related decisions (e.g. "Q3 Roadmap," "Mobile Redesign"). Every decision belongs to exactly one project.
- **Decision** — the core record. Fields:
  - Title / short summary
  - What was decided
  - Rationale (why)
  - Alternatives considered (free text)
  - Decided by (free text — name/role, not necessarily tied to a user account)
  - Decision date
  - Tags (freeform)
  - External links (optional — doc, ticket, thread URL, no live integration)
  - Superseded-by (optional link to another decision in the same project)
- **Embedding** — a vector representation of a decision's searchable text (title + decision + rationale + alternatives), stored alongside the record for similarity search.

## 6. User Flow

1. **Sign in** — Auth.js Credentials provider, same pattern as SyncPM.
2. **Create/select a project** — e.g. "Mobile Redesign."
3. **Log a decision** — three ways in: (a) fill the form directly, (b) paste any raw source text (Slack thread, notes, doc excerpt) and let Gemini draft one candidate entry for review before saving, or (c) paste/upload an entire existing decision document (e.g. a PR-FAQ) and let Gemini extract multiple candidates into a bulk review queue — approve, edit, or reject each before committing. The blank form is the fallback when there's nothing to paste, not the primary path.
4. **On save** — backend concatenates the relevant text fields, calls the Gemini embedding endpoint, stores the vector in Supabase (pgvector) alongside the structured record.
5. **Browse** — timeline/list view of decisions within a project, filterable by tag/date.
6. **Semantic search** — user asks a natural-language question, either scoped to a project or across all their projects (e.g. "why did we deprioritize the mobile redesign"). Query is embedded, pgvector similarity search returns the top-k matching decisions, and Gemini generates a short synthesized answer that cites the matched decision(s) by name/link — not just a bare list of results.
7. **Decision detail page** — full record, plus an auto-surfaced "related decisions" panel (same-project vector neighbors, excluding itself).
8. **Supersede** — a decision can be marked as superseded by a later one; both records show the link (badge + "supersedes" / "superseded by"), so reversals are visible instead of orphaned.

## 7. Functional Requirements

| # | Requirement |
|---|---|
| FR1 | Auth — email/password sign up and login (Auth.js Credentials), account-scoped data via row-level isolation |
| FR2 | Projects — create, rename, archive |
| FR3 | Decisions — full CRUD within a project |
| FR4 | Embedding generation on decision create/update, stored in pgvector |
| FR5 | Semantic search — project-scoped or global, returns ranked matches + a short Gemini-synthesized answer citing them |
| FR6 | Related decisions — auto vector-similarity lookup on the detail page |
| FR7 | Supersede — link a decision to the one that replaces it, shown bidirectionally |
| FR8 | Paste & draft (single decision) — user pastes any raw source text, Gemini drafts one candidate decision's fields, user reviews and edits before saving. Human-in-the-loop by design — no unreviewed AI output becomes the record of record. |
| FR9 | Bulk import (migration) — user pastes/uploads an existing decision document, Gemini extracts multiple candidate decisions into a review queue (approve/edit/reject each), accepted batch committed on confirm. Same human-in-the-loop principle as FR8, applied to many entries at once. |

## 8. Tech Stack

Matches SyncPM where possible, for consistency and speed:

- Next.js App Router + TypeScript
- Tailwind CSS
- Prisma
- Supabase Postgres + pgvector extension
- Vercel (deploy)
- Auth.js, Credentials provider
- Gemini embeddings — `gemini-embedding-001`, output truncated to 768 dimensions via the `output_dimensionality` parameter (confirmed at Phase 3 implementation time; free tier available for this usage)
- Gemini generation (`gemini-2.5-flash`, temperature 0) for the synthesized search answer, and for the FR8/FR9 draft-and-extract flows

## 9. Data Model (high-level)

- `User` — id, email, hashed password
- `Project` — id, user_id, name, description, created_at
- `Decision` — id, project_id, title, decision_summary, rationale, alternatives_considered, decided_by, decision_date, tags[], links[], superseded_by_id (nullable, self-referencing), embedding (vector), created_at, updated_at

## 10. Success Criteria (portfolio context)

Not usage metrics — this isn't measured by real adoption. Success = a live, deployed demo where:
- A search query with zero keyword overlap with the original entry still returns the right decision.
- The synthesized answer correctly cites the matched decision(s).
- The full pipeline (log → embed → store → retrieve → synthesize) is visibly real, not mocked, in an interview walkthrough.

## 11. Open Items

- FR9's extraction quality (how well Gemini segments a messy real-world doc into distinct decisions) is unproven until Phase 4 — worth stress-testing on an actual PR-FAQ, not just clean sample text.

