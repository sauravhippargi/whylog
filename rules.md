# Rules — WhyLog

Conventions and guardrails for any code written in this repo. These exist to prevent the specific mistakes that came up on SyncPM, plus general good practice for this stack.

## 1. AI / Gemini Rules

- **Verify model names before use.** Gemini model names have moved before (`gemini-2.5-flash-lite` was deprecated mid-project on SyncPM). Confirm the current embedding model name and the current `gemini-2.5-flash` availability before writing any call to them, not after something breaks.
- **Temperature 0 for anything requiring consistency.** The search-answer generation and any future drafting feature (FR8) must run at temperature 0. SyncPM's extraction non-determinism was root-caused to temperature — don't reintroduce that bug here.
- **Never fabricate data in generated output.** The synthesized search answer must only reference decisions actually returned by the similarity query. If the top match's distance is weak/low-confidence, say so rather than inventing a confident-sounding answer.
- **Re-embed only on relevant field changes.** Editing `tags`, `links`, `decidedBy`, or `decisionDate` does not require a re-embed. Editing `title`, `decisionSummary`, `rationale`, or `alternativesConsidered` does.

## 2. Data & Security Rules

- **Every query touching `Project` or `Decision` must go through the shared ownership-check helper** (`getOwnedProject`, or equivalent for decisions) — never filter by `userId` inline and ad hoc in a route handler. One helper, one place to get scoping right.
- **Never trust a client-supplied `userId` or `projectId` as authorization.** Always re-derive the session user from Auth.js and check ownership server-side, even if the client only ever sends its own IDs.
- **Validate all input server-side** (required fields, string length limits, date format) — don't rely on client-side form validation alone.

## 3. Environment & Config Rules

- **No hardcoded URLs, keys, or secrets.** `NEXT_PUBLIC_APP_URL`, `DATABASE_URL`, `GEMINI_API_KEY`, and `AUTH_SECRET` are the only ways these values enter the code.
- **Derive nothing from runtime request origin.** Use the env var, not `req.headers.host` or similar — this was a SyncPM lesson (callback URLs must use explicit env vars, not derived origins).

## 4. Vector / Embedding Rules

- **All `embedding` column reads/writes go through `$queryRaw` / `$executeRaw`.** Prisma's normal client API cannot see the `vector` type — don't attempt to read/write it through standard Prisma calls.
- **Keep the embedding-input concatenation consistent everywhere it happens** (creation, edit, and any backfill script) — same field order, same separator. A drifted concatenation format silently degrades search quality without throwing an error.
- **pgvector migrations are raw SQL**, not Prisma-managed schema changes — the extension enable and vector column need a manual migration file.

## 5. Code Style

- TypeScript strict mode on.
- Next.js App Router conventions — route handlers in `app/api/**/route.ts`, server components by default, `"use client"` only where interactivity requires it.
- Match SyncPM's existing formatting/linting setup rather than introducing a new one.

## 6. Stack-Specific Notes (confirmed during Phase 0)

- **Route protection lives in `proxy.ts`, not `middleware.ts`.** Next.js 16 renamed the convention to clarify its role at the network boundary; `proxy.ts` runs on the Node.js runtime.
- **Prisma Client requires a driver adapter.** We use `@prisma/adapter-pg`. The client generates to `src/generated/prisma` — always import from there, never from `@prisma/client`.
- **Watch the pg driver's connection timeout.** Unlike Prisma's old bundled engine, the `pg` driver has no default connection timeout — set `connectionTimeoutMillis` and `max` explicitly on the adapter to avoid hangs on a bad connection.

## 7. Working With Claude Code

- One feature per prompt — don't bundle unrelated changes (e.g. don't mix a schema change with a UI change) in a single code prompt.
- Schema changes (new Prisma models, new migrations) should be called out explicitly in the prompt, not buried inside a larger feature request.
- If a prompt would require adding a new dependency not already listed in architecture.md, flag it rather than installing silently.
