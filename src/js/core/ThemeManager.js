export class ThemeManager {
  constructor(storageKey = "taskflow-theme") {
    this.storageKey = storageKey;
    this.mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    this._onSystemChange = () => {
      if (this.getTheme() === "system") {
        this.apply("system");
      }
    };
  }

  resolveDark(theme) {
    if (theme === "system") {
      return this.mediaQuery.matches;
    }
    return theme === "dark";
  }

  apply(theme) {
    document.documentElement.classList.toggle("dark", this.resolveDark(theme));
  }

  init() {
    const saved = this.getTheme();
    this.apply(saved);
    this.mediaQuery.addEventListener("change", this._onSystemChange);
    return saved;
  }

  getTheme() {
    return localStorage.getItem(this.storageKey) || "system";
  }

  getLabel(theme = this.getTheme()) {
    if (theme === "system") return "Зависит от настроек браузера";
    if (theme === "light") return "Светлая тема";
    return "Тёмная тема";
  }

  setTheme(theme) {
    localStorage.setItem(this.storageKey, theme);
    this.apply(theme);
  }

  toggle() {
    const current = this.resolveDark(this.getTheme()) ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    this.setTheme(next);
    return next;
  }
}

export const themeManager = new ThemeManager();
