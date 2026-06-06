import { BaseApiService } from "./BaseApiService.js";

class TaskService extends BaseApiService {
  constructor() {
    super("tasks");
  }

  async getTasks() {
    return this.getAll();
  }

  async createTask(task) {
    return this.create(task);
  }

  async updateTask(id, status) {
    return this.update(id, { status });
  }

  async deleteTask(id) {
    return this.remove(id);
  }
}

export default new TaskService();
