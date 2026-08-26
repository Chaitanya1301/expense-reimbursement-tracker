import { prisma } from "./prisma";
import type { RequestStatus } from "@prisma/client";

export async function recordHistory(params: {
  requestId: string;
  actorId: string;
  action: string;
  previousStatus?: RequestStatus | null;
  newStatus?: RequestStatus | null;
  comment?: string | null;
}) {
  return prisma.requestHistory.create({
    data: {
      requestId: params.requestId,
      actorId: params.actorId,
      action: params.action,
      previousStatus: params.previousStatus ?? null,
      newStatus: params.newStatus ?? null,
      comment: params.comment ?? null,
    },
  });
}
