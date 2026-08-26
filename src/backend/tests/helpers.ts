import request from "supertest";
import { app } from "../src/app";

export const DEMO_PASSWORD = "Password123!";

export async function loginAs(email: string, password = DEMO_PASSWORD) {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/login").send({ email, password });
  if (res.status !== 200) {
    throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { agent, user: res.body.user };
}

// Minimal 1x1 valid PNG (real magic bytes), for receipt-upload tests.
export const VALID_PNG_BUFFER = Buffer.from(
  "89504e470d0a1a0a0000000d494844520000000100000001080600000031e11f0b0000000a4944415478da6360000002000155e621bc0000000049454e44ae426082",
  "hex",
);

// Looks like a PNG by filename/content-type, but the bytes are plain text.
export const FAKE_PNG_BUFFER = Buffer.from("this is not actually a png file");

export function validRequestPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    title: "Test expense",
    amount: 25.5,
    expenseDate: "2026-08-01",
    category: "OFFICE_SUPPLIES",
    description: "A test expense for automated testing.",
    ...overrides,
  };
}
