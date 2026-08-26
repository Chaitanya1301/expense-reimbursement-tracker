import { apiFetch } from "./api";

export type Role = "REQUESTER" | "REVIEWER" | "ADMIN";
export type AccountStatus = "ACTIVE" | "INACTIVE";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: AccountStatus;
  createdAt: string;
}

export interface UserHistoryEntry {
  id: string;
  action: string;
  previousRole: Role | null;
  newRole: Role | null;
  previousStatus: AccountStatus | null;
  newStatus: AccountStatus | null;
  createdAt: string;
  actor: { id: string; name: string; role: Role };
}

export function listUsers() {
  return apiFetch<{ users: AdminUser[] }>(`/api/admin/users`);
}

export function updateUser(id: string, changes: { role?: Role; status?: AccountStatus }) {
  return apiFetch<{ user: AdminUser }>(`/api/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(changes),
  });
}

export function getUserHistory(id: string) {
  return apiFetch<{ history: UserHistoryEntry[] }>(`/api/admin/users/${id}/history`);
}
