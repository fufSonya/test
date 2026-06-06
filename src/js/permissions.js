export const ALL_PERMISSIONS = [
  { id: "projects.create", name: "Создание проектов", description: "Создавать новые проекты", category: "projects" },
  { id: "projects.edit", name: "Редактирование проектов", description: "Изменять существующие проекты", category: "projects" },
  { id: "projects.delete", name: "Удаление проектов", description: "Удалять проекты", category: "projects" },
  { id: "projects.view", name: "Просмотр проектов", description: "Просматривать все проекты", category: "projects" },
  { id: "tasks.create", name: "Создание задач", description: "Создавать новые задачи", category: "tasks" },
  { id: "tasks.edit", name: "Редактирование задач", description: "Изменять любые задачи", category: "tasks" },
  { id: "tasks.edit.own", name: "Редактирование своих задач", description: "Изменять задачи, в которых участвует", category: "tasks" },
  { id: "tasks.delete", name: "Удаление задач", description: "Удалять задачи", category: "tasks" },
  { id: "tasks.assign", name: "Назначение задач", description: "Назначать задачи другим участникам", category: "tasks" },
  { id: "team.view", name: "Просмотр команды", description: "Видеть всех участников", category: "team" },
  { id: "team.add", name: "Добавление участников", description: "Добавлять новых участников в команду", category: "team" },
  { id: "team.edit", name: "Редактирование участников", description: "Изменять роли и права участников", category: "team" },
  { id: "team.remove", name: "Удаление участников", description: "Удалять участников из команды", category: "team" },
  { id: "settings.view", name: "Просмотр настроек", description: "Просматривать настройки системы", category: "settings" },
  { id: "settings.edit", name: "Изменение настроек", description: "Изменять настройки системы", category: "settings" },
];

export const PERMISSION_CATEGORIES = ["projects", "tasks", "team", "settings"];

export function getCategoryName(category) {
  const names = { projects: "Проекты", tasks: "Задачи", team: "Команда", settings: "Настройки" };
  return names[category] || category;
}

export function getPermissionsByCategory(category) {
  return ALL_PERMISSIONS.filter((p) => p.category === category);
}

export function getDefaultPermissions(role) {
  const all = ALL_PERMISSIONS.map((p) => p.id);
  switch (role) {
    case "owner":
    case "admin":
      return all;
    case "developer":
      return [
        "projects.view",
        "projects.edit",
        "tasks.create",
        "tasks.edit.own",
        "tasks.assign",
        "team.view",
      ];
    case "designer":
      return ["projects.view", "tasks.create", "tasks.edit.own", "team.view"];
    case "member":
    default:
      return ["projects.view", "tasks.edit.own", "team.view"];
  }
}

export function getCurrentUserRole(email) {
  const saved = localStorage.getItem("teamMembers");
  if (!saved) return null;
  try {
    const members = JSON.parse(saved);
    const user = members.find((m) => m.email === email);
    return user?.role || null;
  } catch {
    return null;
  }
}

export function canManageProjects(email) {
  const role = getCurrentUserRole(email);
  return role === "owner" || role === "admin";
}

export function canManageRoles(email) {
  const role = getCurrentUserRole(email);
  return role === "owner" || role === "admin";
}
