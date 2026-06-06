import { escapeHtml, formatRelative, isPast, differenceInDays, differenceInMonths } from "../utils.js";
import { loadActivities } from "../activity.js";
import { icon } from "../icons.js";
import { card, cardHeader, cardTitle, cardDescription, cardContent, badge, avatar } from "../ui.js";

export function renderDashboard(container, { tasks }) {
  const overdueTasks = tasks.filter((t) => isPast(t.deadline) && t.status !== "done");
  const stats = {
    activeProjects: 2,
    tasksInProgress: tasks.filter((t) => t.status === "in-progress").length,
    completedTasks: tasks.filter((t) => t.status === "done").length,
    overdueTasks: overdueTasks.length,
  };

  const mockProjects = [
    {
      name: "Редизайн веб-сайта",
      progress: 65,
      deadline: new Date(2026, 5, 30),
    },
    {
      name: "Мобильное приложение",
      progress: 40,
      deadline: new Date(2026, 6, 15),
    },
  ];

  const activities = loadActivities().slice(0, 4);

  const getPriorityBadge = (priority) => {
    const map = {
      low: { label: "Низкий", className: "bg-blue-600" },
      medium: { label: "Средний", className: "bg-yellow-600" },
      high: { label: "Высокий", className: "bg-red-600" },
    };
    return map[priority] || map.medium;
  };

  const getTimeUntilDeadline = (deadline) => {
    const now = new Date();
    const months = differenceInMonths(deadline, now);
    const days = differenceInDays(deadline, now);
    if (months >= 1) return `Через ${months} мес`;
    if (days >= 1) return `Через ${days} ${days === 1 ? "день" : days < 5 ? "дня" : "дней"}`;
    return "Сегодня";
  };

  container.innerHTML = `
    <div class="p-6 space-y-8">
      <div class="grid gap-4 md:grid-cols-4">
        ${statCard("Активные проекты", stats.activeProjects, "folderKanban")}
        ${statCard("Задачи в работе", stats.tasksInProgress, "checkSquare")}
        ${statCard("Завершено задач", stats.completedTasks, "checkCircle2", "text-green-500")}
        ${statCard("Просрочено", stats.overdueTasks, "alertCircle", "text-red-500")}
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        ${card(`
          ${cardHeader(`
            <div class="flex items-center gap-2">${icon("folderKanban", "h-5 w-5")}${cardTitle("Активные проекты")}</div>
            ${cardDescription("Текущий прогресс по ключевым направлениям")}
          `)}
          ${cardContent(`
            <div class="space-y-4">
              ${mockProjects
                .map(
                  (p) => `
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <h4 class="font-medium">${escapeHtml(p.name)}</h4>
                    <span class="text-sm text-muted-foreground">${getTimeUntilDeadline(p.deadline)}</span>
                  </div>
                  <div class="h-2 bg-secondary rounded-full overflow-hidden">
                    <div class="h-full bg-primary transition-all" style="width:${p.progress}%"></div>
                  </div>
                  <p class="text-sm text-muted-foreground">${p.progress}% завершено</p>
                </div>
              `,
                )
                .join("")}
            </div>
          `)}
        `)}

        ${card(`
          ${cardHeader(`
            <div class="flex items-center gap-2">${icon("activity", "h-5 w-5")}${cardTitle("Последняя активность")}</div>
            ${cardDescription("Недавние действия команды")}
          `)}
          ${cardContent(`
            <div class="space-y-4">
              ${activities
                .map(
                  (a) => `
                <div class="flex items-start gap-3">
                  ${avatar(escapeHtml(a.userInitials || "??"))}
                  <div class="flex-1 min-w-0">
                    <p class="text-sm"><span class="font-medium">${escapeHtml(a.user)}</span> ${escapeHtml(a.description)}</p>
                    <p class="text-xs text-muted-foreground mt-1">${formatRelative(a.timestamp)}</p>
                  </div>
                </div>
              `,
                )
                .join("")}
            </div>
          `)}
        `)}
      </div>

      ${card(`
        ${cardHeader(`
          <div class="flex items-center gap-2">${icon("alertCircle", "h-5 w-5 text-red-500")}${cardTitle("Просроченные задачи")}</div>
          ${cardDescription("Задачи, требующие немедленного внимания")}
        `)}
        ${cardContent(
          overdueTasks.length === 0
            ? '<p class="text-center text-muted-foreground py-4">Нет просроченных задач</p>'
            : `<div class="space-y-3">${overdueTasks
                .map((task) => {
                  const pb = getPriorityBadge(task.priority);
                  return `
              <div class="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                ${icon("alertCircle", "h-5 w-5 text-destructive mt-0.5 flex-shrink-0")}
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2 mb-1">
                    <h4 class="font-medium">${escapeHtml(task.title)}</h4>
                    ${badge(pb.label, { className: pb.className })}
                  </div>
                  <p class="text-sm text-muted-foreground mb-2">${escapeHtml(task.description)}</p>
                  <div class="flex items-center gap-3 text-sm">
                    <span class="text-muted-foreground">Исполнитель: ${escapeHtml(task.assignee)}</span>
                    <span class="text-destructive">Просрочено на ${Math.abs(differenceInDays(task.deadline, new Date()))} дн.</span>
                  </div>
                </div>
              </div>`;
                })
                .join("")}</div>`,
        )}
      `)}
    </div>
  `;
}

function statCard(label, value, iconName, iconColor = "text-foreground") {
  return card(`
    <div class="bg-card border-border hover:bg-accent/50 transition-colors">
      ${cardContent(`
        <div class="flex items-start justify-between p-0">
          <div>
            <p class="text-sm text-muted-foreground mb-2">${label}</p>
            <p class="text-4xl font-semibold">${value}</p>
          </div>
          <div class="p-3 rounded-lg bg-accent">
            ${icon(iconName, `h-6 w-6 ${iconColor}`)}
          </div>
        </div>
      `, "p-6")}
    </div>
  `);
}
