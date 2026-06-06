export class DataFormatter {
  static formatProject(raw) {
    return {
      id: String(raw.id),
      name: raw.name ?? "",
      description: raw.description ?? "",
      status: raw.status ?? "planning",
      members: raw.members ?? 1,
    };
  }

  static formatTask(raw) {
    return {
      id: String(raw.id),
      title: raw.title ?? "",
      description: raw.description ?? "",
      status: raw.status ?? "todo",
      priority: raw.priority ?? "medium",
      assignee: raw.assignee ?? "",
      deadline: raw.deadline ? new Date(raw.deadline) : new Date(),
      createdAt: raw.created_at ? new Date(raw.created_at) : new Date(),
      participants: raw.participants ?? [],
      projectId: String(raw.project_id ?? raw.projectId ?? ""),
    };
  }
}
