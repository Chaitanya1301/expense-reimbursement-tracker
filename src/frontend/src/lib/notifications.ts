import { apiFetch } from "./api";

export interface AppNotification {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedRequestId: string | null;
}

export function listNotifications() {
  return apiFetch<{ notifications: AppNotification[]; unreadCount: number }>(`/api/notifications`);
}

export function markNotificationRead(id: string) {
  return apiFetch<{ notification: AppNotification }>(`/api/notifications/${id}/read`, { method: "PATCH" });
}
