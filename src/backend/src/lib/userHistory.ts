import { prisma } from "./prisma";
import type { AccountStatus, Role } from "@prisma/client";

export async function recordUserHistory(params: {
  targetUserId: string;
  actorId: string;
  action: string;
  previousRole?: Role | null;
  newRole?: Role | null;
  previousStatus?: AccountStatus | null;
  newStatus?: AccountStatus | null;
}) {
  return prisma.userHistory.create({
    data: {
      targetUserId: params.targetUserId,
      actorId: params.actorId,
      action: params.action,
      previousRole: params.previousRole ?? null,
      newRole: params.newRole ?? null,
      previousStatus: params.previousStatus ?? null,
      newStatus: params.newStatus ?? null,
    },
  });
}
