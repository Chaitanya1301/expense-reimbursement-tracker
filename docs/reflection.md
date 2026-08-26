# Reflection

## What I Built

A full Tier 1 reimbursement workflow: Requester, Reviewer, and Administrator roles; create → submit → review → approve/reject → paid, with server-enforced status transitions (a request can never skip a state or move backward from a terminal one); receipt upload with real file-content validation (not just extension/mimetype) and auth-gated, non-public download; a full per-request audit history; search/filter/pagination on the request list; a role-scoped financial dashboard; in-app notifications on approve/reject/pay; and admin user management (role/status changes, with its own audit trail) — all backed by PostgreSQL via Prisma, with RBAC enforced entirely on the backend (401/403 are real, not just hidden buttons).

What's reliably working: the entire core workflow end-to-end, all RBAC boundaries, receipt type validation (verified against a deliberately mislabeled file), and 30 passing integration tests covering the scenarios above.

What's not done: no deployment yet (everything runs locally), the auto-generated backend `Dockerfile` is a non-functional stub, there's no self-registration flow (accounts are seed-only), and the responsive layout hasn't been manually checked at tablet-range viewport widths.

## What I'd Do Differently

- Fix or replace the auto-generated `Dockerfile` earlier rather than leaving it as dead weight in the repo.
- Decide on the `UserHistory` model up front instead of adding it via a second migration once the admin feature exposed the gap — it was an easy fix, but planning the full data model (including audit needs) before the first migration would have been cleaner.
- Do a real responsive/viewport check as I built each page, instead of deferring it to a single pass at the end.
- Add rate limiting on the login endpoint — it's not currently protected against repeated password guesses beyond the account lockout an admin would have to trigger manually.

## AI Tools Used

This project was built with **Claude Code**, working interactively and iteratively: it wrote essentially all of the application code (backend routes/schema/middleware, frontend components/pages, tests, and this documentation) under my direction, one reviewed step at a time rather than as a single generated dump. I drove the architecture and workflow decisions (the status-transition model, the RBAC boundaries, what the notifications and admin features needed to cover), reviewed each change before accepting it, and had it explain its reasoning at each step so I could verify it rather than take generated code on faith. I ran and read the results of the automated tests, the manual curl/browser verification at each phase, and the security checks (e.g. confirming the file-type validation actually rejects a disguised file, confirming the error handler doesn't leak stack traces) myself rather than trusting a report of "it works."

I can explain why each part of this system is built the way it is — the status-transition allow-list, why RBAC checks happen server-side per route rather than via a single global gate, why receipts are validated by content and not extension — without relying on AI to answer for me.
