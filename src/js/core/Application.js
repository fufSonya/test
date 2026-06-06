import { stateManager } from "./StateManager.js";
import { themeManager } from "./ThemeManager.js";
import { DataFormatter } from "./DataFormatter.js";
import { RealtimeSync } from "./RealtimeSync.js";
import { notificationManager } from "./NotificationManager.js";
import { ensureCurrentUserInTeam } from "../team-data.js";
import { addActivity } from "../activity.js";
import { getInitials } from "../utils.js";
import projectService from "../api/projectService.js";
import taskService from "../api/taskService.js";
import { renderLogin } from "../pages/login.js";
import { renderDashboard } from "../pages/dashboard.js";
import { renderProjects } from "../pages/projects.js";
import { renderTasks } from "../pages/tasks.js";
import { renderTeam } from "../pages/team.js";
import { renderRoles } from "../pages/roles.js";
import { renderActivity } from "../pages/activity.js";
import { renderSettings } from "../pages/settings.js";
import { btn, badge, themeToggleBtn } from "../ui.js";
import { icon } from "../icons.js";
import { bem, cx } from "../bem.js";

const PAGE_TITLES = {
  dashboard: "Панель управления",
  projects: "Проекты",
  tasks: "Задачи",
  team: "Команда",
  roles: "Роли и права",
  activity: "История активности",
  settings: "Настройки",
};

export class Application {
  constructor() {
    this.stateManager = stateManager;
    this.themeManager = themeManager;
    this.realtimeSync = new RealtimeSync(stateManager);
    this.projectsPageApi = null;
    this.notificationsCleanup = null;
    this.pendingOpenProjectId = null;
    this.handlers = this.#createHandlers();
  }

  get state() {
    return this.stateManager.getState();
  }

  async init() {
    this.themeManager.init();

    const savedAuth = localStorage.getItem("isAuthenticated");
    const savedProfile = localStorage.getItem("userProfile");

    if (savedAuth === "true" && savedProfile) {
      this.stateManager.setState({
        isAuthenticated: true,
        userProfile: JSON.parse(savedProfile),
      });
      ensureCurrentUserInTeam(this.state.userProfile);
      await this.#loadData();
      this.realtimeSync.start();
    }

    this.stateManager.subscribe(() => this.render());
    this.render();

    window.addEventListener("openProject", (e) => {
      this.pendingOpenProjectId = e.detail?.projectId;
      this.navigate("projects");
    });
  }

  navigate(page) {
    this.stateManager.setState({ currentPage: page, sidebarOpen: false });
  }

  async #loadData() {
    const [projectsData, tasksData] = await Promise.all([
      projectService.getProjects(),
      taskService.getTasks(),
    ]);

    this.stateManager.setState({
      projects: projectsData ? projectsData.map(DataFormatter.formatProject) : [],
      tasks: tasksData ? tasksData.map(DataFormatter.formatTask) : [],
    });
  }

  #logActivity(type, description, taskName, projectName) {
    addActivity({
      type,
      user: this.state.userProfile.name || "Пользователь",
      userInitials: getInitials(this.state.userProfile.name || "ПО"),
      description,
      timestamp: new Date(),
      taskName,
      projectName,
    });
  }

  #createHandlers() {
    const app = this;
    return {
      onLogin(name, email) {
        const profile = { name, email };
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userProfile", JSON.stringify(profile));
        app.stateManager.setState({ isAuthenticated: true, userProfile: profile });
        ensureCurrentUserInTeam(profile);
        app.#loadData();
        app.realtimeSync.start();
      },

      onProfileUpdate(name, email) {
        const profile = { name, email };
        localStorage.setItem("userProfile", JSON.stringify(profile));
        app.stateManager.setState({ userProfile: profile });
      },

      onLogout() {
        localStorage.removeItem("isAuthenticated");
        app.realtimeSync.stop();
        app.stateManager.setState({ isAuthenticated: false, currentPage: "dashboard" });
      },

      async onProjectAdd(project) {
        app.stateManager.setState({ projects: [...app.state.projects, project] });
        app.#logActivity("project_created", `создал(а) новый проект '${project.name}'`, undefined, project.name);
        await projectService.createProject({
          name: project.name,
          description: project.description,
          status: project.status,
          members: project.members,
        });
        await app.#loadData();
      },

      onProjectUpdate(project) {
        app.stateManager.setState({
          projects: app.state.projects.map((p) => (p.id === project.id ? project : p)),
        });
        projectService.updateProject(project.id, {
          name: project.name,
          description: project.description,
          status: project.status,
          members: project.members,
        });
      },

      onProjectDelete(projectId) {
        app.stateManager.setState({ projects: app.state.projects.filter((p) => p.id !== projectId) });
        projectService.deleteProject(projectId);
      },

      onTaskUpdate(updatedTask) {
        const old = app.state.tasks.find((t) => t.id === updatedTask.id);
        app.stateManager.setState({
          tasks: app.state.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
        });
        if (old && old.status !== updatedTask.status) {
          const labels = {
            todo: "К выполнению",
            "in-progress": "В работе",
            review: "На проверке",
            done: "Завершено",
          };
          app.#logActivity(
            "status_changed",
            `изменил(а) статус задачи '${updatedTask.title}' на '${labels[updatedTask.status]}'`,
            updatedTask.title,
          );
        }
        taskService.updateTask(updatedTask.id, updatedTask.status);
      },

      async onTaskAdd(newTask) {
        app.stateManager.setState({ tasks: [...app.state.tasks, newTask] });
        app.#logActivity("task_created", `создал(а) новую задачу '${newTask.title}'`, newTask.title);
        const result = await taskService.createTask({
          title: newTask.title,
          description: newTask.description,
          status: newTask.status,
          priority: newTask.priority,
          assignee: newTask.assignee,
          deadline: newTask.deadline.toISOString(),
          project_id: newTask.projectId,
        });
        if (result) await app.#loadData();
      },

      async onTaskDelete(taskId) {
        const task = app.state.tasks.find((t) => t.id === taskId);
        app.stateManager.setState({ tasks: app.state.tasks.filter((t) => t.id !== taskId) });
        if (task) app.#logActivity("task_deleted", `удалил(а) задачу '${task.title}'`, task.title);
        await taskService.deleteTask(taskId);
      },
    };
  }

  #navBtn(page, label, iconName, count) {
    const active = this.state.currentPage === page;
    const countBadge =
      count !== undefined ? badge(String(count), { variant: "secondary", className: "ml-auto" }) : "";
    return btn(`${icon(iconName, "mr-3 h-4 w-4")}${label}${countBadge}`, {
      variant: active ? "secondary" : "ghost",
      className: cx(bem("app", "nav-item"), active && bem("app", "nav-item", ["active"]), "w-full justify-start"),
      attrs: `data-page="${page}"`,
    });
  }

  render() {
    const root = document.getElementById("app");
    if (!root) return;

    if (!this.state.isAuthenticated) {
      if (this.notificationsCleanup) {
        notificationManager.destroy();
        this.notificationsCleanup = null;
      }
      this.realtimeSync.stop();
      renderLogin(root, this.handlers);
      return;
    }

    const activeProjects = this.state.projects.filter((p) => p.status === "active");
    const sidebarClass = this.state.sidebarOpen ? "translate-x-0" : "-translate-x-full";

    root.innerHTML = `
    <div class="${cx(bem("app"), "flex h-screen bg-background")}">
      ${
        this.state.sidebarOpen
          ? `<div class="${cx(bem("app", "overlay"), "fixed inset-0 z-40 bg-black/50 md:hidden")}" id="sidebar-overlay"></div>`
          : ""
      }
      <aside class="${cx(bem("app", "sidebar"), "fixed inset-y-0 left-0 z-50 w-80 border-r border-border bg-card flex flex-col transition-transform duration-200 md:static md:translate-x-0", sidebarClass)}">
        <div class="${cx(bem("app", "sidebar-header"), "p-6 border-b border-border flex items-center justify-between")}">
          <div>
            <h2 class="${cx(bem("app", "sidebar-title"), "font-semibold text-xl")}">TaskFlow</h2>
            <p class="${cx(bem("app", "sidebar-subtitle"), "text-sm text-muted-foreground mt-1")}">Управление проектами</p>
          </div>
          ${btn(icon("x", "h-5 w-5"), { variant: "ghost", size: "icon", className: "md:hidden", attrs: 'id="close-sidebar"' })}
        </div>
        <nav class="${cx(bem("app", "nav"), "flex-1 p-4 space-y-1 overflow-auto")}">
          ${this.#navBtn("dashboard", "Панель управления", "layoutDashboard")}
          ${this.#navBtn("projects", "Проекты", "folderKanban", this.state.projects.length)}
          ${this.#navBtn("tasks", "Задачи", "checkSquare", this.state.tasks.length)}
          <div class="pt-6">
            <p class="${cx(bem("app", "nav-section-title"), "px-3 mb-2 text-sm text-muted-foreground")}">Активные проекты</p>
            <div class="space-y-1">
              ${activeProjects
                .map(
                  (p) =>
                    btn(`<div class="mr-3 h-2 w-2 rounded-full bg-blue-500"></div>${this.#escapeHtml(p.name)}`, {
                      variant: "ghost",
                      className: cx(bem("app", "nav-item"), "w-full justify-start text-sm"),
                      attrs: `data-open-project="${p.id}"`,
                    }),
                )
                .join("")}
            </div>
          </div>
        </nav>
        <div class="p-4 border-t border-border space-y-1">
          ${this.#navBtn("team", "Команда", "users")}
          ${this.#navBtn("roles", "Роли", "shield")}
          ${this.#navBtn("activity", "История", "activity")}
          ${this.#navBtn("settings", "Настройки", "settings")}
        </div>
      </aside>
      <div class="flex-1 flex flex-col min-w-0">
        <header class="${cx(bem("app", "header"), "h-16 border-b border-border bg-card flex items-center justify-between px-6")}">
          <div class="flex items-center gap-4">
            ${btn(icon("menu", "h-5 w-5"), { variant: "ghost", size: "icon", className: "md:hidden", attrs: 'id="open-sidebar"' })}
            <h1 class="${cx(bem("app", "header-title"), "text-xl")}">${PAGE_TITLES[this.state.currentPage]}</h1>
          </div>
          <div class="flex items-center gap-2">
            <div id="notifications-mount"></div>
            ${themeToggleBtn()}
          </div>
        </header>
        <main class="${cx(bem("app", "main"), "flex-1 overflow-auto")}" id="page-content"></main>
      </div>
    </div>
  `;

    this.#bindShellEvents();
    this.#renderCurrentPage();

    const notifMount = document.getElementById("notifications-mount");
    if (notifMount) {
      if (!this.notificationsCleanup) {
        this.notificationsCleanup = notificationManager.mount(notifMount);
      } else {
        notificationManager.refresh();
      }
    }
  }

  #escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  #bindShellEvents() {
    document.querySelectorAll("[data-page]").forEach((el) => {
      el.addEventListener("click", () => this.navigate(el.dataset.page));
    });

    document.querySelectorAll("[data-open-project]").forEach((el) => {
      el.addEventListener("click", () => {
        this.pendingOpenProjectId = el.dataset.openProject;
        this.navigate("projects");
      });
    });

    document.getElementById("open-sidebar")?.addEventListener("click", () => {
      this.stateManager.setState({ sidebarOpen: true });
    });
    document.getElementById("close-sidebar")?.addEventListener("click", () => {
      this.stateManager.setState({ sidebarOpen: false });
    });
    document.getElementById("sidebar-overlay")?.addEventListener("click", () => {
      this.stateManager.setState({ sidebarOpen: false });
    });
    document.getElementById("theme-toggle")?.addEventListener("click", () => {
      this.themeManager.toggle();
      this.render();
    });
  }

  #renderCurrentPage() {
    const container = document.getElementById("page-content");
    if (!container) return;

    const ctx = { ...this.state, ...this.handlers, userProfile: this.state.userProfile };
    this.projectsPageApi = null;

    switch (this.state.currentPage) {
      case "dashboard":
        renderDashboard(container, ctx);
        break;
      case "projects":
        this.projectsPageApi = renderProjects(container, ctx);
        if (this.pendingOpenProjectId && this.projectsPageApi) {
          setTimeout(() => {
            this.projectsPageApi.openProjectById(this.pendingOpenProjectId);
            this.pendingOpenProjectId = null;
          }, 50);
        }
        break;
      case "tasks":
        renderTasks(container, ctx);
        break;
      case "team":
        renderTeam(container, ctx);
        break;
      case "roles":
        renderRoles(container, ctx);
        break;
      case "activity":
        renderActivity(container);
        break;
      case "settings":
        renderSettings(container, ctx);
        break;
      default:
        renderDashboard(container, ctx);
    }
  }
}

export const application = new Application();
