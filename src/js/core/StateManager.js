export class StateManager {
  constructor() {
    this.state = {
      isAuthenticated: false,
      currentPage: "dashboard",
      sidebarOpen: false,
      userProfile: { name: "", email: "" },
      projects: [],
      tasks: [],
    };
    this.listeners = new Set();
  }

  getState() {
    return this.state;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  setState(partial) {
    Object.assign(this.state, partial);
    this.listeners.forEach((fn) => fn(this.state));
  }
}

export const stateManager = new StateManager();
