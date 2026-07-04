# Answer Key — Don't peek until your timer is up

Legend: 🔴 Critical  🟠 High  🟡 Medium  🟢 Low

## Security

1. 🔴 **Auth bypass via unverified JWT fallback** — `apps/api/src/middleware/auth.ts`.
   `jwt.verify()` is called but if it throws, the `catch` block still trusts
   `jwt.decode()` (which does **not** check the signature) and calls
   `next()` anyway. Anyone can forge a token with `{sub: "admin", isAdmin: true}`,
   sign it with garbage, and be treated as authenticated/admin. Also passes
   `algorithms: undefined` instead of pinning an allowed algorithm list.
   *Fix*: on verify failure, reject the request. Pin `algorithms: ["HS256"]`.

2. 🔴 **Remote code execution via `eval`** — `apps/api/src/utils/search.ts`.
   The `filter` query param is passed straight into `eval()`. Reachable from
   the UI's search box (`SearchBar.tsx` builds the expression from raw
   keystrokes) with zero sanitization. `?filter=require('child_process').execSync('id')`
   (or the browser equivalent) runs arbitrary code on the server.
   *Fix*: replace with a small allow-listed filter DSL (e.g. field + operator
   + value, parsed and matched explicitly) — never `eval`/`new Function` on
   user input.

3. 🟠 **Broken access control / IDOR** — `apps/api/src/routes/users.ts`.
   `PATCH /users/:id` requires *a* valid token but never checks the token's
   subject matches `:id` — any logged-in user can edit any other user's
   profile. `GET /users/` is commented as "admin-only" but never checks
   `req.user.isAdmin`, leaking every user's email to any authenticated caller.
   *Fix*: compare `req.user.sub === req.params.id` (or `isAdmin`); gate the
   listing route on `req.user.isAdmin`.

4. 🟠 **Path traversal** — `apps/api/src/routes/posts.ts`,
   `GET /posts/attachments/:file`. `req.params.file` is joined into a
   filesystem path with no normalization/allow-listing, so
   `../../../../etc/passwd`-style values escape the attachments directory.
   *Fix*: resolve the path and verify it's still inside `ATTACHMENTS_DIR`
   (e.g. `path.resolve` + prefix check), or map to an allow-listed set of
   known filenames.

5. 🟠 **Stored XSS** — `apps/web/src/components/PostList.tsx` renders post
   bodies via `dangerouslySetInnerHTML` with no sanitization; seed data
   even includes a post with an `<img onerror>` payload. Combined with the
   fact that `client.ts` stores the auth token in `localStorage`, this is a
   full session-hijack chain: XSS → read `localStorage.token` → impersonate
   the user.
   *Fix*: render post bodies as text (React escapes by default) or run
   through a sanitizer (e.g. DOMPurify) if HTML must be supported. Consider
   moving tokens to an httpOnly cookie so XSS alone can't exfiltrate them.

6. 🟡 **Weak, unsalted password hashing** — `apps/api/src/db.ts` uses
   `md5(password)` with no salt. Trivially rainbow-tableable.
   *Fix*: use `bcrypt`/`argon2` with a per-user salt and appropriate work factor.

7. 🟡 **Sensitive data over-exposure** — `apps/api/src/routes/auth.ts`
   returns the full `User` object (including `passwordHash`) in the
   register/login response bodies.
   *Fix*: return a `PublicUser`-shaped object, never the hash.

8. 🟡 **Permissive CORS with credentials** — `apps/api/src/index.ts` sets
   `origin: true, credentials: true`, i.e. reflects any origin while
   allowing credentialed requests — defeats the purpose of CORS as a
   cross-site request guard.
   *Fix*: use an explicit origin allow-list.

9. 🟢 **Secrets committed to the repo** — `.env` is tracked (not in
   `.gitignore`) and contains a live-looking `JWT_SECRET` and
   `ANALYTICS_API_KEY`; the same analytics key is also hardcoded directly
   into the frontend bundle in `apps/web/src/api/client.ts`, so it ships to
   every browser that loads the page.
   *Fix*: add `.env` to `.gitignore`, rotate the leaked secrets, load
   frontend-safe config only (never secrets) via build-time env vars, and
   keep the real analytics key server-side.

## Performance

10. 🟠 **N+1-style sequential lookups** — `GET /posts` in `posts.ts` awaits
    `lookupAuthor()` one post at a time in a `for` loop, each with a
    simulated 25ms round-trip. 40 posts ≈ 1s of pure serialized latency
    that grows linearly with feed size.
    *Fix*: `Promise.all` the lookups, or better, batch-fetch all needed
    authors in one call and map them in memory.

11. 🟠 **No pagination on the main feed** — same route returns every post
    in one response with no `limit`/`cursor`, which won't scale past a
    trivial dataset size.
    *Fix*: add cursor- or offset-based pagination.

12. 🟡 **O(n²) synchronous report endpoint** — `GET /posts/report/slow`
    nested-loops over all posts on the request thread, blocking the Node
    event loop for the duration (worse as the dataset grows).
    *Fix*: index posts by `authorId` once (O(n)) and derive the count from
    group sizes, or move heavy reports off the request path entirely.

13. 🟢 **No debounce on search input** — `SearchBar.tsx` fires a network
    request on every keystroke.
    *Fix*: debounce/throttle, or only search on submit/pause.

## Reliability

14. 🔴 **Unhandled promise rejection** — `GET /trending` in `index.ts`
    calls `fetchTrendingTopics().then(...)` with no `.catch`; the function
    throws ~30% of the time. Depending on Node version/config this can
    crash the process or leave the request hanging with no response.
    *Fix*: wrap in try/catch (or `.catch`) and return a proper error
    response; consider a global unhandled-rejection handler as a backstop.

15. 🟠 **Race condition on bookmark toggle** — `BookmarkButton.tsx` has no
    guard against overlapping requests (double-click, slow network), and
    the server does a non-atomic read-modify-write on `bookmarkedBy`
    (`indexOf` + `push`/`splice`) with no locking — concurrent toggles for
    the same user/post can leave the count inconsistent.
    *Fix*: disable the button while a request is in flight (client) and/or
    make the toggle idempotent server-side (e.g. explicit `PUT`
    bookmarked=true/false rather than "flip whatever's there").

16. 🟢 **Module-level mutable state used for request tracking** —
    `requestsSinceBoot` in `index.ts` is fine for a single-process demo but
    is a smell: it won't be meaningful once there's more than one process
    (e.g. behind a load balancer/cluster mode), and nothing resets it.
    *Fix*: use a proper metrics backend (e.g. Prometheus counter) instead
    of ad hoc module state.

## Developer tooling

17. 🟠 **Key lint rules disabled repo-wide** — `.eslintrc.json` turns off
    `no-eval` (which would have flagged issue #2) and `no-unused-vars`.
    *Fix*: re-enable both; `no-eval` in particular should be a hard error,
    not a suggestion.

18. 🟡 **CI masks failing lint/tests** — `.github/workflows/ci.yml` sets
    `continue-on-error: true` on both the lint and test steps, so the
    pipeline shows green even when either fails.
    *Fix*: remove `continue-on-error` (or gate merges on those steps
    explicitly passing).

19. 🟡 **Flaky test** — `apps/api/tests/flaky.test.ts` asserts `/trending`
    always succeeds, but the route has a built-in ~30% failure rate (see
    #14) — same root cause, two symptoms.
    *Fix*: once #14 is fixed to return a deterministic error response
    instead of hanging/crashing, update the test to assert on both the
    success and (mocked) failure paths rather than assuming always-success.

20. 🟢 **`web` package's `test` script is a no-op** — `apps/web/package.json`
    `"test"` just echoes and exits 0, so `pnpm test` reports success for
    the frontend without actually testing anything.
    *Fix*: wire up a real test runner (e.g. Vitest + React Testing Library)
    or, at minimum, remove the fake script so its absence is honest.

21. 🟢 **Loose TypeScript config** — `tsconfig.base.json` sets `"strict": false`,
    which silences a class of bugs (implicit `any`, null/undefined
    mismatches) that `strict: true` would have caught at compile time.
    *Fix*: enable `strict` (ideally incrementally, file by file, if this
    were a real large codebase).

---

**Total: 21 planted issues** across the four categories the real
assessment says it evaluates. In 90 minutes, a strong pass usually means
2–4 issues fixed *thoroughly and correctly*, plus brief notes on what else
you spotted — not an attempt to clear the whole list.
