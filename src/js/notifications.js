import { notificationManager } from "./core/NotificationManager.js";

export function renderNotificationBell(container) {
  return notificationManager.mount(container);
}

export function destroyNotificationBell() {
  notificationManager.destroy();
}

export function refreshNotificationBell() {
  notificationManager.refresh();
}
