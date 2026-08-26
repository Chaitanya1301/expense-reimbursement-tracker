import { prisma } from "./prisma";

export async function createNotification(params: { recipientId: string; message: string; relatedRequestId?: string }) {
  return prisma.notification.create({
    data: {
      recipientId: params.recipientId,
      message: params.message,
      relatedRequestId: params.relatedRequestId ?? null,
    },
  });
}
