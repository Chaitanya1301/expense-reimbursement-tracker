import { Router } from "express";
import { Role, RequestStatus, type Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get("/summary", requireRole(Role.REQUESTER, Role.REVIEWER), async (req, res) => {
  const where: Prisma.ReimbursementRequestWhereInput =
    req.user!.role === Role.REQUESTER ? { requesterId: req.user!.id } : {};

  const grouped = await prisma.reimbursementRequest.groupBy({
    by: ["status"],
    where,
    _sum: { amount: true },
    _count: { _all: true },
  });

  const sumFor = (statuses: RequestStatus[]) =>
    grouped
      .filter((g) => statuses.includes(g.status))
      .reduce((total, g) => total + Number(g._sum.amount ?? 0), 0);

  const countsByStatus = Object.fromEntries(
    grouped.map((g) => [g.status, g._count._all]),
  ) as Partial<Record<RequestStatus, number>>;

  res.json({
    totalRequested: sumFor([
      RequestStatus.SUBMITTED,
      RequestStatus.UNDER_REVIEW,
      RequestStatus.APPROVED,
      RequestStatus.REJECTED,
      RequestStatus.PAID,
    ]),
    totalApproved: sumFor([RequestStatus.APPROVED, RequestStatus.PAID]),
    totalPending: sumFor([RequestStatus.SUBMITTED, RequestStatus.UNDER_REVIEW]),
    totalPaid: sumFor([RequestStatus.PAID]),
    countsByStatus,
  });
});
