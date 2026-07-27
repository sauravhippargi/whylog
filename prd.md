# PRD — WhyLog

## 1. Overview

Teams lose the "why" behind past decisions. Six months after a call gets made, no one can find what was decided, why, what alternatives were considered, or who made the call — it's buried in a Slack thread, a stale doc, or someone's memory. WhyLog is a tool for PMs/TPMs to log decisions against a project/initiative and later retrieve them by asking a natural-language question, not just a keyword search.

This is a portfolio project (same spirit as SyncPM): built to demonstrate real AI-building ability to interviewers, not a UI mockup. No paid APIs or infra — free tiers only.

**Differentiation from SyncPM:** SyncPM's AI story is *extraction* (transcript → structured tickets). This project's AI story is *semantic retrieval* — embeddings, similarity search, and (optionally) a synthesized answer over your own historical data. Two portfolio pieces, two distinct capabilities.

## 2. Goals

- Demonstrate a working RAG-style semantic search pipeline (embed → store → retrieve → synthesize) using free-tier tools end to end.
- Ship something a PM interviewer immediately understands the value of within 10 seconds of a demo.
- Keep scope tight enough to actually finish and deploy, like SyncPM and Meridian.

## 3. Non-Goals (v1)

- Team collaboration: invites, shared projects, roles/permissions. Framed as a multi-tenant SaaS product, but each account's data is private to that account — no real "team" feature.
- Integrations with Jira/Slack/Fathom or any external system.
- Notifications, reminders, approval workflows.
- Mobile app / native clients.
- Automated decision capture from meeting transcripts (see Section 7 — deferred to phase 2 as an optional, human-reviewed assist, not an automated pipeline).

## 4. Target User / Persona

Primary: a PM or TPM who wants a running, searchable record of the calls they've made across their initiatives — for their own reference, and to demonstrate "why" to stakeholders later without digging through old docs.

Framing note: no real team will use this day-to-day. The product is designed *as if* institutional memory loss is the problem being solved, because that's the honest and compelling framing for a portfolio demo — but the build itself only needs to support isolated, single-owner accounts.

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
3. **Log a decision** within that project via a form (fields above).
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
| FR8 (phase 2, optional) | "Paste & draft" — paste a transcript excerpt, Gemini drafts the decision/rationale/alternatives fields, PM reviews and edits before saving. Human-in-the-loop by design — no unreviewed AI output becomes the record of record. |

## 8. Tech Stack

Matches SyncPM where possible, for consistency and speed:

- Next.js App Router + TypeScript
- Tailwind CSS
- Prisma
- Supabase Postgres + pgvector extension
- Vercel (deploy)
- Auth.js, Credentials provider
- Gemini embeddings endpoint (confirm current free-tier model name at implementation time — model names have moved before, e.g. the `gemini-2.5-flash-lite` deprecation we hit on SyncPM)
- Gemini generation (`gemini-2.5-flash`, temperature 0) for the synthesized search answer and, later, phase-2 drafting

## 9. Data Model (high-level)

- `User` — id, email, hashed password
- `Project` — id, user_id, name, description, created_at
- `Decision` — id, project_id, title, decision_summary, rationale, alternatives_considered, decided_by, decision_date, tags[], links[], superseded_by_id (nullable, self-referencing), embedding (vector), created_at, updated_at

## 10. Success Criteria (portfolio context)

Not usage metrics — this isn't measured by real adoption. Success = a live, deployed demo where:
- A search query with zero keyword overlap with the original entry still returns the right decision.
- The synthesized answer correctly cites the matched decision(s).
- The full pipeline (log → embed → store → retrieve → synthesize) is visibly real, not mocked, in an interview walkthrough.

## 11. Open Items / Phase 2

- FR8 (paste & draft) — build only if time allows after core search/log flow is solid.
- Confirm current Gemini embedding model name before writing embedding code (same check we do for generation models).

