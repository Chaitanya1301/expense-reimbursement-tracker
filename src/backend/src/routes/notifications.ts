import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

notificationsRouter.get("/", async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { recipientId: req.user!.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unreadCount = await prisma.notification.count({
    where: { recipientId: req.user!.id, isRead: false },
  });
  res.json({ notifications, unreadCount });
});

notificationsRouter.patch("/:id/read", async (req, res) => {
  const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!notification || notification.recipientId !== req.user!.id) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Notification not found." } });
  }
  const updated = await prisma.notification.update({
    where: { id: notification.id },
    data: { isRead: true },
  });
  res.json({ notification: updated });
});
