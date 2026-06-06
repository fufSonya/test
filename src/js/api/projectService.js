import { BaseApiService } from "./BaseApiService.js";

class ProjectService extends BaseApiService {
  constructor() {
    super("projects");
  }

  async getProjects() {
    return this.getAll();
  }

  async createProject(project) {
    return this.create(project);
  }

  async updateProject(id, updates) {
    return this.update(id, updates);
  }

  async deleteProject(id) {
    return this.remove(id);
  }
}

export default new ProjectService();
