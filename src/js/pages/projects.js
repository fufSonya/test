import { escapeHtml, projectStatusBadge, priorityBadge, formatDate, getDeadlineLabel } from "../utils.js";
import { openModal } from "../modal.js";
import { showToast } from "../toast.js";
import { canManageProjects } from "../permissions.js";
import { icon } from "../icons.js";
import { btn, badge, card, cardHeader, cardTitle, cardDescription, cardContent, input, label, formGroup, select } from "../ui.js";
import { selectMenu, bindSelectMenu, filterRow, closeSelectMenus } from "../customSelect.js";

const PROJECT_STATUS_OPTIONS = [
  { value: "all", label: "Все проекты" },
  { value: "active", label: "Активные" },
  { value: "planning", label: "Планирование" },
  { value: "completed", label: "Завершённые" },
  { value: "archived", label: "Архивные" },
];

export function renderProjects(container, ctx) {
  const { projects, tasks, userProfile, onProjectAdd, onProjectUpdate, onProjectDelete, onTaskUpdate } = ctx;
  let statusFilter = "all";

  function getProjectStats(projectId) {
    const projectTasks = tasks.filter((t) => t.projectId === projectId);
    return {
      tasks: projectTasks.length,
      completedTasks: projectTasks.filter((t) => t.status === "done").length,
    };
  }

  function filteredProjects() {
    if (statusFilter === "all") return projects;
    return projects.filter((p) => p.status === statusFilter);
  }

  function openCreateModal() {
    const { overlay, close } = openModal({
      title: "Создать новый проект",
      description: "Добавьте название и описание для вашего проекта",
      bodyHtml: `
        ${formGroup(label("Название проекта", "proj-name"), input('id="proj-name" placeholder="Введите название"'))}
        ${formGroup(label("Описание", "proj-desc"), input('id="proj-desc" placeholder="Краткое описание проекта"'))}
      `,
      footerHtml: `
        ${btn("Отмена", { variant: "outline", attrs: "data-modal-close" })}
        ${btn("Создать проект", { attrs: 'id="proj-create-btn"' })}
      `,
    });

    overlay.querySelector("#proj-create-btn").addEventListener("click", () => {
      const name = overlay.querySelector("#proj-name").value.trim();
      const description = overlay.querySelector("#proj-desc").value.trim();
      if (!name) return;
      onProjectAdd({ id: Date.now().toString(), name, description, status: "planning", members: 1 });
      close();
      showToast("Проект создан");
      render();
    });
  }

  function openProjectDetail(project) {
    const projectTasks = tasks.filter((t) => t.projectId === project.id);
    const stats = getProjectStats(project.id);

    const { overlay, close } = openModal({
      title: escapeHtml(project.name),
      description: escapeHtml(project.description),
      wide: true,
      bodyHtml: `
        <div class="flex gap-2 mb-4 flex-wrap">
          ${projectStatusBadge(project.status)}
          ${badge(`👥 ${project.members}`, { variant: "outline" })}
          ${badge(`✓ ${stats.completedTasks}/${stats.tasks}`, { variant: "outline" })}
        </div>
        <h3 class="font-medium mb-2">Задачи проекта</h3>
        ${
          projectTasks.length === 0
            ? '<p class="text-muted-foreground text-sm">Нет задач</p>'
            : projectTasks
                .map(
                  (t) => `
          <div class="rounded-xl border p-3 mt-2 hover:shadow-md cursor-pointer transition-shadow" data-task-id="${t.id}">
            <p class="font-medium">${escapeHtml(t.title)}</p>
            <p class="text-sm text-muted-foreground">${escapeHtml(t.description)}</p>
            <div class="flex gap-2 mt-2 flex-wrap">${priorityBadge(t.priority)} ${getDeadlineLabel(t.deadline)}</div>
          </div>`,
                )
                .join("")
        }
      `,
      footerHtml: btn("Закрыть", { variant: "outline", attrs: "data-modal-close" }),
    });

    overlay.querySelectorAll("[data-task-id]").forEach((el) => {
      el.addEventListener("click", () => {
        const task = tasks.find((t) => t.id === el.dataset.taskId);
        if (task) openTaskDetail(task, close);
      });
    });
  }

  function openTaskDetail(task, parentClose) {
    const statusOptions = ["todo", "in-progress", "review", "done"]
      .map((s) => {
        const labels = { todo: "К выполнению", "in-progress": "В работе", review: "На проверке", done: "Завершено" };
        return `<option value="${s}" ${task.status === s ? "selected" : ""}>${labels[s]}</option>`;
      })
      .join("");

    const { overlay, close } = openModal({
      title: escapeHtml(task.title),
      description: escapeHtml(task.description),
      bodyHtml: `
        ${formGroup(label("Статус"), select(statusOptions, 'id="task-status"'))}
        <p class="text-sm text-muted-foreground">Исполнитель: ${escapeHtml(task.assignee)}</p>
        <p class="text-sm text-muted-foreground">Дедлайн: ${formatDate(task.deadline)}</p>
      `,
      footerHtml: `
        ${btn("Закрыть", { variant: "outline", attrs: "data-modal-close" })}
        ${btn("Сохранить", { attrs: 'id="task-save"' })}
      `,
    });

    overlay.querySelector("#task-save").addEventListener("click", () => {
      onTaskUpdate({ ...task, status: overlay.querySelector("#task-status").value });
      close();
      if (parentClose) parentClose();
      showToast("Задача обновлена");
      render();
    });
  }

  function openSettingsModal(project, e) {
    if (e) e.stopPropagation();
    const canManage = canManageProjects(userProfile.email);

    const { overlay, close } = openModal({
      title: "Настройки проекта",
      description: "Измените параметры проекта или удалите его",
      bodyHtml: `
        ${formGroup(label("Название", "edit-name"), input(`id="edit-name" value="${escapeHtml(project.name)}"`))}
        ${formGroup(label("Описание", "edit-desc"), input(`id="edit-desc" value="${escapeHtml(project.description)}"`))}
        ${formGroup(
          label("Статус", "edit-status"),
          select(
            ["planning", "active", "completed", "archived"]
              .map((s) => {
                const labels = { planning: "Планирование", active: "Активный", completed: "Завершён", archived: "Архивный" };
                return `<option value="${s}" ${project.status === s ? "selected" : ""}>${labels[s]}</option>`;
              })
              .join(""),
            'id="edit-status"',
          ),
        )}
        ${
          canManage
            ? `<div class="flex gap-2 pt-4 border-t mt-4">
            ${btn(project.status === "archived" ? "Восстановить" : "Архивировать", { variant: "outline", className: "flex-1", attrs: 'id="archive-btn"' })}
            ${btn("Удалить проект", { variant: "destructive", className: "flex-1", attrs: 'id="delete-btn"' })}
          </div>`
            : ""
        }
      `,
      footerHtml: `
        ${btn("Отмена", { variant: "outline", attrs: "data-modal-close" })}
        ${btn("Сохранить изменения", { attrs: 'id="save-proj"' })}
      `,
    });

    overlay.querySelector("#save-proj")?.addEventListener("click", () => {
      onProjectUpdate({
        ...project,
        name: overlay.querySelector("#edit-name").value.trim(),
        description: overlay.querySelector("#edit-desc").value.trim(),
        status: overlay.querySelector("#edit-status").value,
      });
      close();
      showToast("Проект обновлён");
      render();
    });

    overlay.querySelector("#archive-btn")?.addEventListener("click", () => {
      const newStatus = project.status === "archived" ? "active" : "archived";
      onProjectUpdate({ ...project, status: newStatus });
      close();
      showToast(newStatus === "archived" ? "Проект архивирован" : "Проект восстановлен");
      render();
    });

    overlay.querySelector("#delete-btn")?.addEventListener("click", () => {
      onProjectDelete(project.id);
      close();
      showToast("Проект удалён");
      render();
    });
  }

  function render() {
    closeSelectMenus();
    const canManage = canManageProjects(userProfile.email);
    const list = filteredProjects();

    container.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1>Проекты</h1>
            <p class="text-muted-foreground">Управляйте своими проектами и задачами</p>
          </div>
          ${btn(`${icon("plus", "mr-2 h-4 w-4")}Новый проект`, { attrs: 'id="new-project-btn"' })}
        </div>

        ${filterRow(selectMenu("status-filter", PROJECT_STATUS_OPTIONS, statusFilter, "w-[200px]", "Статус проекта"), "mb-6")}

        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          ${
            list.length === 0
              ? '<p class="text-muted-foreground col-span-full text-center py-8">Нет проектов</p>'
              : list
                  .map((project) => {
                    const stats = getProjectStats(project.id);
                    const pct = stats.tasks > 0 ? Math.round((stats.completedTasks / stats.tasks) * 100) : 0;
                    return card(`
                <div class="hover:shadow-lg transition-shadow cursor-pointer group relative" data-project-id="${project.id}">
                  ${cardHeader(`
                    <div class="flex items-start justify-between">
                      ${icon("folderKanban", "h-8 w-8 text-primary")}
                      <div class="flex items-center gap-2">
                        ${projectStatusBadge(project.status)}
                        ${canManage ? btn(icon("settings", "h-4 w-4"), { variant: "ghost", size: "icon", className: "h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity", attrs: `data-settings="${project.id}"` }) : ""}
                      </div>
                    </div>
                    ${cardTitle(escapeHtml(project.name), "mt-4")}
                    ${cardDescription(escapeHtml(project.description))}
                  `)}
                  ${cardContent(`
                    <div class="flex items-center gap-4 text-sm text-muted-foreground">
                      <div class="flex items-center gap-1">${icon("users", "h-4 w-4")}<span>${project.members}</span></div>
                      <div class="flex items-center gap-1">${icon("clock", "h-4 w-4")}<span>${stats.completedTasks}/${stats.tasks} задач</span></div>
                    </div>
                    <div class="mt-4">
                      <div class="flex items-center justify-between text-sm mb-1">
                        <span class="text-muted-foreground">Прогресс</span>
                        <span class="font-medium">${pct}%</span>
                      </div>
                      <div class="h-2 bg-secondary rounded-full overflow-hidden">
                        <div class="h-full bg-primary transition-all" style="width:${pct}%"></div>
                      </div>
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

    container.querySelector("#new-project-btn")?.addEventListener("click", openCreateModal);
    bindSelectMenu(container, "status-filter", PROJECT_STATUS_OPTIONS, (value) => {
      statusFilter = value;
      render();
    });

    container.querySelectorAll("[data-project-id]").forEach((el) => {
      el.addEventListener("click", () => {
        const project = projects.find((p) => p.id === el.dataset.projectId);
        if (project) openProjectDetail(project);
      });
    });

    container.querySelectorAll("[data-settings]").forEach((btnEl) => {
      btnEl.addEventListener("click", (e) => {
        e.stopPropagation();
        const project = projects.find((p) => p.id === btnEl.dataset.settings);
        if (project) openSettingsModal(project, e);
      });
    });
  }

  render();
  return {
    openProjectById(projectId) {
      const project = projects.find((p) => p.id === projectId);
      if (project) openProjectDetail(project);
    },
  };
}
