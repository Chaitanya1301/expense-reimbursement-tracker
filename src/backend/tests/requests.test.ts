import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { FAKE_PNG_BUFFER, VALID_PNG_BUFFER, loginAs, validRequestPayload } from "./helpers";

describe("reimbursement requests", () => {
  let requesterAgent: Awaited<ReturnType<typeof loginAs>>["agent"];
  let reviewerAgent: Awaited<ReturnType<typeof loginAs>>["agent"];
  let requesterId: string;

  beforeAll(async () => {
    const requesterLogin = await loginAs("requester@demo.test");
    requesterAgent = requesterLogin.agent;
    requesterId = requesterLogin.user.id;
    reviewerAgent = (await loginAs("reviewer@demo.test")).agent;
  });

  describe("validation", () => {
    it("rejects a missing title", async () => {
      const res = await requesterAgent.post("/api/requests").send(validRequestPayload({ title: "" }));
      expect(res.status).toBe(400);
    });

    it("rejects an amount that is not greater than zero", async () => {
      const res = await requesterAgent.post("/api/requests").send(validRequestPayload({ amount: 0 }));
      expect(res.status).toBe(400);
    });

    it("rejects a missing/invalid category", async () => {
      const res = await requesterAgent.post("/api/requests").send(validRequestPayload({ category: "NOT_REAL" }));
      expect(res.status).toBe(400);
    });

    it("rejects a missing description", async () => {
      const res = await requesterAgent.post("/api/requests").send(validRequestPayload({ description: "" }));
      expect(res.status).toBe(400);
    });
  });

  describe("create and submit", () => {
    it("creates a draft without submitting", async () => {
      const res = await requesterAgent.post("/api/requests").send(validRequestPayload());
      expect(res.status).toBe(201);
      expect(res.body.request.status).toBe("DRAFT");
    });

    it("creates and immediately submits when submit: true", async () => {
      const res = await requesterAgent.post("/api/requests").send(validRequestPayload({ submit: true }));
      expect(res.status).toBe(201);
      expect(res.body.request.status).toBe("SUBMITTED");
    });

    it("lets the owner edit a draft, but not after it's submitted", async () => {
      const create = await requesterAgent.post("/api/requests").send(validRequestPayload({ title: "Original" }));
      const id = create.body.request.id;

      const editOk = await requesterAgent.patch(`/api/requests/${id}`).send({ title: "Edited" });
      expect(editOk.status).toBe(200);
      expect(editOk.body.request.title).toBe("Edited");

      await requesterAgent.post(`/api/requests/${id}/submit`);
      const editAfterSubmit = await requesterAgent.patch(`/api/requests/${id}`).send({ title: "Too late" });
      expect(editAfterSubmit.status).toBe(400);
    });

    it("does not allow submitting the same draft twice", async () => {
      const create = await requesterAgent.post("/api/requests").send(validRequestPayload());
      const id = create.body.request.id;

      const first = await requesterAgent.post(`/api/requests/${id}/submit`);
      expect(first.status).toBe(200);

      const second = await requesterAgent.post(`/api/requests/${id}/submit`);
      expect(second.status).toBe(400);
    });
  });

  describe("role-based access control", () => {
    it("prevents a requester from calling reviewer-only actions", async () => {
      const create = await requesterAgent
        .post("/api/requests")
        .send(validRequestPayload({ submit: true }));
      const id = create.body.request.id;

      const startReview = await requesterAgent.post(`/api/requests/${id}/start-review`);
      const approve = await requesterAgent.post(`/api/requests/${id}/approve`);
      const reject = await requesterAgent.post(`/api/requests/${id}/reject`).send({ reason: "no" });
      const pay = await requesterAgent.post(`/api/requests/${id}/pay`);

      expect(startReview.status).toBe(403);
      expect(approve.status).toBe(403);
      expect(reject.status).toBe(403);
      expect(pay.status).toBe(403);
    });

    it("scopes the requester's own list to only their requests", async () => {
      const res = await requesterAgent.get("/api/requests?pageSize=50");
      expect(res.status).toBe(200);
      for (const r of res.body.data) {
        expect(r.requesterId).toBe(requesterId);
      }
    });

    it("returns 401 for an unauthenticated request", async () => {
      const unauth = await request(app).get("/api/requests");
      expect(unauth.status).toBe(401);
    });
  });

  describe("reviewer workflow and status transitions", () => {
    it("walks a request through start-review -> approve -> pay", async () => {
      const create = await requesterAgent
        .post("/api/requests")
        .send(validRequestPayload({ title: "Happy path", submit: true }));
      const id = create.body.request.id;

      const start = await reviewerAgent.post(`/api/requests/${id}/start-review`);
      expect(start.status).toBe(200);
      expect(start.body.request.status).toBe("UNDER_REVIEW");

      const approve = await reviewerAgent.post(`/api/requests/${id}/approve`).send({ comment: "Looks good" });
      expect(approve.status).toBe(200);
      expect(approve.body.request.status).toBe("APPROVED");

      const pay = await reviewerAgent.post(`/api/requests/${id}/pay`);
      expect(pay.status).toBe(200);
      expect(pay.body.request.status).toBe("PAID");

      const history = await requesterAgent.get(`/api/requests/${id}/history`);
      const actions = history.body.history.map((h: { action: string }) => h.action);
      expect(actions).toEqual(["CREATED", "SUBMITTED", "STARTED_REVIEW", "APPROVED", "PAID"]);
    });

    it("requires a reason to reject, and the requester can see it afterward", async () => {
      const create = await requesterAgent
        .post("/api/requests")
        .send(validRequestPayload({ title: "To be rejected", submit: true }));
      const id = create.body.request.id;
      await reviewerAgent.post(`/api/requests/${id}/start-review`);

      const noReason = await reviewerAgent.post(`/api/requests/${id}/reject`).send({});
      expect(noReason.status).toBe(400);

      const rejected = await reviewerAgent.post(`/api/requests/${id}/reject`).send({ reason: "Missing receipt" });
      expect(rejected.status).toBe(200);
      expect(rejected.body.request.status).toBe("REJECTED");

      const view = await requesterAgent.get(`/api/requests/${id}`);
      expect(view.body.request.rejectReason).toBe("Missing receipt");
    });

    it("never allows a rejected request to be marked paid", async () => {
      const create = await requesterAgent
        .post("/api/requests")
        .send(validRequestPayload({ title: "Reject then pay attempt", submit: true }));
      const id = create.body.request.id;
      await reviewerAgent.post(`/api/requests/${id}/start-review`);
      await reviewerAgent.post(`/api/requests/${id}/reject`).send({ reason: "Not eligible" });

      const payAttempt = await reviewerAgent.post(`/api/requests/${id}/pay`);
      expect(payAttempt.status).toBe(400);
    });

    it("rejects invalid workflow actions, like approving a draft directly", async () => {
      const create = await requesterAgent.post("/api/requests").send(validRequestPayload({ title: "Still a draft" }));
      const id = create.body.request.id;

      const approve = await reviewerAgent.post(`/api/requests/${id}/approve`);
      expect(approve.status).toBe(400);
    });
  });

  describe("receipts", () => {
    it("accepts a real PNG and rejects a file whose bytes don't match its claimed type", async () => {
      const create = await requesterAgent.post("/api/requests").send(validRequestPayload({ title: "With receipt" }));
      const id = create.body.request.id;

      const validUpload = await requesterAgent
        .post(`/api/requests/${id}/receipts`)
        .attach("file", VALID_PNG_BUFFER, { filename: "receipt.png", contentType: "image/png" });
      expect(validUpload.status).toBe(201);
      expect(validUpload.body.receipt.mimeType).toBe("image/png");

      const fakeUpload = await requesterAgent
        .post(`/api/requests/${id}/receipts`)
        .attach("file", FAKE_PNG_BUFFER, { filename: "fake.png", contentType: "image/png" });
      expect(fakeUpload.status).toBe(400);
    });

    it("requires authentication to download a receipt (never a public URL)", async () => {
      const create = await requesterAgent
        .post("/api/requests")
        .send(validRequestPayload({ title: "Receipt access check" }));
      const id = create.body.request.id;
      const upload = await requesterAgent
        .post(`/api/requests/${id}/receipts`)
        .attach("file", VALID_PNG_BUFFER, { filename: "receipt.png", contentType: "image/png" });
      const receiptId = upload.body.receipt.id;

      const unauth = await request(app).get(`/api/requests/${id}/receipts/${receiptId}`);
      expect(unauth.status).toBe(401);

      const authed = await requesterAgent.get(`/api/requests/${id}/receipts/${receiptId}`);
      expect(authed.status).toBe(200);
    });
  });

  describe("pagination and dashboard totals", () => {
    it("paginates the list and respects pageSize", async () => {
      for (let i = 0; i < 3; i++) {
        await requesterAgent.post("/api/requests").send(validRequestPayload({ title: `Pagination test ${i}` }));
      }
      const res = await requesterAgent.get("/api/requests?pageSize=2&page=1");
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.pageSize).toBe(2);
      expect(res.body.meta.totalPages).toBeGreaterThanOrEqual(2);
    });

    it("reflects a new submission and payment in the dashboard totals", async () => {
      const before = await reviewerAgent.get("/api/dashboard/summary");

      const create = await requesterAgent
        .post("/api/requests")
        .send(validRequestPayload({ title: "Dashboard delta check", amount: 77.77, submit: true }));
      const id = create.body.request.id;
      await reviewerAgent.post(`/api/requests/${id}/start-review`);
      await reviewerAgent.post(`/api/requests/${id}/approve`);
      await reviewerAgent.post(`/api/requests/${id}/pay`);

      const after = await reviewerAgent.get("/api/dashboard/summary");
      expect(after.body.totalPaid - before.body.totalPaid).toBeCloseTo(77.77, 2);
      expect(after.body.totalApproved - before.body.totalApproved).toBeCloseTo(77.77, 2);
    });
  });
});
