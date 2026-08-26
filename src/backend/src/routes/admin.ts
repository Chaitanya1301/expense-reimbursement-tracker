import { Router } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { recordUserHistory } from "../lib/userHistory";
import { updateUserSchema } from "../schemas/admin";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole(Role.ADMIN));

adminRouter.get("/users", async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, status: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  res.json({ users });
});

adminRouter.patch("/users/:id", async (req, res) => {
  const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found." } });
  }

  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid request." },
    });
  }
  const { role, status } = parsed.data;
  if (!role && !status) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Nothing to update." } });
  }

  const updated = await prisma.user.update({
    where: { id: existing.id },
    data: { ...(role ? { role } : {}), ...(status ? { status } : {}) },
  });

  await recordUserHistory({
    targetUserId: existing.id,
    actorId: req.user!.id,
    action: role && status ? "ROLE_AND_STATUS_CHANGED" : role ? "ROLE_CHANGED" : "STATUS_CHANGED",
    previousRole: role ? existing.role : null,
    newRole: role ? updated.role : null,
    previousStatus: status ? existing.status : null,
    newStatus: status ? updated.status : null,
  });

  res.json({
    user: { id: updated.id, email: updated.email, name: updated.name, role: updated.role, status: updated.status },
  });
});

adminRouter.get("/users/:id/history", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found." } });
  }

  const history = await prisma.userHistory.findMany({
    where: { targetUserId: user.id },
    orderBy: { createdAt: "asc" },
    include: { actor: { select: { id: true, name: true, role: true } } },
  });
  res.json({ history });
});
