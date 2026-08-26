import { Fragment, useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getUserHistory,
  listUsers,
  updateUser,
  type AccountStatus,
  type AdminUser,
  type Role,
  type UserHistoryEntry,
} from "../lib/admin";
import { ApiError } from "../lib/api";

const ROLE_OPTIONS: Role[] = ["REQUESTER", "REVIEWER", "ADMIN"];

export function AdminHome() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [history, setHistory] = useState<UserHistoryEntry[] | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await listUsers();
      setUsers(res.users);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleRoleChange(id: string, role: Role) {
    setError(null);
    try {
      await updateUser(id, { role });
      void refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to update role.");
    }
  }

  async function handleStatusToggle(target: AdminUser) {
    setError(null);
    const nextStatus: AccountStatus = target.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateUser(target.id, { status: nextStatus });
      void refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to update account status.");
    }
  }

  async function toggleHistory(id: string) {
    if (expandedUserId === id) {
      setExpandedUserId(null);
      setHistory(null);
      return;
    }
    setExpandedUserId(id);
    setHistory(null);
    const res = await getUserHistory(id);
    setHistory(res.history);
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>Expense Tracker</h1>
          {user && <p>Signed in as {user.name} (Administrator)</p>}
        </div>
        <button onClick={() => void logout()}>Sign out</button>
      </header>

      <main>
        <h2 className="section-title">Users</h2>
        {error && <p className="auth-error">{error}</p>}

        {isLoading ? (
          <p className="loading-state">Loading…</p>
        ) : (
          <table className="request-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <Fragment key={u.id}>
                  <tr>
                    <td data-label="Name">{u.name}</td>
                    <td data-label="Email">{u.email}</td>
                    <td data-label="Role">
                      <select value={u.role} onChange={(e) => void handleRoleChange(u.id, e.target.value as Role)}>
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td data-label="Status">
                      <span className={`status-badge status-${u.status.toLowerCase()}`}>{u.status}</span>
                    </td>
                    <td data-label="Created">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="admin-row-actions">
                        <button onClick={() => void handleStatusToggle(u)}>
                          {u.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </button>
                        <button onClick={() => void toggleHistory(u.id)}>
                          {expandedUserId === u.id ? "Hide History" : "History"}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedUserId === u.id && (
                    <tr>
                      <td colSpan={6}>
                        {history === null ? (
                          <p>Loading history…</p>
                        ) : history.length === 0 ? (
                          <p>No changes recorded yet.</p>
                        ) : (
                          <ul className="history-list">
                            {history.map((h) => (
                              <li key={h.id}>
                                <span className="history-time">{new Date(h.createdAt).toLocaleString()}</span>
                                <span>
                                  <strong>{h.actor.name}</strong> — {h.action.replaceAll("_", " ")}
                                  {h.previousRole || h.newRole ? ` (role: ${h.previousRole ?? "—"} → ${h.newRole ?? "—"})` : ""}
                                  {h.previousStatus || h.newStatus
                                    ? ` (status: ${h.previousStatus ?? "—"} → ${h.newStatus ?? "—"})`
                                    : ""}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
