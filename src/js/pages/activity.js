import { escapeHtml, formatRelative, isToday, isYesterday, isThisWeek, isWithinInterval, startOfDay, endOfDay, formatActivityDateTime } from "../utils.js";
import { loadActivities, ACTIVITY_TYPE_FILTER_OPTIONS } from "../activity.js";
import { icon } from "../icons.js";
import { card, cardContent, avatar, badge } from "../ui.js";
import { dateRangePickerButton, bindDateRangePicker } from "../datePicker.js";
import { selectMenu, bindSelectMenu, filterRow, closeSelectMenus } from "../customSelect.js";

const DATE_FILTER_OPTIONS_BASE = [
  { value: "all", label: "Все время" },
  { value: "today", label: "Сегодня" },
  { value: "yesterday", label: "Вчера" },
  { value: "week", label: "На этой неделе" },
];

function getActivityIcon(type) {
  switch (type) {
    case "task_created":
      return icon("plusCircle", "h-4 w-4 text-blue-500");
    case "task_completed":
      return icon("checkCircle2", "h-4 w-4 text-green-500");
    case "task_deleted":
      return icon("trash2", "h-4 w-4 text-red-500");
    case "comment":
      return icon("messageSquare", "h-4 w-4 text-purple-500");
    case "status_changed":
    case "task_updated":
      return icon("edit", "h-4 w-4 text-orange-500");
    case "member_added":
      return icon("userPlus", "h-4 w-4 text-cyan-500");
    case "project_created":
      return icon("plusCircle", "h-4 w-4 text-indigo-500");
    default:
      return icon("activity", "h-4 w-4 text-muted-foreground");
  }
}

export function renderActivity(container) {
  let typeFilter = "all";
  let userFilter = "all";
  let dateFilter = "all";
  let dateRange = { from: undefined, to: undefined };
  let rangeApi = null;

  function getFiltered() {
    let list = loadActivities();

    if (typeFilter !== "all") {
      list = list.filter((a) => a.type === typeFilter);
    }
    if (userFilter !== "all") {
      list = list.filter((a) => a.user === userFilter);
    }
    if (dateRange.from && dateRange.to) {
      list = list.filter((a) =>
        isWithinInterval(a.timestamp, {
          start: startOfDay(dateRange.from),
          end: endOfDay(dateRange.to),
        }),
      );
    } else if (dateFilter !== "all") {
      list = list.filter((a) => {
        switch (dateFilter) {
          case "today":
            return isToday(a.timestamp);
          case "yesterday":
            return isYesterday(a.timestamp);
          case "week":
            return isThisWeek(a.timestamp, 1);
          default:
            return true;
        }
      });
    }
    return list;
  }

  function groupByDate(activities) {
    const groups = { today: [], yesterday: [], thisWeek: [], older: [] };
    activities.forEach((a) => {
      if (isToday(a.timestamp)) groups.today.push(a);
      else if (isYesterday(a.timestamp)) groups.yesterday.push(a);
      else if (isThisWeek(a.timestamp, 1)) groups.thisWeek.push(a);
      else groups.older.push(a);
    });
    return groups;
  }

  function renderGroup(title, items) {
    if (!items.length) return "";
    return `
      <div class="space-y-3">
        <h3 class="text-sm font-medium text-muted-foreground px-1">${title}</h3>
        ${items
          .map(
            (activity, index) => `
          <div>
            ${card(`
              ${cardContent(`
                <div class="flex gap-4 p-0">
                  ${avatar(escapeHtml(activity.userInitials || "??"), "h-10 w-10 flex-shrink-0")}
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2 mb-1">
                      <div class="flex-1">
                        <p class="text-sm">
                          <span class="font-medium">${escapeHtml(activity.user)}</span>
                          <span class="text-muted-foreground"> ${escapeHtml(activity.description)}</span>
                        </p>
                        ${
                          activity.projectName
                            ? `<div class="flex items-center gap-2 mt-1 flex-wrap">
                            ${badge(escapeHtml(activity.projectName), { variant: "outline", className: "text-xs" })}
                            ${activity.taskName ? `<span class="text-xs text-muted-foreground">• ${escapeHtml(activity.taskName)}</span>` : ""}
                          </div>`
                            : ""
                        }
                      </div>
                      <div class="flex-shrink-0">${getActivityIcon(activity.type)}</div>
                    </div>
                    <p class="text-xs text-muted-foreground">
                      ${formatRelative(activity.timestamp)} • ${formatActivityDateTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              `, "p-4")}
            `, "hover:bg-accent/50 transition-colors")}
            ${index < items.length - 1 ? '<div class="h-2"></div>' : ""}
          </div>`,
          )
          .join("")}
      </div>`;
  }

  function render() {
    closeSelectMenus();
    const activities = loadActivities();
    const uniqueUsers = [...new Set(activities.map((a) => a.user))];
    const filtered = getFiltered();
    const grouped = groupByDate(filtered);

    const userOptions = [
      { value: "all", label: "Все сотрудники" },
      ...uniqueUsers.map((u) => ({ value: u, label: u })),
    ];
    const dateOptions = [...DATE_FILTER_OPTIONS_BASE];
    if (dateRange.from && dateRange.to) {
      dateOptions.push({ value: "custom", label: "Выбранный диапазон" });
    }
    const dateFilterValue = dateRange.from && dateRange.to ? "custom" : dateFilter;

    container.innerHTML = `
      <div class="p-6 space-y-6">
        <div>
          <h1>История активности</h1>
          <p class="text-muted-foreground">Все события и изменения в ваших проектах</p>
        </div>

        <div class="space-y-4">
          ${filterRow(`
            ${selectMenu("activity-type-filter", ACTIVITY_TYPE_FILTER_OPTIONS, typeFilter, "w-[220px]", "Тип события")}
            ${selectMenu("activity-user-filter", userOptions, userFilter, "w-[200px]", "Сотрудник")}
            ${selectMenu("activity-date-filter", dateOptions, dateFilterValue, "w-[200px]", "Период")}
            ${dateRangePickerButton()}
            <div class="ml-auto text-sm text-muted-foreground shrink-0">Всего событий: ${filtered.length}</div>
          `)}
        </div>

        <div class="space-y-6">
          ${renderGroup("Сегодня", grouped.today)}
          ${renderGroup("Вчера", grouped.yesterday)}
          ${renderGroup("На этой неделе", grouped.thisWeek)}
          ${renderGroup("Ранее", grouped.older)}
          ${
            filtered.length === 0
              ? '<p class="text-center text-muted-foreground py-8">Нет событий по выбранным фильтрам</p>'
              : ""
          }
        </div>
      </div>
    `;

    bindSelectMenu(container, "activity-type-filter", ACTIVITY_TYPE_FILTER_OPTIONS, (value) => {
      typeFilter = value;
      render();
    });

    bindSelectMenu(container, "activity-user-filter", userOptions, (value) => {
      userFilter = value;
      render();
    });

    bindSelectMenu(container, "activity-date-filter", dateOptions, (value) => {
      if (value !== "custom") {
        dateFilter = value;
        dateRange = { from: undefined, to: undefined };
        rangeApi?.clear?.();
      }
      render();
    });

    rangeApi = bindDateRangePicker(container, {
      onChange: (range) => {
        dateRange = range;
        if (range.from && range.to) {
          dateFilter = "all";
        }
        render();
      },
      onClear: () => {
        dateRange = { from: undefined, to: undefined };
        render();
      },
    });
  }

  render();
}
