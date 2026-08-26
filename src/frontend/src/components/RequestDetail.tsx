import { useEffect, useState, type ReactNode } from "react";
import {
  fetchReceiptObjectUrl,
  getRequestHistory,
  type HistoryEntry,
  type ReimbursementRequest,
} from "../lib/requests";
import { StatusBadge } from "./StatusBadge";

const CATEGORY_LABELS: Record<string, string> = {
  TRAVEL: "Travel",
  MEALS: "Meals",
  OFFICE_SUPPLIES: "Office Supplies",
  SOFTWARE_SUBSCRIPTIONS: "Software / Subscriptions",
  EVENT_EXPENSES: "Event Expenses",
  TRAINING: "Training",
  OTHER: "Other",
};

function formatCurrency(amount: string) {
  return `$${Number(amount).toFixed(2)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString();
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString();
}

export function RequestDetail({
  request,
  onClose,
  actions,
}: {
  request: ReimbursementRequest;
  onClose: () => void;
  actions?: ReactNode;
}) {
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getRequestHistory(request.id)
      .then((res) => {
        if (!cancelled) setHistory(res.history);
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      });
    return () => {
      cancelled = true;
    };
  }, [request.id]);

  async function viewReceipt(receiptId: string) {
    setReceiptError(null);
    try {
      const url = await fetchReceiptObjectUrl(request.id, receiptId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setReceiptError("Unable to load the receipt.");
    }
  }

  return (
    <div className="request-detail">
      <div className="request-detail-header">
        <div>
          <h2>{request.title}</h2>
          <StatusBadge status={request.status} />
        </div>
        <button onClick={onClose}>Close</button>
      </div>

      <dl className="request-detail-fields">
        <dt>Amount</dt>
        <dd>{formatCurrency(request.amount)}</dd>
        <dt>Expense date</dt>
        <dd>{formatDate(request.expenseDate)}</dd>
        <dt>Category</dt>
        <dd>{CATEGORY_LABELS[request.category] ?? request.category}</dd>
        <dt>Requester</dt>
        <dd>{request.requester ? `${request.requester.name} (${request.requester.email})` : request.requesterId}</dd>
        <dt>Description</dt>
        <dd>{request.description}</dd>
        {request.status === "REJECTED" && request.rejectReason && (
          <>
            <dt>Rejection reason</dt>
            <dd className="reject-reason">{request.rejectReason}</dd>
          </>
        )}
      </dl>

      <div className="request-detail-section">
        <h3>Receipts</h3>
        {request.receipts && request.receipts.length > 0 ? (
          <ul className="receipt-list">
            {request.receipts.map((r) => (
              <li key={r.id}>
                <button type="button" onClick={() => viewReceipt(r.id)}>
                  {r.fileName}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No receipt attached.</p>
        )}
        {receiptError && <p className="auth-error">{receiptError}</p>}
      </div>

      {actions && <div className="request-detail-actions">{actions}</div>}

      <div className="request-detail-section">
        <h3>History</h3>
        {history === null ? (
          <p>Loading…</p>
        ) : history.length === 0 ? (
          <p>No history yet.</p>
        ) : (
          <ul className="history-list">
            {history.map((h) => (
              <li key={h.id}>
                <span className="history-time">{formatDateTime(h.createdAt)}</span>
                <span>
                  <strong>{h.actor.name}</strong> ({h.actor.role.toLowerCase()}) — {h.action.replaceAll("_", " ")}
                  {h.comment ? `: "${h.comment}"` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
