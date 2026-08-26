import { describe, it, expect, beforeAll } from "vitest";
import { DEMO_PASSWORD, loginAs } from "./helpers";

describe("admin user management", () => {
  let adminAgent: Awaited<ReturnType<typeof loginAs>>["agent"];
  let reviewerAgent: Awaited<ReturnType<typeof loginAs>>["agent"];
  let requesterId: string;

  beforeAll(async () => {
    adminAgent = (await loginAs("admin@demo.test")).agent;
    reviewerAgent = (await loginAs("reviewer@demo.test")).agent;
    const requesterLogin = await loginAs("requester@demo.test");
    requesterId = requesterLogin.user.id;
  });

  it("prevents a non-admin from listing users", async () => {
    const res = await reviewerAgent.get("/api/admin/users");
    expect(res.status).toBe(403);
  });

  it("lets an admin list all users", async () => {
    const res = await adminAgent.get("/api/admin/users");
    expect(res.status).toBe(200);
    const emails = res.body.users.map((u: { email: string }) => u.email);
    expect(emails).toEqual(
      expect.arrayContaining(["requester@demo.test", "reviewer@demo.test", "admin@demo.test"]),
    );
  });

  it("deactivating a user immediately blocks their login, and reactivating restores it", async () => {
    const deactivate = await adminAgent.patch(`/api/admin/users/${requesterId}`).send({ status: "INACTIVE" });
    expect(deactivate.status).toBe(200);
    expect(deactivate.body.user.status).toBe("INACTIVE");

    const blockedLogin = await loginAs("requester@demo.test").catch((e: Error) => e);
    expect(blockedLogin).toBeInstanceOf(Error);

    const reactivate = await adminAgent.patch(`/api/admin/users/${requesterId}`).send({ status: "ACTIVE" });
    expect(reactivate.status).toBe(200);

    const restoredLogin = await loginAs("requester@demo.test", DEMO_PASSWORD);
    expect(restoredLogin.user.email).toBe("requester@demo.test");
  });

  it("records role and status changes in the user's history", async () => {
    await adminAgent.patch(`/api/admin/users/${requesterId}`).send({ status: "INACTIVE" });
    await adminAgent.patch(`/api/admin/users/${requesterId}`).send({ status: "ACTIVE" });

    const history = await adminAgent.get(`/api/admin/users/${requesterId}/history`);
    expect(history.status).toBe(200);
    expect(history.body.history.length).toBeGreaterThanOrEqual(2);
    for (const entry of history.body.history) {
      expect(entry.actor.name).toBeDefined();
    }
  });
});
