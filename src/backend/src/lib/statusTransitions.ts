import { RequestStatus } from "@prisma/client";

const ALLOWED_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  DRAFT: [RequestStatus.SUBMITTED],
  SUBMITTED: [RequestStatus.UNDER_REVIEW],
  UNDER_REVIEW: [RequestStatus.APPROVED, RequestStatus.REJECTED],
  APPROVED: [RequestStatus.PAID],
  REJECTED: [],
  PAID: [],
};

export function canTransition(from: RequestStatus, to: RequestStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
