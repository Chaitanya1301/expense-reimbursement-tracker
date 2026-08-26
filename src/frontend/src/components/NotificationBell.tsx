import { useEffect, useRef, useState } from "react";
import { listNotifications, markNotificationRead, type AppNotification } from "../lib/notifications";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  async function refresh() {
    const res = await listNotifications();
    setNotifications(res.notifications);
    setUnreadCount(res.unreadCount);
  }

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleClickNotification(notification: AppNotification) {
    if (!notification.isRead) {
      await markNotificationRead(notification.id);
      void refresh();
    }
  }

  return (
    <div className="notification-bell" ref={containerRef}>
      <button onClick={() => setIsOpen((v) => !v)} aria-label="Notifications">
        🔔{unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
      </button>
      {isOpen && (
        <div className="notification-dropdown">
          {notifications.length === 0 ? (
            <p className="notification-empty">No notifications yet.</p>
          ) : (
            <ul>
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={n.isRead ? "notification-read" : "notification-unread"}
                  onClick={() => void handleClickNotification(n)}
                >
                  <span>{n.message}</span>
                  <span className="notification-time">{new Date(n.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
