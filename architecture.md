# Architecture — WhyLog

## 1. Stack Recap

- Next.js App Router + TypeScript
- Tailwind CSS
- Prisma (ORM)
- Supabase Postgres + `pgvector` extension
- Auth.js, Credentials provider
- Gemini embeddings: `gemini-embedding-001`, output truncated to 768 dimensions via `output_dimensionality` (confirmed at Phase 3; free tier available)
- Gemini generation: `gemini-2.5-flash`, temperature 0, for the synthesized search answer
- Vercel (deploy)

## 2. High-Level Data Flow

```
Client (Next.js)
   │
   ▼
API Routes ──────► Prisma ──────► Supabase Postgres (+ pgvector)
   │
   ▼
Gemini API (embeddings on write, embeddings + generation on search)
```

Two flows touch Gemini:
- **Write path** (create/update a decision) → embed the decision's text → store the vector.
- **Search path** (user asks a question) → embed the query → pgvector similarity search → generate a synthesized answer from the matches.

## 3. Schema (Prisma)

```prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  password  String
  projects  Project[]
  createdAt DateTime  @default(now())
}

model Project {
  id          String     @id @default(cuid())
  userId      String
  user        User       @relation(fields: [userId], references: [id])
  name        String
  description String?
  decisions   Decision[]
  createdAt   DateTime   @default(now())
}

model Decision {
  id                     String    @id @default(cuid())
  projectId              String
  project                Project   @relation(fields: [projectId], references: [id])
  title                  String
  decisionSummary        String
  rationale              String
  alternativesConsidered String?
  decidedBy              String?
  decisionDate           DateTime
  tags                   String[]
  links                  String[]
  supersededById         String?    @unique
  supersededBy           Decision?  @relation("Supersession", fields: [supersededById], references: [id])
  supersedes             Decision?  @relation("Supersession")
  embedding              Unsupported("vector(768)")?  // gemini-embedding-001, truncated to 768 dims via output_dimensionality
  createdAt              DateTime   @default(now())
  updatedAt              DateTime   @updatedAt
}
```

**Note:** Prisma has no native type for `vector`. The column is declared `Unsupported(...)` and reads/writes to it go through `$queryRaw` / `$executeRaw`, not the normal Prisma client API. A raw migration is needed to enable the `pgvector` extension and add the column — this is new territory relative to SyncPM, which didn't need vector search.

## 4. API Routes

| Route | Purpose |
|---|---|
| `POST /api/auth/*` | Auth.js — sign up / login |
| `GET, POST /api/projects` | list / create projects (scoped to session user) |
| `PATCH, DELETE /api/projects/[id]` | rename / archive a project |
| `GET, POST /api/projects/[id]/decisions` | list / create decisions in a project |
| `GET, PATCH, DELETE /api/decisions/[id]` | read / edit / delete a decision |
| `POST /api/search` | `{ query: string, projectId?: string }` → `{ answer: string, matches: Decision[] }` |
| `POST /api/projects/[id]/decisions/draft` | FR8 — `{ rawText: string }` → one candidate decision's fields (not yet saved) |
| `POST /api/projects/[id]/decisions/import` | FR9 — `{ rawDoc: string }` → an array of candidate decisions (not yet saved); a separate commit call creates the accepted ones via the normal create path |

## 5. Core Flows

**Create/update a decision**
1. Client submits form.
2. API route validates input, confirms the project belongs to the session user.
3. Prisma writes the row.
4. Concatenate `title + decisionSummary + rationale + alternativesConsidered` (tags/links excluded — they're structured metadata, not narrative text) and call the Gemini embedding endpoint.
5. Raw SQL update writes the resulting vector into the `embedding` column.

Re-run step 4–5 on any edit that touches one of those four fields.

**Search**
1. Client sends `{ query, projectId? }`.
2. API route embeds the query text via Gemini, with `taskType: RETRIEVAL_QUERY`. This must differ from the `RETRIEVAL_DOCUMENT` task type used when storing decision embeddings (confirmed during Phase 3) — Gemini's embedding space is asymmetric between the two task types, so mismatching them silently degrades match quality rather than erroring.
3. Raw SQL pgvector query: cosine distance (`<=>`) between query embedding and `Decision.embedding`, filtered to `userId` (via project join) and, if `projectId` is present, further filtered to that project. `ORDER BY distance LIMIT k` (start with k = 5).
4. Take the top matches, build a prompt containing their titles/summaries/rationales, and call Gemini (`gemini-2.5-flash`, temp 0) to generate a short answer that cites which decision(s) it's drawing from.
5. Return `{ answer, matches }` — UI renders both together, per your call above.

**Related decisions (detail page)**
- Same pgvector similarity query, using the current decision's own embedding, excluding itself, scoped to the same project (a decision's nearest neighbors are most meaningfully found within its own initiative, not across unrelated ones).

**Supersede**
- Setting `supersededById` on a decision is a simple field update — no embedding recompute needed, since supersession doesn't change the decision's own text.

**Paste & draft (FR8)**
1. Client sends raw pasted text.
2. API route calls Gemini (`gemini-2.5-flash`, temp 0) with a prompt instructing it to extract one candidate decision's fields as structured JSON (title, decisionSummary, rationale, alternativesConsidered, and decidedBy/decisionDate/tags where inferable).
3. Response returned to the client, unsaved — pre-fills the existing `DecisionForm` component.
4. User reviews/edits, then submits through the normal create endpoint. Embedding-on-create fires exactly as it does for a manually-typed decision — this flow only changes how the form gets pre-filled, not the save path.

**Bulk import / migration (FR9)**
1. Client sends a full pasted/uploaded document.
2. API route calls Gemini with a prompt instructing it to segment the document into multiple candidate decisions, returned as a JSON array — same field shape as FR8, one object per decision found.
3. Client renders a review queue; user approves, edits, or rejects each candidate.
4. On commit, only the accepted candidates are created via the normal create endpoint (one call per accepted decision, or a small batch loop) — each triggers embedding-on-create individually, same as any other decision.

## 6. Data Isolation

App-level filtering, not DB-level RLS. Every query that touches `Project` or `Decision` goes through a shared helper (e.g. `getOwnedProject(userId, projectId)`) that throws if the record doesn't belong to the session user, so scoping isn't repeated ad hoc in every route — one place to get it right, matching the pattern SyncPM already uses with Auth.js + Prisma.

## 7. Environment Variables

- `DATABASE_URL` — Supabase Postgres connection string
- `GEMINI_API_KEY`
- `AUTH_SECRET` (Auth.js)
- `NEXT_PUBLIC_APP_URL` — same env-var-driven pattern SyncPM uses, rather than deriving origin at runtime

## 8. Deployment

Vercel, same as SyncPM. No webhooks or OAuth callbacks in this project, so no callback-URL configuration needed.

## 9. Open Technical Risks

- Free-tier rate limits on embedding calls — fine at demo scale (single user, moderate decision volume), but worth a basic retry-with-backoff if bulk operations (e.g. re-embedding many decisions after a schema change) come up.
