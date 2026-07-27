# WhyLog

A searchable record of the decisions you've made — what was decided, the
alternatives considered, and the reasoning — retrievable later by asking a
natural-language question, not just a keyword search.

Portfolio project. See [`prd.md`](prd.md), [`architecture.md`](architecture.md),
[`rules.md`](rules.md), [`phases.md`](phases.md), and [`design.md`](design.md)
for the full spec. This README covers running and deploying the app.

## Stack

- Next.js 16 (App Router) + TypeScript (strict)
- Tailwind CSS v4
- Prisma 7 (driver-adapter model, `@prisma/adapter-pg`)
- Supabase Postgres (pgvector added in a later phase)
- Auth.js v5 (Credentials provider, JWT sessions)
- Gemini embeddings + generation (added from Phase 3)
- Deployed on Vercel

## Status

Phase 0 (scaffolding) is complete: email/password sign up + login, and an
authenticated dashboard. Projects, decisions, embeddings, and semantic search
land in later phases (see [`phases.md`](phases.md)).

## Environment variables

Copy [`.env.example`](.env.example) to `.env` and fill in the values. The same
keys must be set in the Vercel project for production.

| Variable | Required in Phase 0 | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Supabase Postgres connection string |
| `AUTH_SECRET` | yes | Auth.js JWT/session signing secret |
| `NEXT_PUBLIC_APP_URL` | yes | Absolute app URL (never derived from the request) |
| `GEMINI_API_KEY` | no (placeholder) | Gemini API key, used from Phase 3 onward |

Generate an `AUTH_SECRET` with:

```bash
npx auth secret
```

## Local development

1. Create a Supabase project and copy its Postgres connection string into
   `DATABASE_URL` in `.env`. Use the **direct** connection (port 5432) for
   migrations; the **pooled** connection (port 6543, `?pgbouncer=true`) is
   preferred for the app runtime.
2. Apply the schema to your database:

   ```bash
   npx prisma migrate dev --name init
   ```

3. Run the dev server:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000, create an account, and you land on `/dashboard`.

### Useful scripts

```bash
npm run dev        # start the dev server
npm run build      # prisma generate + next build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

## Deploying to Vercel

1. **Supabase** — create a project (free tier). From Project Settings →
   Database, copy the connection string. Use the pooled connection string
   (port 6543) with `?pgbouncer=true&connection_limit=1` appended for
   `DATABASE_URL` on Vercel.
2. **Apply the schema** to the Supabase database once (from your machine, using
   the direct connection on port 5432):

   ```bash
   npx prisma migrate deploy
   ```

3. **Import the repo** into Vercel (or run `vercel` from the CLI). The build
   command is already `prisma generate && next build` via `package.json`.
4. **Set environment variables** in the Vercel project (Production + Preview):
   `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL` (set this to the
   deployed URL, e.g. `https://whylog.vercel.app`), and `GEMINI_API_KEY`
   (placeholder for now).
5. **Deploy.** Once live, `NEXT_PUBLIC_APP_URL` must match the deployed origin;
   redeploy if you change it.

**Done when:** you can sign up, log in, and see the authenticated dashboard on
the live Vercel URL.
