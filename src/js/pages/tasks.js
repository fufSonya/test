import {
  escapeHtml,
  priorityBadge,
  getDeadlineLabel,
  TASK_STATUS_LABELS,
  isPast,
  differenceInDays,
} from "../utils.js";
import { openModal } from "../modal.js";
import { showToast } from "../toast.js";
import { icon } from "../icons.js";
import { btn, badge, card, cardHeader, cardTitle, cardDescription, cardContent, input, label, formGroup, select, textarea } from "../ui.js";
import { datePickerField, bindDatePicker } from "../datePicker.js";
import { selectMenu, bindSelectMenu, filterRow, closeSelectMenus } from "../customSelect.js";

const PRIORITY_FILTER_OPTIONS = [
  { value: "all", label: "Все приоритеты" },
  { value: "high", label: "Высокий" },
  { value: "medium", label: "Средний" },
  { value: "low", label: "Низкий" },
];

const DEADLINE_FILTER_OPTIONS = [
  { value: "all", label: "Все сроки" },
  { value: "overdue", label: "Просрочено" },
  { value: "today", label: "Сегодня" },
  { value: "week", label: "На этой неделе" },
  { value: "month", label: "В этом месяце" },
];

export function renderTasks(container, ctx) {
  const { tasks, projects, onTaskAdd, onTaskUpdate, onTaskDelete } = ctx;
  let filter = "all";
  let priorityFilter = "all";
  let deadlineFilter = "all";
  let assigneeFilter = "all";

  function getFilteredTasks() {
    let filtered = [...tasks];
    if (filter === "overdue") {
      filtered = filtered.filter((t) => isPast(t.deadline) && t.status !== "done");
    } else if (filter !== "all") {
      filtered = filtered.filter((t) => t.status === filter);
    }
    if (priorityFilter !== "all") filtered = filtered.filter((t) => t.priority === priorityFilter);
    if (deadlineFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter((t) => {
        const days = differenceInDays(t.deadline, now);
        if (deadlineFilter === "overdue") return isPast(t.deadline);
        if (deadlineFilter === "today") return days === 0;
        if (deadlineFilter === "week") return days >= 0 && days <= 7;
        if (deadlineFilter === "month") return days >= 0 && days <= 30;
        return true;
      });
    }
    if (assigneeFilter !== "all") filtered = filtered.filter((t) => t.assignee === assigneeFilter);
    return filtered;
  }

  function openCreateModal() {
    const projectOptions = projects.map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("");
    const { overlay, close } = openModal({
      title: "Создать новую задачу",
      description: "Заполните информацию о задаче",
      wide: true,
      bodyHtml: `
        ${formGroup(label("Название задачи *", "task-title"), input('id="task-title" placeholder="Введите название"'))}
        ${formGroup(label("Описание *", "task-desc"), textarea("", 'id="task-desc" rows="3" placeholder="Подробное описание"'))}
        <div class="grid grid-cols-2 gap-4">
          ${formGroup(label("Приоритет"), select('<option value="low">Низкий</option><option value="medium" selected>Средний</option><option value="high">Высокий</option>', 'id="task-priority"'))}
          ${formGroup(label("Статус"), select('<option value="todo">К выполнению</option><option value="in-progress">В работе</option><option value="review">На проверке</option><option value="done">Завершено</option>', 'id="task-status"'))}
        </div>
        ${formGroup(label("Исполнитель *", "task-assignee"), input('id="task-assignee" placeholder="Имя исполнителя"'))}
        ${projects.length > 0 ? formGroup(label("Проект"), select(`<option value="">—</option>${projectOptions}`, 'id="task-project"')) : ""}
        ${formGroup(label("Дедлайн *", "task-deadline"), datePickerField("task-deadline", { placeholder: "Выберите дату дедлайна" }))}
        <div id="task-errors"></div>
      `,
      footerHtml: `
        ${btn("Отмена", { variant: "outline", attrs: "data-modal-close" })}
        ${btn("Создать задачу", { attrs: 'id="task-create"' })}
      `,
    });

    let pickedDeadline;
    bindDatePicker(overlay, "task-deadline", { disablePast: true, onChange: (d) => { pickedDeadline = d; } });

    overlay.querySelector("#task-create").addEventListener("click", () => {
      const title = overlay.querySelector("#task-title").value.trim();
      const description = overlay.querySelector("#task-desc").value.trim();
      const assignee = overlay.querySelector("#task-assignee").value.trim();
      const deadlineVal = overlay.querySelector("#task-deadline").value;
      const deadlineDate = pickedDeadline || (deadlineVal ? new Date(deadlineVal) : null);
      const errors = [];
      if (!title) errors.push("Укажите название");
      if (!description) errors.push("Укажите описание");
      if (!assignee) errors.push("Укажите исполнителя");
      if (!deadlineDate) errors.push("Укажите дедлайн");
      if (errors.length) {
        overlay.querySelector("#task-errors").innerHTML = `<p class="text-sm text-destructive mt-2">${errors.join("<br>")}</p>`;
        return;
      }
      onTaskAdd({
        id: Date.now().toString(),
        title,
        description,
        status: overlay.querySelector("#task-status").value,
        priority: overlay.querySelector("#task-priority").value,
        assignee,
        deadline: deadlineDate,
        createdAt: new Date(),
        participants: [assignee],
        projectId: overlay.querySelector("#task-project")?.value || "",
      });
      close();
      showToast("Задача создана");
      render();
    });
  }

  function openTaskDetail(task) {
    const statusOptions = Object.entries(TASK_STATUS_LABELS)
      .map(([val, labelText]) => `<option value="${val}" ${task.status === val ? "selected" : ""}>${labelText}</option>`)
      .join("");
    const { overlay, close } = openModal({
      title: escapeHtml(task.title),
      description: "Детали задачи",
      wide: true,
      bodyHtml: `
        ${formGroup(label("Описание"), textarea(escapeHtml(task.description), 'id="detail-desc" rows="3"'))}
        <div class="grid grid-cols-2 gap-4">
          ${formGroup(label("Статус"), select(statusOptions, 'id="detail-status"'))}
          ${formGroup(label("Приоритет"), select('<option value="low">Низкий</option><option value="medium">Средний</option><option value="high">Высокий</option>', 'id="detail-priority"'))}
        </div>
        ${formGroup(label("Исполнитель"), input(`id="detail-assignee" value="${escapeHtml(task.assignee)}"`))}
        ${formGroup(label("Дедлайн"), datePickerField("detail-deadline", { value: task.deadline, placeholder: "Выберите дату" }))}
      `,
      footerHtml: `
        ${btn("Удалить", { variant: "destructive", attrs: 'id="detail-delete"' })}
        ${btn("Закрыть", { variant: "outline", attrs: "data-modal-close" })}
        ${btn("Сохранить", { attrs: 'id="detail-save"' })}
      `,
    });

    let detailDeadline = task.deadline;
    bindDatePicker(overlay, "detail-deadline", { onChange: (d) => { detailDeadline = d; } });

    overlay.querySelector("#detail-save").addEventListener("click", () => {
      const hidden = overlay.querySelector("#detail-deadline").value;
      onTaskUpdate({
        ...task,
        description: overlay.querySelector("#detail-desc").value.trim(),
        status: overlay.querySelector("#detail-status").value,
        priority: overlay.querySelector("#detail-priority").value,
        assignee: overlay.querySelector("#detail-assignee").value.trim(),
        deadline: detailDeadline || (hidden ? new Date(hidden) : task.deadline),
      });
      close();
      showToast("Задача обновлена");
      render();
    });

    overlay.querySelector("#detail-delete")?.addEventListener("click", () => {
      if (onTaskDelete) onTaskDelete(task.id);
      close();
      showToast("Задача удалена");
      render();
    });
  }

  function statusIcon(status) {
    const map = { todo: "circle", "in-progress": "clock", review: "eye", done: "checkCircle2" };
    const colors = { todo: "", "in-progress": "text-blue-500", review: "text-purple-500", done: "text-green-500" };
    return icon(map[status] || "circle", `h-4 w-4 ${colors[status] || ""}`);
  }

  function render() {
    closeSelectMenus();
    const filtered = getFilteredTasks();
    const assignees = [...new Set(tasks.map((t) => t.assignee).filter(Boolean))];
    const assigneeOptions = [
      { value: "all", label: "Все исполнители" },
      ...assignees.map((a) => ({ value: a, label: a })),
    ];
    const filterLabels = {
      all: "Все",
      todo: "К выполнению",
      "in-progress": "В работе",
      review: "На проверке",
      done: "Завершено",
      overdue: "Просрочено",
    };

    container.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1>Задачи</h1>
            <p class="text-muted-foreground">Управляйте задачами вашей команды</p>
          </div>
          ${btn(`${icon("plus", "mr-2 h-4 w-4")}Новая задача`, { attrs: 'id="new-task-btn"' })}
        </div>

        <div class="space-y-4 mb-6">
          <div class="flex gap-2 flex-wrap">
            ${["all", "todo", "in-progress", "review", "done", "overdue"]
              .map((f) => {
                const variant =
                  f === "overdue"
                    ? filter === "overdue"
                      ? "destructive"
                      : "outline"
                    : filter === f
                      ? "default"
                      : "outline";
                return btn(filterLabels[f], { variant, attrs: `data-filter="${f}"` });
              })
              .join("")}
          </div>

          ${filterRow(`
            ${selectMenu("priority-filter", PRIORITY_FILTER_OPTIONS, priorityFilter, "w-[180px]", "Приоритет")}
            ${selectMenu("deadline-filter", DEADLINE_FILTER_OPTIONS, deadlineFilter, "w-[180px]", "Дедлайн")}
            ${selectMenu("assignee-filter", assigneeOptions, assigneeFilter, "w-[180px]", "Исполнитель")}
          `)}
        </div>

        <div class="grid gap-4">
          ${
            filtered.length === 0
              ? '<p class="text-center text-muted-foreground py-8">Нет задач</p>'
              : filtered
                  .map((task) => {
                    const projectName = projects.find((p) => p.id === task.projectId)?.name;
                    return card(`
              <div class="hover:shadow-md transition-shadow cursor-pointer" data-task-id="${task.id}">
                ${cardHeader(`
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex items-start gap-3 flex-1">
                      ${statusIcon(task.status)}
                      <div>
                        ${cardTitle(escapeHtml(task.title))}
                        ${cardDescription(escapeHtml(task.description), "mt-1")}
                      </div>
                    </div>
                    ${priorityBadge(task.priority)}
                  </div>
                `)}
                ${cardContent(`
                  <div class="flex items-center justify-between flex-wrap gap-2 text-sm">
                    <div class="flex items-center gap-4">
                      <span><span class="text-muted-foreground">Исполнитель:</span> ${escapeHtml(task.assignee)}</span>
                      ${projectName ? badge(escapeHtml(projectName), { variant: "outline", className: "text-xs" }) : ""}
                    </div>
                    <div class="flex items-center gap-2">${getDeadlineLabel(task.deadline)}</div>
                  </div>
                `)}
              </div>
            `);
                  })
                  .join("")
          }
        </div>
      </div>
    `;

    container.querySelector("#new-task-btn")?.addEventListener("click", openCreateModal);
    container.querySelectorAll("[data-filter]").forEach((el) => {
      el.addEventListener("click", () => {
        filter = el.dataset.filter;
        render();
      });
    });
    bindSelectMenu(container, "priority-filter", PRIORITY_FILTER_OPTIONS, (value) => {
      priorityFilter = value;
      render();
    });
    bindSelectMenu(container, "deadline-filter", DEADLINE_FILTER_OPTIONS, (value) => {
      deadlineFilter = value;
      render();
    });
    bindSelectMenu(container, "assignee-filter", assigneeOptions, (value) => {
      assigneeFilter = value;
      render();
    });
    container.querySelectorAll("[data-task-id]").forEach((el) => {
      el.addEventListener("click", () => {
        const task = tasks.find((t) => t.id === el.dataset.taskId);
        if (task) openTaskDetail(task);
      });
    });
  }

  render();
}
