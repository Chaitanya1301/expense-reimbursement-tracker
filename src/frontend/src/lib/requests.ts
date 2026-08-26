import { apiFetch } from "./api";

export type RequestStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "PAID";

export type Category =
  | "TRAVEL"
  | "MEALS"
  | "OFFICE_SUPPLIES"
  | "SOFTWARE_SUBSCRIPTIONS"
  | "EVENT_EXPENSES"
  | "TRAINING"
  | "OTHER";

export interface ReimbursementRequest {
  id: string;
  title: string;
  amount: string;
  expenseDate: string;
  category: Category;
  description: string;
  status: RequestStatus;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
  requesterId: string;
  reviewerId: string | null;
  requester?: { id: string; name: string; email: string };
  receipts?: Receipt[];
}

export interface Receipt {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  requestId: string;
}

export interface HistoryEntry {
  id: string;
  action: string;
  previousStatus: RequestStatus | null;
  newStatus: RequestStatus | null;
  comment: string | null;
  createdAt: string;
  actor: { id: string; name: string; role: string };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface ListRequestsParams {
  page?: number;
  pageSize?: number;
  status?: RequestStatus;
  category?: Category;
  keyword?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
}

export interface DashboardSummary {
  totalRequested: number;
  totalApproved: number;
  totalPending: number;
  totalPaid: number;
  countsByStatus: Partial<Record<RequestStatus, number>>;
}

function toQueryString(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function listRequests(params: ListRequestsParams = {}) {
  return apiFetch<PaginatedResponse<ReimbursementRequest>>(`/api/requests${toQueryString(params)}`);
}

export function getRequest(id: string) {
  return apiFetch<{ request: ReimbursementRequest }>(`/api/requests/${id}`);
}

export function getRequestHistory(id: string) {
  return apiFetch<{ history: HistoryEntry[] }>(`/api/requests/${id}/history`);
}

export interface CreateRequestInput {
  title: string;
  amount: number;
  expenseDate: string;
  category: Category;
  description: string;
  submit?: boolean;
}

export function createRequest(input: CreateRequestInput) {
  return apiFetch<{ request: ReimbursementRequest }>(`/api/requests`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function submitRequest(id: string) {
  return apiFetch<{ request: ReimbursementRequest }>(`/api/requests/${id}/submit`, { method: "POST" });
}

export function startReview(id: string) {
  return apiFetch<{ request: ReimbursementRequest }>(`/api/requests/${id}/start-review`, { method: "POST" });
}

export function approveRequest(id: string, comment?: string) {
  return apiFetch<{ request: ReimbursementRequest }>(`/api/requests/${id}/approve`, {
    method: "POST",
    body: JSON.stringify({ comment }),
  });
}

export function rejectRequest(id: string, reason: string) {
  return apiFetch<{ request: ReimbursementRequest }>(`/api/requests/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function markPaid(id: string) {
  return apiFetch<{ request: ReimbursementRequest }>(`/api/requests/${id}/pay`, { method: "POST" });
}

export function getDashboardSummary() {
  return apiFetch<DashboardSummary>(`/api/dashboard/summary`);
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export async function uploadReceipt(requestId: string, file: File): Promise<Receipt> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE_URL}/api/requests/${requestId}/receipts`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error?.message ?? "Failed to upload receipt.");
  }
  return body.receipt as Receipt;
}

/**
 * Receipt files require the auth cookie, and cross-origin <img src>/<a href>
 * requests don't send a SameSite=Lax cookie on subresource loads — so we
 * fetch the bytes via JS (which does send it) and hand back an object URL.
 */
export async function fetchReceiptObjectUrl(requestId: string, receiptId: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/requests/${requestId}/receipts/${receiptId}`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Failed to load receipt.");
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
