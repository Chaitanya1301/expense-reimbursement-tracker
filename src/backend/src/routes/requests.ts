import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { Prisma, Role, RequestStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { canTransition } from "../lib/statusTransitions";
import { recordHistory } from "../lib/history";
import { detectReceiptType } from "../lib/fileType";
import { createRequestSchema, updateRequestSchema, rejectSchema, listRequestsQuerySchema } from "../schemas/request";

export const requestsRouter = Router();
requestsRouter.use(requireAuth);

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MAX_RECEIPT_BYTES = 10 * 1024 * 1024; // 10MB
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_RECEIPT_BYTES } });

function badRequest(res: import("express").Response, message: string) {
  return res.status(400).json({ error: { code: "VALIDATION_ERROR", message } });
}

function notFound(res: import("express").Response) {
  return res.status(404).json({ error: { code: "NOT_FOUND", message: "Reimbursement request not found." } });
}

function forbidden(res: import("express").Response, message = "You do not have permission to perform this action.") {
  return res.status(403).json({ error: { code: "FORBIDDEN", message } });
}

/**
 * Loads a request and checks the caller is allowed to see it: the owning
 * requester, or any reviewer. Returns null (after responding) on failure.
 */
async function loadAuthorizedRequest(req: import("express").Request, res: import("express").Response, id: string) {
  const request = await prisma.reimbursementRequest.findUnique({ where: { id } });
  if (!request) {
    notFound(res);
    return null;
  }
  const isOwner = request.requesterId === req.user!.id;
  const isReviewer = req.user!.role === Role.REVIEWER;
  if (!isOwner && !isReviewer) {
    forbidden(res);
    return null;
  }
  return request;
}

// ---- Create (draft, optionally submit immediately) ----
requestsRouter.post("/", requireRole(Role.REQUESTER), async (req, res) => {
  const parsed = createRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return badRequest(res, parsed.error.issues[0]?.message ?? "Invalid request data.");
  }
  const { submit, ...fields } = parsed.data;

  const created = await prisma.reimbursementRequest.create({
    data: {
      ...fields,
      expenseDate: new Date(fields.expenseDate),
      requesterId: req.user!.id,
      status: RequestStatus.DRAFT,
    },
  });

  await recordHistory({
    requestId: created.id,
    actorId: req.user!.id,
    action: "CREATED",
    newStatus: RequestStatus.DRAFT,
  });

  if (submit) {
    const submitted = await prisma.reimbursementRequest.update({
      where: { id: created.id },
      data: { status: RequestStatus.SUBMITTED },
    });
    await recordHistory({
      requestId: created.id,
      actorId: req.user!.id,
      action: "SUBMITTED",
      previousStatus: RequestStatus.DRAFT,
      newStatus: RequestStatus.SUBMITTED,
    });
    return res.status(201).json({ request: submitted });
  }

  return res.status(201).json({ request: created });
});

// ---- Edit a draft (owner only, while still DRAFT) ----
requestsRouter.patch("/:id", requireRole(Role.REQUESTER), async (req, res) => {
  const existing = await prisma.reimbursementRequest.findUnique({ where: { id: req.params.id } });
  if (!existing) return notFound(res);
  if (existing.requesterId !== req.user!.id) return forbidden(res);
  if (existing.status !== RequestStatus.DRAFT) {
    return badRequest(res, "Only draft requests can be edited.");
  }

  const parsed = updateRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return badRequest(res, parsed.error.issues[0]?.message ?? "Invalid request data.");
  }
  const { expenseDate, ...rest } = parsed.data;

  const updated = await prisma.reimbursementRequest.update({
    where: { id: existing.id },
    data: { ...rest, ...(expenseDate ? { expenseDate: new Date(expenseDate) } : {}) },
  });

  return res.json({ request: updated });
});

// ---- Submit a draft ----
requestsRouter.post("/:id/submit", requireRole(Role.REQUESTER), async (req, res) => {
  const existing = await prisma.reimbursementRequest.findUnique({ where: { id: req.params.id } });
  if (!existing) return notFound(res);
  if (existing.requesterId !== req.user!.id) return forbidden(res);
  if (!canTransition(existing.status, RequestStatus.SUBMITTED)) {
    return badRequest(res, `Cannot submit a request in status ${existing.status}.`);
  }

  const updated = await prisma.reimbursementRequest.update({
    where: { id: existing.id },
    data: { status: RequestStatus.SUBMITTED },
  });

  await recordHistory({
    requestId: existing.id,
    actorId: req.user!.id,
    action: "SUBMITTED",
    previousStatus: existing.status,
    newStatus: RequestStatus.SUBMITTED,
  });

  return res.json({ request: updated });
});

// ---- List (requesters see only their own; reviewers see all, filterable) ----
requestsRouter.get("/", async (req, res) => {
  const parsed = listRequestsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return badRequest(res, parsed.error.issues[0]?.message ?? "Invalid query parameters.");
  }
  const { page, pageSize, status, category, requesterId, keyword, dateFrom, dateTo, amountMin, amountMax } =
    parsed.data;

  if (req.user!.role !== Role.REQUESTER && req.user!.role !== Role.REVIEWER) {
    return forbidden(res);
  }

  const where: Prisma.ReimbursementRequestWhereInput = {};

  if (req.user!.role === Role.REQUESTER) {
    where.requesterId = req.user!.id; // requesters can only ever see their own
  } else if (requesterId) {
    where.requesterId = requesterId;
  }

  if (status) where.status = status;
  if (category) where.category = category;
  if (keyword) {
    where.OR = [
      { title: { contains: keyword, mode: "insensitive" } },
      { description: { contains: keyword, mode: "insensitive" } },
    ];
  }
  if (dateFrom || dateTo) {
    where.expenseDate = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    };
  }
  if (amountMin !== undefined || amountMax !== undefined) {
    where.amount = {
      ...(amountMin !== undefined ? { gte: amountMin } : {}),
      ...(amountMax !== undefined ? { lte: amountMax } : {}),
    };
  }

  const [total, data] = await Promise.all([
    prisma.reimbursementRequest.count({ where }),
    prisma.reimbursementRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { requester: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  return res.json({
    data,
    meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  });
});

// ---- Get one ----
requestsRouter.get("/:id", async (req, res) => {
  const request = await loadAuthorizedRequest(req, res, req.params.id);
  if (!request) return;
  const receipts = await prisma.receipt.findMany({ where: { requestId: request.id } });
  return res.json({ request: { ...request, receipts } });
});

// ---- History ----
requestsRouter.get("/:id/history", async (req, res) => {
  const request = await loadAuthorizedRequest(req, res, req.params.id);
  if (!request) return;
  const history = await prisma.requestHistory.findMany({
    where: { requestId: request.id },
    orderBy: { createdAt: "asc" },
    include: { actor: { select: { id: true, name: true, role: true } } },
  });
  return res.json({ history });
});

// ---- Receipt upload (owner, while not yet in a terminal state) ----
requestsRouter.post(
  "/:id/receipts",
  requireRole(Role.REQUESTER),
  upload.single("file"),
  async (req, res) => {
    const existing = await prisma.reimbursementRequest.findUnique({ where: { id: req.params.id } });
    if (!existing) return notFound(res);
    if (existing.requesterId !== req.user!.id) return forbidden(res);
    if (existing.status === RequestStatus.REJECTED || existing.status === RequestStatus.PAID) {
      return badRequest(res, "Cannot add a receipt to a request that is already closed out.");
    }
    if (!req.file) {
      return badRequest(res, "No file was uploaded.");
    }

    const detectedType = detectReceiptType(req.file.buffer);
    if (!detectedType) {
      return badRequest(res, "Unsupported file type. Only JPEG, PNG, and PDF receipts are accepted.");
    }

    const extension = detectedType === "application/pdf" ? "pdf" : detectedType === "image/png" ? "png" : "jpg";
    const storageKey = `${randomUUID()}.${extension}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, storageKey), req.file.buffer);

    const receipt = await prisma.receipt.create({
      data: {
        requestId: existing.id,
        fileName: req.file.originalname,
        mimeType: detectedType,
        sizeBytes: req.file.size,
        storageKey,
      },
    });

    return res.status(201).json({ receipt });
  },
);

// ---- Receipt download (auth-checked, never a public URL) ----
requestsRouter.get("/:id/receipts/:receiptId", async (req, res) => {
  const request = await loadAuthorizedRequest(req, res, req.params.id);
  if (!request) return;

  const receipt = await prisma.receipt.findUnique({ where: { id: req.params.receiptId } });
  if (!receipt || receipt.requestId !== request.id) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Receipt not found." } });
  }

  const filePath = path.join(UPLOAD_DIR, receipt.storageKey);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Receipt file is missing on the server." } });
  }

  res.setHeader("Content-Type", receipt.mimeType);
  res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(receipt.fileName)}"`);
  return res.sendFile(filePath);
});

// ---- Reviewer: start review ----
requestsRouter.post("/:id/start-review", requireRole(Role.REVIEWER), async (req, res) => {
  const existing = await prisma.reimbursementRequest.findUnique({ where: { id: req.params.id } });
  if (!existing) return notFound(res);
  if (!canTransition(existing.status, RequestStatus.UNDER_REVIEW)) {
    return badRequest(res, `Cannot start review on a request in status ${existing.status}.`);
  }

  const updated = await prisma.reimbursementRequest.update({
    where: { id: existing.id },
    data: { status: RequestStatus.UNDER_REVIEW, reviewerId: req.user!.id },
  });

  await recordHistory({
    requestId: existing.id,
    actorId: req.user!.id,
    action: "STARTED_REVIEW",
    previousStatus: existing.status,
    newStatus: RequestStatus.UNDER_REVIEW,
  });

  return res.json({ request: updated });
});

// ---- Reviewer: approve ----
requestsRouter.post("/:id/approve", requireRole(Role.REVIEWER), async (req, res) => {
  const existing = await prisma.reimbursementRequest.findUnique({ where: { id: req.params.id } });
  if (!existing) return notFound(res);
  if (existing.requesterId === req.user!.id) {
    return forbidden(res, "You cannot approve your own request.");
  }
  if (!canTransition(existing.status, RequestStatus.APPROVED)) {
    return badRequest(res, `Cannot approve a request in status ${existing.status}.`);
  }

  const comment = typeof req.body?.comment === "string" ? req.body.comment.trim() || null : null;

  const updated = await prisma.reimbursementRequest.update({
    where: { id: existing.id },
    data: { status: RequestStatus.APPROVED, reviewerId: req.user!.id },
  });

  await recordHistory({
    requestId: existing.id,
    actorId: req.user!.id,
    action: "APPROVED",
    previousStatus: existing.status,
    newStatus: RequestStatus.APPROVED,
    comment,
  });

  return res.json({ request: updated });
});

// ---- Reviewer: reject (reason required) ----
requestsRouter.post("/:id/reject", requireRole(Role.REVIEWER), async (req, res) => {
  const existing = await prisma.reimbursementRequest.findUnique({ where: { id: req.params.id } });
  if (!existing) return notFound(res);
  if (existing.requesterId === req.user!.id) {
    return forbidden(res, "You cannot reject your own request.");
  }
  if (!canTransition(existing.status, RequestStatus.REJECTED)) {
    return badRequest(res, `Cannot reject a request in status ${existing.status}.`);
  }

  const parsed = rejectSchema.safeParse(req.body);
  if (!parsed.success) {
    return badRequest(res, parsed.error.issues[0]?.message ?? "A rejection reason is required.");
  }

  const updated = await prisma.reimbursementRequest.update({
    where: { id: existing.id },
    data: { status: RequestStatus.REJECTED, reviewerId: req.user!.id, rejectReason: parsed.data.reason },
  });

  await recordHistory({
    requestId: existing.id,
    actorId: req.user!.id,
    action: "REJECTED",
    previousStatus: existing.status,
    newStatus: RequestStatus.REJECTED,
    comment: parsed.data.reason,
  });

  return res.json({ request: updated });
});

// ---- Reviewer: mark an approved request as Paid ----
requestsRouter.post("/:id/pay", requireRole(Role.REVIEWER), async (req, res) => {
  const existing = await prisma.reimbursementRequest.findUnique({ where: { id: req.params.id } });
  if (!existing) return notFound(res);
  if (existing.requesterId === req.user!.id) {
    return forbidden(res, "You cannot mark your own request as paid.");
  }
  if (!canTransition(existing.status, RequestStatus.PAID)) {
    return badRequest(res, `Cannot mark a request in status ${existing.status} as paid.`);
  }

  const updated = await prisma.reimbursementRequest.update({
    where: { id: existing.id },
    data: { status: RequestStatus.PAID },
  });

  await recordHistory({
    requestId: existing.id,
    actorId: req.user!.id,
    action: "PAID",
    previousStatus: existing.status,
    newStatus: RequestStatus.PAID,
  });

  return res.json({ request: updated });
});
