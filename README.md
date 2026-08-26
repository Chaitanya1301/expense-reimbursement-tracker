# Expense & Reimbursement Tracker

A full-stack web app for submitting, reviewing, and tracking expense reimbursement requests — built to replace the usual mess of emails, spreadsheets, and paper receipts with one clear workflow.

**Live demo:** https://expense-tracker-app-chaitanya1301.onrender.com
**API docs:** https://expense-tracker-api-chaitanya1301.onrender.com/api/docs

> Hosted on Render's free tier — the first request after a period of inactivity can take 30–60 seconds to wake the services up.

**Demo accounts** (password `Password123!` for all):

| Role | Email |
|------|-------|
| Requester | `requester@demo.test` |
| Reviewer | `reviewer@demo.test` |
| Administrator | `admin@demo.test` |

---

## What it does

- **Requesters** create reimbursement requests (title, amount, date, category, description), attach a receipt, save as a draft or submit for review, and track status/history on everything they've submitted.
- **Reviewers** see all submitted requests with search/filter/pagination, review the details and receipt, approve or reject (with a required reason), and mark approved requests as paid — plus a dashboard of totals requested/approved/pending/paid.
- **Administrators** manage user accounts — view all users, change roles, activate/deactivate accounts — with a full audit trail of who changed what and when.
- Every request carries its own **audit history** (created → submitted → reviewed → approved/rejected → paid), and **in-app notifications** fire when a request's status changes.

The core workflow: **Create → Submit → Review → Approve/Reject → Paid**, with status transitions enforced server-side — a request can't skip a step or move backward from a terminal state, regardless of what the UI would normally allow.

## Tech stack

- **Frontend:** React 19 + TypeScript (Vite), React Router
- **Backend:** Node.js + Express + TypeScript, Prisma ORM
- **Database:** PostgreSQL
- **Auth:** JWT in an httpOnly cookie, `bcryptjs` for password hashing
- **File uploads:** `multer`, with server-side magic-byte validation of receipt files (not just trusting the filename/content-type)
- **API docs:** hand-written OpenAPI 3.0 spec, served via Swagger UI
- **Testing:** Vitest + Supertest, running against a real (reset-and-reseeded) database
- **Deployment:** Render (Blueprint-based — one `render.yaml` provisions the backend, frontend, and database together)

See [`docs/architecture.md`](./docs/architecture.md) for the full breakdown of the data model, folder structure, and security decisions.

## Security notes

- Role-based access control is enforced entirely on the backend — every mutating route independently checks the caller's role, and reviewer actions additionally check that the reviewer isn't the request's own owner, so a requester can never approve or pay their own request.
- Receipt uploads are validated by reading the actual file bytes (JPEG/PNG/PDF magic-byte signatures), not the client-supplied filename or `Content-Type` — a renamed executable won't pass.
- Receipts are never served via a public/static URL — every download requires the requesting user to be the request's owner or a reviewer.
- A global error handler ensures no unexpected error ever leaks a stack trace, raw database error, or other internal detail to the client.
- Secrets (JWT secret, database URL) are environment variables only, never committed.

## Running it locally

**Prerequisites:** Node.js 20+, npm, Docker Desktop (for local Postgres).

```bash
# 1. Start Postgres
docker compose up -d db

# 2. Backend
cd src/backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run seed        # creates the 3 demo accounts
npm run dev         # http://localhost:4000

# 3. Frontend (new terminal)
cd src/frontend
npm install
npm run dev          # http://localhost:5173
```

Local API docs: `http://localhost:4000/api/docs`

### Running the tests

```bash
cd src/backend
npm test
```

This resets and reseeds the database before running (`prisma migrate reset --force` as a `pretest` step) — 30 integration tests across auth, the full request workflow, and admin user management. **Only run this against your local dev database**, never anything you care about keeping. See [`docs/testing.md`](./docs/testing.md) for what's covered.

## Project structure

```text
src/
├── backend/          # Express + TypeScript API, Prisma schema/migrations, tests
└── frontend/         # React + TypeScript (Vite) app
render.yaml           # Render Blueprint (backend + frontend + Postgres)
docs/
├── architecture.md   # Data model, folder structure, design decisions
├── testing.md        # What's automated-tested vs. manually verified
└── reflection.md     # What's built, what's not, what I'd change
```

## Known limitations

- Receipts are stored on local disk, which is ephemeral on Render's free tier — uploaded files can be lost on a service restart/redeploy. Fine for a demo; would need real object storage (S3, etc.) for production use.
- No self-registration — accounts are created via a seed script only; the admin page can change an existing account's role/status but not create new ones.
- Responsive layout has been checked at mobile and desktop widths, not yet verified at every tablet breakpoint.

## Built with AI assistance

This project was built working interactively with Claude Code — it wrote most of the implementation under my direction, one reviewed step at a time, while I drove the architecture and workflow decisions, reviewed each change, and verified the results myself (running the tests, checking the security behavior, testing the live deploy) rather than trusting generated output at face value.
