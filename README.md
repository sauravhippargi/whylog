# WhyLog

**A searchable memory for the decisions your team makes.**

Live demo → **https://whylogs.vercel.app**

Six months after a call gets made, the "why" behind it is usually gone — buried in
a Slack thread, a stale doc, or someone's memory. What was decided, what
alternatives were weighed, who made the call, and why: all of it evaporates, and
the same debates get relitigated. WhyLog is a running, searchable log of decisions
for a project or initiative, built so you can retrieve the reasoning later by
**asking a question in plain language**, not hunting for keywords.

It's a portfolio project demonstrating a working RAG-style pipeline —
embed → store → retrieve → synthesize — end to end on free-tier infrastructure.

## What it does

- **Semantic search over your decision history.** Ask *"why did we build for the
  app stores instead of shipping a browser-based version?"* and WhyLog returns the
  decision that answers it — even with zero keyword overlap — plus a short
  synthesized verdict that **cites the specific entries** it drew from. When nothing
  in the log is a strong match, it says so rather than inventing an answer.
- **Two ways to capture, because a blank form is rarely the starting point.**
  - *Paste & draft* — drop in a Slack thread or meeting notes and let Gemini draft a
    single decision's fields for you to review and edit before saving.
  - *Bulk import* — paste an existing decision doc (e.g. a PR-FAQ) and Gemini
    extracts every decision into a review queue where you approve, edit, or reject
    each one before committing.
  - A manual form is always there as the fallback.
- **Related decisions.** Every decision's detail page surfaces its nearest
  neighbors within the same project via vector similarity.
- **Supersede chains.** Mark a decision as replaced by a later one; both entries
  show the link bidirectionally ("superseded by" / "supersedes"), so reversals stay
  visible instead of orphaned.
- **A ledger, not a dashboard.** The interface is deliberately archival — ink,
  brass, and stamped entries, dark-mode only — with a single orchestrated moment: a
  brass seal that stamps each new entry as it's logged.

Every decision is embedded on save, so search, related-decisions, and the capture
flows all work off the same vectors.

## Tech stack

- **Next.js** (App Router) + **TypeScript** (strict)
- **Tailwind CSS**
- **Prisma** with the `@prisma/adapter-pg` driver adapter
- **Supabase Postgres** + **pgvector** for embedding storage and cosine-distance search
- **Auth.js** (Credentials provider, JWT sessions)
- **Gemini** — `gemini-embedding-001` (768-dim) for embeddings, `gemini-2.5-flash`
  (temperature 0) for the synthesized answer and the draft/extract flows
- Deployed on **Vercel**

## Running it locally

You'll need a Supabase project (free tier) and a Gemini API key (free tier).

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment.** Copy the example and fill in the values:

   ```bash
   cp .env.example .env
   ```

   | Variable | Purpose |
   |---|---|
   | `DATABASE_URL` | Supabase pooled connection (port 6543, `?pgbouncer=true`) — app runtime |
   | `DIRECT_URL` | Supabase direct/session connection (port 5432) — migrations only |
   | `AUTH_SECRET` | Auth.js session signing secret (`npx auth secret`) |
   | `NEXT_PUBLIC_APP_URL` | Absolute app URL, e.g. `http://localhost:3000` |
   | `GEMINI_API_KEY` | Gemini API key (embeddings + generation) |

3. **Apply the schema.** This runs the Prisma migrations, including the raw-SQL
   migration that enables `pgvector` and adds the `vector(768)` column:

   ```bash
   npx prisma migrate deploy
   ```

4. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000, create an account, and start logging decisions.

### Scripts

```bash
npm run dev        # start the dev server
npm run build      # prisma generate + next build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

## Deploying to Vercel

Set the four runtime variables in the Vercel project (`DATABASE_URL`,
`AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, `GEMINI_API_KEY`) — `DIRECT_URL` is only
needed locally for migrations. Apply migrations once from your machine with
`npx prisma migrate deploy`, then import the repo; the build command
(`prisma generate && next build`) is already set in `package.json`.

---

Planning docs live alongside the code: [`prd.md`](prd.md),
[`architecture.md`](architecture.md), [`rules.md`](rules.md),
[`phases.md`](phases.md), and [`design.md`](design.md).
