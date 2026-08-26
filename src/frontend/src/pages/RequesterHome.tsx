import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { RequestForm } from "../components/RequestForm";
import { RequestDetail } from "../components/RequestDetail";
import { StatusBadge } from "../components/StatusBadge";
import { getRequest, listRequests, submitRequest, type ReimbursementRequest, type RequestStatus } from "../lib/requests";
import { ApiError } from "../lib/api";

const STATUS_FILTERS: Array<{ value: RequestStatus | ""; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "PAID", label: "Paid" },
];

export function RequesterHome() {
  const { user, logout } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [requests, setRequests] = useState<ReimbursementRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "">("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<ReimbursementRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await listRequests({ page, pageSize: 10, status: statusFilter || undefined });
      setRequests(res.data);
      setTotalPages(res.meta.totalPages);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function openDetail(id: string) {
    const { request } = await getRequest(id);
    setSelected(request);
  }

  async function handleSubmitDraft(id: string) {
    setActionError(null);
    try {
      const { request } = await submitRequest(id);
      setSelected(request);
      void refresh();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Unable to submit the request.");
    }
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>Expense Tracker</h1>
          {user && <p>Signed in as {user.name} (Requester)</p>}
        </div>
        <div className="dashboard-header-actions">
          <button onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancel" : "New Request"}</button>
          <button onClick={() => void logout()}>Sign out</button>
        </div>
      </header>

      <main>
        {showForm && (
          <RequestForm
            onCreated={() => {
              setShowForm(false);
              void refresh();
            }}
          />
        )}

        {selected && (
          <RequestDetail
            request={selected}
            onClose={() => setSelected(null)}
            actions={
              selected.status === "DRAFT" ? (
                <>
                  <button onClick={() => void handleSubmitDraft(selected.id)}>Submit for Review</button>
                  {actionError && <p className="auth-error">{actionError}</p>}
                </>
              ) : undefined
            }
          />
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
        </section>

        {isLoading ? (
          <p className="loading-state">Loading…</p>
        ) : requests.length === 0 ? (
          <p>No reimbursement requests yet.</p>
        ) : (
          <table className="request-table">
            <thead>
              <tr>
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
