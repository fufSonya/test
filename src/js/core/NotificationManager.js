import { escapeHtml, formatRelative } from "../utils.js";
import { icon } from "../icons.js";
import { btn, badge, separator } from "../ui.js";
import { bem, cx } from "../bem.js";

const NOTIFICATIONS_VERSION = 2;

const DEFAULT_NOTIFICATIONS = [
  {
    id: "1",
    type: "approval",
    title: "Проект одобрен",
    message: "Ваш проект 'Веб-приложение' был одобрен руководством",
    timestamp: new Date(2026, 4, 13, 10, 30).toISOString(),
    read: false,
  },
  {
    id: "2",
    type: "comment",
    title: "Новый комментарий",
    message: "Иван Петров оставил комментарий в задаче 'Дизайн главной страницы'",
    timestamp: new Date(2026, 4, 13, 14, 15).toISOString(),
    read: false,
    author: "Иван Петров",
    authorInitials: "ИП",
  },
  {
    id: "3",
    type: "comment",
    title: "Новый комментарий",
    message: "Анна Соколова ответила на ваш комментарий",
    timestamp: new Date(2026, 4, 12, 16, 45).toISOString(),
    read: false,
    author: "Анна Соколова",
    authorInitials: "АС",
  },
  {
    id: "4",
    type: "task",
    title: "Задача назначена",
    message: "Вам назначена задача 'API интеграция'",
    timestamp: new Date(2026, 4, 12, 9, 0).toISOString(),
    read: true,
  },
];

export class NotificationManager {
  constructor() {
    this.panelOpen = false;
    this.cache = null;
    this.docClickBound = false;
    this._onDocumentClick = this.#handleDocumentClick.bind(this);
  }

  load() {
    const version = localStorage.getItem("notificationsVersion");
    if (version !== String(NOTIFICATIONS_VERSION)) {
      localStorage.setItem("notificationsVersion", String(NOTIFICATIONS_VERSION));
      localStorage.setItem("notifications", JSON.stringify(DEFAULT_NOTIFICATIONS));
      return [...DEFAULT_NOTIFICATIONS];
    }

    const saved = localStorage.getItem("notifications");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((n) => ({ ...n, read: Boolean(n.read) }));
        }
      } catch {
        /* defaults */
      }
    }
    return [...DEFAULT_NOTIFICATIONS];
  }

  getAll() {
    if (!this.cache) {
      this.cache = this.load();
    }
    return this.cache;
  }

  save(items) {
    this.cache = items;
    localStorage.setItem("notifications", JSON.stringify(items));
  }

  markAllRead() {
    this.save(this.getAll().map((n) => ({ ...n, read: true })));
  }

  markRead(id) {
    this.save(this.getAll().map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  togglePanel() {
    this.panelOpen = !this.panelOpen;
  }

  closePanel() {
    this.panelOpen = false;
  }

  #getIcon(type) {
    switch (type) {
      case "comment":
        return icon("messageSquare", "h-4 w-4 text-blue-500");
      case "approval":
        return icon("checkCircle2", "h-4 w-4 text-green-500");
      case "task":
        return icon("check", "h-4 w-4 text-purple-500");
      default:
        return icon("bell", "h-4 w-4");
    }
  }

  render(container) {
    if (!container) return;

    const notifications = this.getAll();
    const unread = notifications.filter((n) => !n.read).length;

    container.innerHTML = `
      <div class="${cx(bem("notifications"), "relative")}" id="notif-root">
        ${btn(
          `${icon("bell", "h-5 w-5")}${
            unread > 0
              ? badge(String(unread), {
                  variant: "destructive",
                  className:
                    "absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs pointer-events-none",
                })
              : ""
          }`,
          {
            variant: "ghost",
            size: "icon",
            className: cx(bem("notifications", "trigger"), "relative"),
            attrs:
              'id="notif-btn" aria-label="Уведомления" aria-expanded="' +
              (this.panelOpen ? "true" : "false") +
              '"',
          },
        )}
        ${
          this.panelOpen
            ? `
          <div class="${cx(bem("notifications", "panel"), "absolute right-0 top-full mt-2 w-96 bg-popover text-popover-foreground rounded-lg border shadow-lg z-50")}" id="notif-panel" role="dialog" aria-label="Уведомления">
            <div class="${bem("notifications", "header")} flex items-center justify-between p-4 border-b">
              <h3 class="font-semibold">Уведомления</h3>
              ${
                unread > 0
                  ? btn("Прочитать все", {
                      variant: "ghost",
                      size: "sm",
                      className: cx(bem("notifications", "mark-all"), "h-8 text-xs shrink-0"),
                      attrs: 'id="mark-all-read" type="button"',
                    })
                  : ""
              }
            </div>
            <div class="${bem("notifications", "list")} max-h-[400px] overflow-y-auto">
              ${
                notifications.length === 0
                  ? `<div class="${bem("notifications", "empty")} p-8 text-center text-muted-foreground">Нет уведомлений</div>`
                  : notifications
                      .map((n, index) => {
                        const avatarHtml = n.authorInitials
                          ? `<span class="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted items-center justify-center text-xs font-medium">${escapeHtml(n.authorInitials)}</span>`
                          : `<div class="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">${this.#getIcon(n.type)}</div>`;

                        return `
                <div>
                  <div class="${cx(bem("notifications", "item"), !n.read && bem("notifications", "item", ["unread"]), "p-4 hover:bg-accent cursor-pointer transition-colors")}" data-id="${n.id}" role="button" tabindex="0">
                    <div class="flex gap-3">
                      ${avatarHtml}
                      <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between gap-2 mb-1">
                          <p class="font-medium text-sm">${escapeHtml(n.title)}</p>
                          ${!n.read ? '<div class="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" aria-hidden="true"></div>' : ""}
                        </div>
                        <p class="text-sm text-muted-foreground line-clamp-2">${escapeHtml(n.message)}</p>
                        <p class="text-xs text-muted-foreground mt-1">${formatRelative(n.timestamp)}</p>
                      </div>
                    </div>
                  </div>
                  ${index < notifications.length - 1 ? separator() : ""}
                </div>`;
                      })
                      .join("")
              }
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;

    container.querySelector("#notif-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.togglePanel();
      this.render(container);
    });

    container.querySelector("#mark-all-read")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.markAllRead();
      this.render(container);
    });

    container.querySelectorAll("[data-id]").forEach((item) => {
      const markRead = () => {
        this.markRead(item.dataset.id);
        this.render(container);
      };
      item.addEventListener("click", markRead);
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          markRead();
        }
      });
    });
  }

  mount(container) {
    if (!container) return () => {};
    this.render(container);
    if (!this.docClickBound) {
      document.addEventListener("click", this._onDocumentClick);
      this.docClickBound = true;
    }
    return () => this.destroy();
  }

  refresh() {
    const mount = document.getElementById("notifications-mount");
    if (mount) this.render(mount);
  }

  destroy() {
    this.panelOpen = false;
    this.cache = null;
    if (this.docClickBound) {
      document.removeEventListener("click", this._onDocumentClick);
      this.docClickBound = false;
    }
  }

  #handleDocumentClick(e) {
    const root = document.getElementById("notif-root");
    if (root && !root.contains(e.target)) {
      this.closePanel();
      this.refresh();
    }
  }
}

export const notificationManager = new NotificationManager();
