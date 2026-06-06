import { badge } from "./ui.js";
import { icon } from "./icons.js";

export function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

export function getInitials(name) {
  return (name || "??")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatDate(date) {
  if (!date) return "—";
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date) {
  if (!date) return "—";
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelative(date) {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "только что";
  if (diffMin < 60) return `${diffMin} мин. назад`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} ч. назад`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "вчера";
  if (diffDays < 7) return `${diffDays} дн. назад`;
  return formatDate(d);
}

export function isPast(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d < new Date();
}

export function differenceInDays(date1, date2) {
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);
  const ms = d1.getTime() - d2.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function differenceInHours(date1, date2) {
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);
  const ms = d1.getTime() - d2.getTime();
  return Math.floor(ms / (1000 * 60 * 60));
}

export function differenceInMonths(date1, date2) {
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);
  return (d1.getFullYear() - d2.getFullYear()) * 12 + (d1.getMonth() - d2.getMonth());
}

export function startOfDay(date) {
  const d = date instanceof Date ? new Date(date) : new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date) {
  const d = date instanceof Date ? new Date(date) : new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function isToday(date) {
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  return startOfDay(d).getTime() === startOfDay(now).getTime();
}

export function isYesterday(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return startOfDay(d).getTime() === startOfDay(y).getTime();
}

export function isThisWeek(date, weekStartsOn = 1) {
  const d = startOfDay(date instanceof Date ? date : new Date(date));
  const now = new Date();
  const day = (now.getDay() + 7 - weekStartsOn) % 7;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - day);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return d >= weekStart && d <= weekEnd;
}

export function isWithinInterval(date, { start, end }) {
  const t = (date instanceof Date ? date : new Date(date)).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

export function formatActivityDateTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  const months = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${months[d.getMonth()]}, ${hh}:${mm}`;
}

export const PROJECT_STATUS_LABELS = {
  active: "Активный",
  completed: "Завершён",
  planning: "Планирование",
  archived: "Архивный",
};

export const TASK_STATUS_LABELS = {
  todo: "К выполнению",
  "in-progress": "В работе",
  review: "На проверке",
  done: "Завершено",
};

export const PRIORITY_LABELS = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
};

export function projectStatusBadge(status) {
  const label = PROJECT_STATUS_LABELS[status] || status;
  const variant =
    status === "active" ? "default" : status === "archived" ? "outline" : "secondary";
  return badge(escapeHtml(label), { variant });
}

export function priorityBadge(priority) {
  const label = PRIORITY_LABELS[priority] || priority;
  const variant =
    priority === "high" ? "destructive" : priority === "low" ? "outline" : "default";
  return badge(escapeHtml(label), { variant });
}

export function getDeadlineLabel(deadline) {
  const now = new Date();
  const days = differenceInDays(deadline, now);
  const hours = differenceInHours(deadline, now);

  if (isPast(deadline)) {
    return `<span class="text-destructive inline-flex items-center gap-1">${icon("alertCircle", "h-4 w-4")}<span>Просрочено</span></span>`;
  }
  if (days === 0) {
    return `<span class="text-orange-500 inline-flex items-center gap-1">${icon("clock", "h-4 w-4")}<span>Сегодня (${hours}ч)</span></span>`;
  }
  if (days === 1) {
    return `<span class="text-orange-500 inline-flex items-center gap-1">${icon("clock", "h-4 w-4")}<span>Завтра</span></span>`;
  }
  if (days <= 3) {
    return `<span class="text-yellow-600 inline-flex items-center gap-1">${icon("clock", "h-4 w-4")}<span>${days} дня</span></span>`;
  }
  return `<span class="text-muted-foreground inline-flex items-center gap-1">${icon("clock", "h-4 w-4")}<span>${days} дней</span></span>`;
}
