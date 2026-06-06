import { getDefaultPermissions } from "./permissions.js";
import { getInitials } from "./utils.js";

export function getDefaultMembers() {
  return [
    {
      id: "default-1",
      name: "Анна Соколова",
      email: "anna@taskflow.ru",
      role: "owner",
      status: "online",
      lastSeen: "В сети",
      initials: "АС",
      permissions: getDefaultPermissions("owner"),
    },
    {
      id: "default-2",
      name: "Иван Петров",
      email: "ivan@taskflow.ru",
      role: "admin",
      status: "online",
      lastSeen: "В сети",
      initials: "ИП",
      permissions: getDefaultPermissions("admin"),
    },
    {
      id: "default-3",
      name: "Мария Иванова",
      email: "maria@taskflow.ru",
      role: "designer",
      status: "away",
      lastSeen: "30 мин. назад",
      initials: "МИ",
      permissions: getDefaultPermissions("designer"),
    },
    {
      id: "default-4",
      name: "Дмитрий Козлов",
      email: "dmitry@taskflow.ru",
      role: "developer",
      status: "offline",
      lastSeen: "2 часа назад",
      initials: "ДК",
      permissions: getDefaultPermissions("developer"),
    },
    {
      id: "default-5",
      name: "Елена Смирнова",
      email: "elena@taskflow.ru",
      role: "member",
      status: "online",
      lastSeen: "В сети",
      initials: "ЕС",
      permissions: getDefaultPermissions("member"),
    },
  ];
}

export function loadTeamMembers() {
  const saved = localStorage.getItem("teamMembers");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) return parsed;
    } catch {
      /* use defaults */
    }
  }
  return getDefaultMembers();
}

export function saveTeamMembers(members) {
  localStorage.setItem("teamMembers", JSON.stringify(members));
}

export function ensureCurrentUserInTeam(userProfile) {
  if (!userProfile.email || !userProfile.name) return loadTeamMembers();

  let members = loadTeamMembers();
  const exists = members.some((m) => m.email === userProfile.email);
  if (!exists) {
    const role = userProfile.email === "sofia.derevenetz@gmail.com" ? "owner" : "member";
    const currentUser = {
      id: `user-${Date.now()}`,
      name: userProfile.name,
      email: userProfile.email,
      role,
      status: "online",
      lastSeen: "В сети",
      initials: getInitials(userProfile.name),
      permissions: getDefaultPermissions(role),
    };
    members = [currentUser, ...members];
    saveTeamMembers(members);
  }
  return members;
}

export function getRoleLabel(role) {
  const labels = {
    owner: "Владелец",
    admin: "Администратор",
    developer: "Разработчик",
    designer: "Дизайнер",
    member: "Участник",
  };
  return labels[role] || role;
}
