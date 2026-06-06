const DEFAULT_ACTIVITIES = [
  {
    id: "1",
    type: "task_completed",
    user: "Анна Соколова",
    userInitials: "АС",
    description: "завершила задачу 'Дизайн главной страницы'",
    timestamp: new Date(2026, 4, 13, 15, 30).toISOString(),
    projectName: "Веб-приложение",
    taskName: "Дизайн главной страницы",
  },
  {
    id: "2",
    type: "comment",
    user: "Иван Петров",
    userInitials: "ИП",
    description: "оставил комментарий в задаче 'API интеграция'",
    timestamp: new Date(2026, 4, 13, 14, 15).toISOString(),
    projectName: "Веб-приложение",
    taskName: "API интеграция",
  },
  {
    id: "3",
    type: "status_changed",
    user: "Мария Иванова",
    userInitials: "МИ",
    description: "изменила статус задачи 'Тестирование форм' на 'На проверке'",
    timestamp: new Date(2026, 4, 13, 11, 45).toISOString(),
    projectName: "Мобильное приложение",
    taskName: "Тестирование форм",
  },
  {
    id: "4",
    type: "task_created",
    user: "Дмитрий Козлов",
    userInitials: "ДК",
    description: "создал новую задачу 'Оптимизация базы данных'",
    timestamp: new Date(2026, 4, 13, 9, 20).toISOString(),
    projectName: "Веб-приложение",
    taskName: "Оптимизация базы данных",
  },
  {
    id: "5",
    type: "member_added",
    user: "Анна Соколова",
    userInitials: "АС",
    description: "добавила Елену Смирнову в команду проекта",
    timestamp: new Date(2026, 4, 12, 16, 30).toISOString(),
    projectName: "Дизайн система",
  },
  {
    id: "6",
    type: "task_updated",
    user: "Иван Петров",
    userInitials: "ИП",
    description: "обновил дедлайн задачи 'API интеграция'",
    timestamp: new Date(2026, 4, 12, 14, 50).toISOString(),
    projectName: "Веб-приложение",
    taskName: "API интеграция",
  },
  {
    id: "7",
    type: "project_created",
    user: "Анна Соколова",
    userInitials: "АС",
    description: "создала новый проект 'Дизайн система'",
    timestamp: new Date(2026, 4, 11, 15, 0).toISOString(),
    projectName: "Дизайн система",
  },
];

export function loadActivities() {
  const saved = localStorage.getItem("activities");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((a) => ({
          ...a,
          timestamp: new Date(a.timestamp),
        }));
      }
    } catch {
      /* defaults */
    }
  }
  return DEFAULT_ACTIVITIES.map((a) => ({ ...a, timestamp: new Date(a.timestamp) }));
}

export function saveActivities(activities) {
  localStorage.setItem("activities", JSON.stringify(activities));
}

export function addActivity(activity) {
  const activities = loadActivities();
  const newActivity = { ...activity, id: Date.now().toString(), timestamp: new Date() };
  const updated = [newActivity, ...activities];
  saveActivities(updated);
  return updated;
}

export const ACTIVITY_TYPE_LABELS = {
  task_created: "Создание задач",
  task_completed: "Завершение задач",
  task_deleted: "Удаление задач",
  comment: "Комментарии",
  status_changed: "Изменение статуса",
  task_updated: "Обновление задач",
  member_added: "Добавление участников",
  project_created: "Создание проектов",
};

export const ACTIVITY_TYPE_FILTER_OPTIONS = [
  { value: "all", label: "Все типы событий" },
  { value: "task_created", label: "Создание задач" },
  { value: "task_completed", label: "Завершение задач" },
  { value: "comment", label: "Комментарии" },
  { value: "status_changed", label: "Изменение статуса" },
  { value: "task_updated", label: "Обновление задач" },
  { value: "member_added", label: "Добавление участников" },
  { value: "project_created", label: "Создание проектов" },
];
