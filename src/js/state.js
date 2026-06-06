import { stateManager } from "./core/StateManager.js";
import { DataFormatter } from "./core/DataFormatter.js";

export const appState = stateManager.getState();

export const subscribe = (listener) => stateManager.subscribe(listener);

export const setState = (partial) => stateManager.setState(partial);

export const formatProject = DataFormatter.formatProject;

export const formatTask = DataFormatter.formatTask;
