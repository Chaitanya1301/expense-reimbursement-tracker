# Testing

## Automated tests

Backend integration tests (Vitest + Supertest), run with:

```bash
cd src/backend
npm test
```

`npm test` runs `prisma migrate reset --force` first, so every run starts from a clean, freshly-seeded database (the 3 demo accounts, no leftover data). **This is destructive to whatever is currently in the local database** — never point it at anything other than the local Docker Postgres used for development.

Tests exercise the real Express app in-process (via `src/app.ts`, not a mocked router) against the real database — no mocking of Prisma or the HTTP layer — so they catch real integration bugs, not just unit-level logic errors.

### Coverage (30 tests / 3 files)

**`tests/auth.test.ts`**
- Valid login sets a session cookie
- Wrong password and unknown email both return the same generic `INVALID_CREDENTIALS` error (no account enumeration)
- Missing fields on login → 400
- `/api/auth/me` → 401 without a session, 200 with one
- Logout clears the session (`/me` returns 401 afterward)

**`tests/requests.test.ts`**
- **Validation:** missing title, amount not greater than zero, invalid/missing category, missing description → all 400
- **Create/submit:** draft creation vs. immediate submit; owner can edit a draft but not after submission; a draft cannot be submitted twice
- **RBAC:** a requester gets 403 on every reviewer-only action (start-review, approve, reject, pay); an unauthenticated request gets 401; the requester's own list is scoped to their own requests only
- **Workflow/status transitions:** full happy path start-review → approve → pay, with the resulting history trail asserted; rejection requires a reason (400 without one); a rejected request can never be marked paid; approving a draft directly (skipping submission) is rejected
- **Receipts:** a real PNG is accepted; a file whose actual bytes don't match its claimed type is rejected (400) regardless of filename/content-type; downloading a receipt requires authentication
- **Pagination & dashboard:** list pagination respects `pageSize`/`page`; a full submit→approve→pay cycle produces the expected delta in the dashboard's `totalPaid`/`totalApproved`

**`tests/admin.test.ts`**
- A non-admin (reviewer) is blocked from listing users (403)
- An admin can list all users
- Deactivating a user immediately blocks their login; reactivating restores it
- Role/status changes are recorded in that user's history

## Manual testing

The full requester → reviewer workflow (create, validation errors, submit, start-review, approve, reject-with-reason, mark-as-paid, receipt upload/view, search/filter, pagination, dashboard totals, notifications, and admin role/status management) was manually exercised in the browser at each phase of the build, using the seeded demo accounts. See `docs/walkthrough.md` for the recorded walkthrough.

## Known gaps

- No automated end-to-end (browser-driven) tests — integration tests cover the API layer only.
- No test for the "a user is both a request's requester and a reviewer" self-approval edge case specifically, since the seed data has one account per role — the RBAC test coverage confirms a requester-role user can never reach reviewer actions at all, which is the primary defense.
- Responsive layout at intermediate (tablet) viewport widths has not been manually verified — see `docs/reflection.md`.
