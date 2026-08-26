import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { DEMO_PASSWORD, loginAs } from "./helpers";

describe("auth", () => {
  it("logs in with valid demo credentials and sets a session cookie", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "requester@demo.test", password: DEMO_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("requester@demo.test");
    expect(res.body.user.role).toBe("REQUESTER");
    expect(res.headers["set-cookie"]?.[0]).toMatch(/^token=/);
  });

  it("rejects an incorrect password without revealing which part was wrong", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "requester@demo.test", password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("rejects a login for an email that doesn't exist, with the same generic error", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@demo.test", password: DEMO_PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("rejects a request missing required fields", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "requester@demo.test" });
    expect(res.status).toBe(400);
  });

  it("returns 401 from /me without a session cookie", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the current user from /me with a valid session cookie", async () => {
    const { agent } = await loginAs("reviewer@demo.test");
    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("REVIEWER");
  });

  it("clears the session on logout", async () => {
    const { agent } = await loginAs("requester@demo.test");
    const logoutRes = await agent.post("/api/auth/logout");
    expect(logoutRes.status).toBe(204);

    const meRes = await agent.get("/api/auth/me");
    expect(meRes.status).toBe(401);
  });
});
