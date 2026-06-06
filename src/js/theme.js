import { themeManager } from "./core/ThemeManager.js";

export const initTheme = () => themeManager.init();

export const getTheme = () => themeManager.getTheme();

export const getThemeLabel = (theme) => themeManager.getLabel(theme);

export const toggleTheme = () => themeManager.toggle();

export const setTheme = (theme) => themeManager.setTheme(theme);
