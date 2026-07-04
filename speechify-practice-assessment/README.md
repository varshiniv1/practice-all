# SnapFeed — Practice Audit Assessment

This is a **practice repo**, built to mirror the format of Speechify's
first-round technical assessment as closely as possible based on public
candidate reports (Glassdoor, Medium, Substack) as of mid-2026. It is not
Speechify's actual test and won't be identical, but the structure, task
framing, and mix of issue categories are designed to be very close.

## The scenario

SnapFeed is a small full-stack social app: users can register, log in,
post, and bookmark posts. It "works," but it has a set of issues spanning
**security, performance, reliability, and developer tooling** — planted
by someone who was moving fast. Some are obvious once you look; some only
show up once you trace a request end-to-end.

## Your task

1. **Set a 90-minute timer.** Treat it like the real thing.
2. Read the codebase — `apps/api` (Express/TypeScript) and `apps/web`
   (React/Vite/TypeScript) — before changing anything.
3. Find and fix issues. You are encouraged to use AI tools, the same way
   the real assessment allows it.
4. For each fix, write a short justification: what the problem is, how
   severe it is, how it could be triggered/exploited, and why your fix is
   the right one.
5. Commit atomically — one commit per issue, with a clear message.
6. Keep existing tests passing (`pnpm test`), and don't break behavior
   that isn't actually broken. Resist the urge to rewrite everything.

## Getting set up

```bash
corepack enable
pnpm install

# terminal 1
pnpm dev:api

# terminal 2
pnpm dev:web
```

- API: http://localhost:4000
- Web: http://localhost:5173
- Run unit tests: `pnpm test`
- Run lint: `pnpm lint`
- Run functional tests (needs `pnpm dlx playwright install` first):
  `pnpm test:e2e`

Seeded users (for manual testing): `alice` / `alice123`, `bob` / `bob123`,
`root` / `Admin123!` (admin flag set, but nothing currently checks it).

## What's being evaluated (mirrors the real rubric)

| Criteria | What it means here |
|---|---|
| Diagnostic depth | Did you find root causes, not just symptoms? |
| Solution quality | Minimal, surgical fixes — not a rewrite |
| Backwards compatibility | Do all existing tests still pass? |
| Documentation | Clear write-up per fix |
| Systems thinking | Did you consider scale / migration path, not just "make it pass"? |

## After you're done

Open `ANSWER_KEY.md` to compare against the planted issues, see which
category each one falls into, and check your severity calls. Don't peek
before your timer runs out.

## A note on scope

There are more issues here than you'll realistically fix in 90 minutes —
that's intentional. The real test's own guidance says to prioritize
ruthlessly rather than skim everything. Practice picking 2-4 issues you
can diagnose and fix *thoroughly*, and write brief notes on anything else
you spotted but didn't have time for.
