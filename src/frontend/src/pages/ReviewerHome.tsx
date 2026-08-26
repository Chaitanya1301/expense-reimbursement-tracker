import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { RequestDetail } from "../components/RequestDetail";
import { StatusBadge } from "../components/StatusBadge";
import { NotificationBell } from "../components/NotificationBell";
import {
  approveRequest,
  getDashboardSummary,
  getRequest,
  listRequests,
  markPaid,
  rejectRequest,
  startReview,
  type DashboardSummary,
  type ReimbursementRequest,
  type RequestStatus,
} from "../lib/requests";
import { ApiError } from "../lib/api";

const STATUS_FILTERS: Array<{ value: RequestStatus | ""; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "PAID", label: "Paid" },
];

export function ReviewerHome() {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [requests, setRequests] = useState<ReimbursementRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "">("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<ReimbursementRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.all([
        listRequests({ page, pageSize: 10, status: statusFilter || undefined, keyword: keyword || undefined }),
        getDashboardSummary(),
      ]);
      setRequests(listRes.data);
      setTotalPages(listRes.meta.totalPages);
      setSummary(summaryRes);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, keyword]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function openDetail(id: string) {
    setShowRejectBox(false);
    setRejectReason("");
    setActionError(null);
    const { request } = await getRequest(id);
    setSelected(request);
  }

  async function runAction(action: () => Promise<{ request: ReimbursementRequest }>) {
    setActionError(null);
    try {
      const { request } = await action();
      setSelected(request);
      void refresh();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "That action could not be completed.");
    }
  }

  function renderActions(request: ReimbursementRequest) {
    return (
      <>
        {request.status === "SUBMITTED" && (
          <button onClick={() => void runAction(() => startReview(request.id))}>Start Review</button>
        )}
        {request.status === "UNDER_REVIEW" && !showRejectBox && (
          <>
            <button onClick={() => void runAction(() => approveRequest(request.id))}>Approve</button>
            <button onClick={() => setShowRejectBox(true)}>Reject</button>
          </>
        )}
        {request.status === "UNDER_REVIEW" && showRejectBox && (
          <div className="reject-box">
            <label htmlFor="reject-reason">Rejection reason</label>
            <textarea
              id="reject-reason"
              rows={2}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="request-form-actions">
              <button
                disabled={!rejectReason.trim()}
                onClick={() => void runAction(() => rejectRequest(request.id, rejectReason.trim()))}
              >
                Confirm Rejection
              </button>
              <button type="button" onClick={() => setShowRejectBox(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
        {request.status === "APPROVED" && (
          <button onClick={() => void runAction(() => markPaid(request.id))}>Mark as Paid</button>
        )}
        {actionError && <p className="auth-error">{actionError}</p>}
      </>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>Expense Tracker</h1>
          {user && <p>Signed in as {user.name} (Reviewer)</p>}
        </div>
        <div className="dashboard-header-actions">
          <NotificationBell />
          <button onClick={() => void logout()}>Sign out</button>
        </div>
      </header>

      <main>
        {summary && (
          <section className="summary-tiles">
            <div className="summary-tile">
              <span>Total Requested</span>
              <strong>${summary.totalRequested.toFixed(2)}</strong>
            </div>
            <div className="summary-tile">
              <span>Total Approved</span>
              <strong>${summary.totalApproved.toFixed(2)}</strong>
            </div>
            <div className="summary-tile">
              <span>Total Pending</span>
              <strong>${summary.totalPending.toFixed(2)}</strong>
            </div>
            <div className="summary-tile">
              <span>Total Paid</span>
              <strong>${summary.totalPaid.toFixed(2)}</strong>
            </div>
          </section>
        )}

        {selected && (
          <RequestDetail request={selected} onClose={() => setSelected(null)} actions={renderActions(selected)} />
        )}

        <section className="filters-bar">
          <label htmlFor="status-filter">Status</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value as RequestStatus | "");
            }}
          >
            {STATUS_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <label htmlFor="keyword-filter">Search</label>
          <input
            id="keyword-filter"
            placeholder="Title or description"
            value={keyword}
            onChange={(e) => {
              setPage(1);
              setKeyword(e.target.value);
            }}
          />
        </section>

        {isLoading ? (
          <p className="loading-state">Loading…</p>
        ) : requests.length === 0 ? (
          <p>No reimbursement requests match these filters.</p>
        ) : (
          <table className="request-table">
            <thead>
              <tr>
                <th>Requester</th>
                <th>Title</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Submitted</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} onClick={() => void openDetail(r.id)} className="clickable-row">
                  <td data-label="Requester">{r.requester?.name ?? "—"}</td>
                  <td data-label="Title">{r.title}</td>
                  <td data-label="Amount">${Number(r.amount).toFixed(2)}</td>
                  <td data-label="Category">{r.category.replaceAll("_", " ")}</td>
                  <td data-label="Submitted">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td data-label="Status">
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
