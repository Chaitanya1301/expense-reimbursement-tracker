# Planning Document

> Completed **before writing any code**, per `problem_statement.md`.
> Compare this against `docs/architecture.md` after building to reflect on where the plan changed and why.

---

## Tech Stack

**Frontend:** React (Vite) + TypeScript
**Backend:** Node.js + Express + TypeScript
**Database:** PostgreSQL, accessed via Prisma ORM

**Why this stack:**
- One language (TypeScript) across frontend and backend reduces context-switching during a solo 5-day build.
- Express keeps the API layer simple and explicit, which matters for satisfying the rubric's "consistent endpoint naming / status codes / error format" requirements without framework magic getting in the way.
- Prisma gives fast schema iteration (migrations) and typed queries, which reduces bugs in a time-boxed build.
- Postgres is free to host (Supabase/Neon/Render) and satisfies "database-backed solution strongly preferred over local storage."

**Key Libraries:**
- `bcrypt` — password hashing
- `jsonwebtoken` — session auth (JWT in httpOnly cookie)
- `zod` — request validation (shared shape between frontend and backend where practical)
- `multer` — receipt file upload handling (memory storage, size/type limits enforced before persisting)
- `swagger-ui-express` + `swagger-jsdoc` — API documentation
- `react-router-dom`, `axios` (or `fetch` wrapper), a lightweight UI kit (e.g. plain CSS or Tailwind) on the frontend

---

## Data Model & Roles

**Entities:** User (with `role`: requester/reviewer/admin, and `status`: active/inactive), ReimbursementRequest, Receipt, RequestHistory (audit trail), Notification.

**Roles:**
- **Requester** — create/edit drafts, submit, view own requests + history + reviewer comments.
- **Reviewer** — view all submitted requests, approve/reject (with reason), mark Approved → Paid, search/filter, view dashboard.
- **Administrator** — manage users (view, assign role, activate/deactivate), view role/status history. Cannot approve or pay requests (separation of duties).

**Status model:** `Draft → Submitted → Under Review → Approved / Rejected`, `Approved → Paid`. Submitted and Under Review are kept separate so the reviewer dashboard can distinguish "not yet opened" from "in progress." All transitions are enforced server-side via an explicit allowed-transitions map — a request can never jump straight to Paid, and Rejected is a terminal state.

**Categories:** Travel, Meals, Office Supplies, Software/Subscriptions, Event Expenses, Training, Other.

---

## API Design (high level)

- `POST /api/auth/login`, `POST /api/auth/logout`
- `GET/POST /api/requests` (list is paginated + filterable by status/category/date/requester/amount/keyword; scoped by role — requesters see only their own)
- `GET/PATCH /api/requests/:id`, `POST /api/requests/:id/submit`
- `POST /api/requests/:id/approve`, `POST /api/requests/:id/reject`, `POST /api/requests/:id/pay`
- `POST /api/requests/:id/receipt` (upload), `GET /api/requests/:id/receipt` (auth-checked download, not a public URL)
- `GET /api/requests/:id/history`
- `GET /api/dashboard/summary`
- `GET /api/notifications`, `PATCH /api/notifications/:id/read`
- `GET/PATCH /api/admin/users`

Consistent JSON error shape (`{ error: { code, message } }`), 401 for unauthenticated, 403 for wrong-role, 400 for validation. Documented via Swagger at `/api/docs`.

---

## Evaluation / Testing Plan

No ML component in this project, so "evaluation" here means **workflow correctness testing**, not model metrics.

- Backend integration tests (Jest + Supertest) covering ≥10 scenarios drawn directly from the rubric's "Testing Expectations": valid submission, missing required field, invalid amount, missing/unsupported receipt, duplicate submission, requester attempting reviewer/admin actions, requester approving own request, invalid status transition (e.g. Rejected → Paid), pagination + filter correctness, dashboard totals matching seeded data.
- Each test case documented in `docs/testing.md` with expected vs. actual result.
- Manual pass through the "Minimum Demonstration Scenario" from `problem_statement.md` before recording the walkthrough video.

---

## Phases & Priorities

| Phase | Target Dates | Goals |
|-------|--------------|-------|
| 1 | Aug 13–14 | Scaffold repo (frontend/backend/db), Prisma schema + migrations, auth + seeded demo accounts (requester/reviewer/admin), skeleton API |
| 2 | Aug 14–16 | Core workflow: create/submit request, receipt upload, reviewer approve/reject/pay, backend-enforced RBAC and status transitions |
| 3 | Aug 16–17 | Dashboard totals, search/filter/pagination, notifications, request history/audit trail, admin user management |
| 4 | Aug 17–18 | Responsive UI pass, API docs, integration tests, security pass (input validation, file-type checks, secret handling), README/docs/walkthrough video, deploy |

---

## What I'll Cut If Time Is Short

First to cut: notifications, admin role management, receipt preview/extraction, advanced filters (amount range, keyword search).
Last to cut: anything in the core Create → Submit → Review → Approve/Reject → Paid workflow, backend RBAC, and persistent storage — these are explicitly weighted highest in the rubric (30%) and are what the minimum demo scenario walks through.

---

## Open Questions / Risks

- **File upload security:** must validate actual file content/MIME type server-side, not just extension, and reject executables — needs a small library or magic-byte check rather than trusting `multer`'s reported mimetype.
- **Backend RBAC consistency:** every mutating route needs the same role/ownership check; plan to centralize this in Express middleware rather than repeating checks per-route to avoid gaps.
- **Time budget:** solo 5-day build — biggest risk is spending too long on polish (Tier 2) before Tier 1 is fully connected end-to-end. Mitigation: don't start Tier 2 items until the minimum demo scenario works start-to-finish.
- **Hosting:** free-tier Postgres/backend hosts (Render/Railway/Supabase) can cold-start slowly — note this in the walkthrough so judges aren't surprised by a slow first load.
