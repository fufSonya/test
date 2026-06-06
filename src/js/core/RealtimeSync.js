import supabase from "../api/supabase.js";
import { DataFormatter } from "./DataFormatter.js";

export class RealtimeSync {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.channel = null;
  }

  start() {
    if (this.channel) return;

    this.channel = supabase
      .channel("taskflow-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        (payload) => this.#onProjectChange(payload),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => this.#onTaskChange(payload),
      )
      .subscribe();
  }

  stop() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }

  #onProjectChange(payload) {
    const state = this.stateManager.getState();
    let projects = [...state.projects];

    if (payload.eventType === "INSERT" && payload.new) {
      const formatted = DataFormatter.formatProject(payload.new);
      if (!projects.some((p) => p.id === formatted.id)) {
        projects.push(formatted);
      }
    } else if (payload.eventType === "UPDATE" && payload.new) {
      const formatted = DataFormatter.formatProject(payload.new);
      projects = projects.map((p) => (p.id === formatted.id ? formatted : p));
    } else if (payload.eventType === "DELETE" && payload.old) {
      projects = projects.filter((p) => p.id !== String(payload.old.id));
    }

    this.stateManager.setState({ projects });
  }

  #onTaskChange(payload) {
    const state = this.stateManager.getState();
    let tasks = [...state.tasks];

    if (payload.eventType === "INSERT" && payload.new) {
      const formatted = DataFormatter.formatTask(payload.new);
      if (!tasks.some((t) => t.id === formatted.id)) {
        tasks.push(formatted);
      }
    } else if (payload.eventType === "UPDATE" && payload.new) {
      const formatted = DataFormatter.formatTask(payload.new);
      tasks = tasks.map((t) => (t.id === formatted.id ? formatted : t));
    } else if (payload.eventType === "DELETE" && payload.old) {
      tasks = tasks.filter((t) => t.id !== String(payload.old.id));
    }

    this.stateManager.setState({ tasks });
  }
}
