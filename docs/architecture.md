# Architecture Overview

> This documents how the Expense & Reimbursement Tracker was actually implemented.
> Compare against `planning/planning.md` for what changed and why.

---

## Final Tech Stack

- **Frontend:** React 19 (Vite) + TypeScript, plain CSS (no UI framework), React Router for client-side routing.
- **Backend:** Node.js + Express 4 + TypeScript, Prisma ORM.
- **Database:** PostgreSQL 16, running in Docker locally (`compose.yaml`).
- **Auth:** JWT in an httpOnly cookie, `bcryptjs` for password hashing.
- **File uploads:** `multer` (memory storage) + a hand-written magic-byte file-type detector (`src/backend/src/lib/fileType.ts`), storing accepted receipts on local disk under `src/backend/uploads/` (gitignored).
- **API docs:** hand-written OpenAPI 3.0 spec (`src/backend/src/openapi.ts`), served via `swagger-ui-express` at `/api/docs`.
- **Testing:** Vitest + Supertest, run against the real Postgres database (reset + reseeded before every run) rather than mocked.

This matches the stack chosen in `planning.md`, with two additions made during the build: `express-async-errors` (Express 4 doesn't forward async route errors to error-handling middleware on its own) and `bcryptjs` in place of `bcrypt` (avoids a native-binary build step and a transitive `tar` vulnerability in `node-pre-gyp`).

---

## Folder Structure

```text
src/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # User, ReimbursementRequest, Receipt, RequestHistory,
│   │   │                       # UserHistory, Notification models + enums
│   │   ├── migrations/
│   │   └── seed.ts             # creates the 3 demo accounts
│   ├── src/
│   │   ├── app.ts              # builds the Express app (middleware + routes) — imported
│   │   │                       # directly by tests, without starting a real server
│   │   ├── index.ts            # imports app.ts, calls app.listen()
│   │   ├── openapi.ts          # hand-written OpenAPI spec
│   │   ├── lib/                # prisma client singleton, jwt sign/verify, status
│   │   │                       # transition rules, history/notification helpers,
│   │   │                       # magic-byte file-type detector
│   │   ├── middleware/         # requireAuth / requireRole, global error handler
│   │   ├── routes/             # auth, requests, dashboard, notifications, admin
│   │   └── schemas/            # zod validation schemas
│   └── tests/                  # Vitest + Supertest integration tests
└── frontend/
    └── src/
        ├── context/AuthContext.tsx   # session state, login/logout, /me on load
        ├── lib/                      # typed API clients (requests, admin,
        │                             # notifications, auth) wrapping fetch
        ├── components/               # RequestForm, RequestDetail, StatusBadge,
        │                             # NotificationBell, ProtectedRoute
        └── pages/                    # Login, RoleHome (dispatches by role),
                                       # RequesterHome, ReviewerHome, AdminHome
```

---

## Data Model & Workflow Design

Six models: `User`, `ReimbursementRequest`, `Receipt`, `RequestHistory` (per-request audit trail), `UserHistory` (per-user role/status audit trail, added in a later migration once the admin feature was built), and `Notification`.

**Status model:** `DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED`, `APPROVED → PAID`. Transitions are not just implied by UI flow — they're enforced by an explicit allow-list (`lib/statusTransitions.ts`) that every status-changing route checks before writing to the database, so a direct API call (e.g. `POST /requests/:id/pay` on a `REJECTED` request) is rejected with a 400 regardless of what the frontend would normally allow.

**Role-based access control** is enforced entirely server-side via `requireRole()` middleware on each route — the frontend hides buttons a role can't use, but every mutating endpoint independently checks role and, for reviewer actions, that the reviewer isn't the request's own owner (`requesterId === req.user.id` → 403), which is how "requesters must not approve their own requests" holds even if a user's role were later changed by an admin.

**Receipt security:** uploads are validated by reading the actual file bytes (magic-byte signatures for JPEG/PNG/PDF) rather than trusting the client-supplied filename or `Content-Type`, and downloads require the requesting user to be either the request's owner or a reviewer — there is no public/static file route, so a receipt is never reachable by URL alone.

**Notifications** are created server-side as a side effect of the approve/reject/pay actions (recipient = the request's owner), not client-driven.

---

## Where Things Run

Everything currently runs locally for development: Postgres in Docker (`docker compose up -d db`), the Express API via `npm run dev` (port 4000), and the Vite dev server (port 5173). Nothing is deployed yet — that's the remaining item before submission.

---

## What Changed From the Plan

- **Notifications and admin user management** (originally scheduled for Phase 3, Aug 16–17) were mostly built alongside the core workflow (Phase 2) since the data model made it natural to add them at the same time as the request routes.
- **`UserHistory` was not in the original schema.** It was added in a second migration once the admin feature's "view relevant history" requirement made it clear a per-request `RequestHistory` model (which requires a `requestId`) couldn't represent a role/status change on a user.
- **A global error-handling middleware and `express-async-errors`** were added in Phase 4 after noticing Express 4 doesn't catch async route errors by default — without it, an unexpected error (e.g. a database hiccup) would have shown a full stack trace to the client, since `NODE_ENV=production` is never set in local dev.
- **The auto-generated `Dockerfile`/`compose.yaml` for the backend container** (created by a VS Code extension early in the build, not by us) is still a non-functional stub — it doesn't run `prisma generate` or the TypeScript build step, and its exposed port doesn't match the app's default. This still needs fixing before a container-based deployment.
- **No self-registration/signup flow exists.** Users are only created via the seed script; the admin page can change an existing user's role/status but not create new accounts. This was a scope decision to keep authentication simple, per the problem statement's allowance for "preconfigured demonstration accounts."
