import { escapeHtml, getInitials } from "../utils.js";
import { bem, cx } from "../bem.js";
import { showToast } from "../toast.js";
import { getTheme, setTheme, getThemeLabel } from "../theme.js";
import { icon } from "../icons.js";
import {
  btn,
  card,
  cardHeader,
  cardTitle,
  cardDescription,
  cardContent,
  input,
  label,
  formGroup,
  select,
  avatar,
  separator,
  switchBtn,
} from "../ui.js";

function loadSettings() {
  return JSON.parse(
    localStorage.getItem("appSettings") ||
      JSON.stringify({
        language: "ru",
        compactMode: false,
        notifications: { enabled: true, deadlines: true, comments: true },
        taskSort: "date",
        showCompleted: true,
      }),
  );
}

function saveSettings(data) {
  localStorage.setItem("appSettings", JSON.stringify(data));
}

export function renderSettings(container, { userProfile, onProfileUpdate, onLogout }) {
  let userName = userProfile.name;
  let email = userProfile.email;
  let settings = loadSettings();

  function bindSwitch(btnEl, onChange) {
    if (!btnEl || btnEl.disabled) return;
    btnEl.addEventListener("click", () => {
      if (btnEl.disabled) return;
      const checked = btnEl.getAttribute("aria-checked") === "true";
      const next = !checked;
      btnEl.setAttribute("aria-checked", next ? "true" : "false");
      btnEl.classList.toggle("bg-primary", next);
      btnEl.classList.toggle("bg-switch-background", !next);
      const thumb = btnEl.querySelector("span");
      if (thumb) thumb.classList.toggle("translate-x-[calc(100%-2px)]", next);
      onChange(next);
    });
  }

  function settingRow(title, description, switchId, checked, disabled = false) {
    return `
      <div class="flex items-center justify-between ${disabled ? "opacity-50" : ""}">
        <div class="space-y-0.5">
          <label for="${switchId}" class="text-sm font-medium ${disabled ? "cursor-not-allowed" : ""}">${title}</label>
          <p class="text-sm text-muted-foreground">${description}</p>
        </div>
        ${switchBtn(checked, switchId, disabled)}
      </div>
    `;
  }

  function render() {
    const theme = getTheme();
    const notif = settings.notifications;

    container.innerHTML = `
      <div class="${cx(bem("page"), "p-6 max-w-4xl")}">
        <div class="${bem("page", "header")} mb-6">
          <h1 class="${bem("page", "title")}">Настройки</h1>
          <p class="${cx(bem("page", "description"), "text-muted-foreground")}">Управление параметрами приложения</p>
        </div>

        <div class="space-y-6">
          ${card(`
            ${cardHeader(`
              <div class="flex items-center gap-2">${icon("user", "h-5 w-5")}${cardTitle("Основные настройки")}</div>
              ${cardDescription("Управление профилем и учётной записью")}
            `)}
            ${cardContent(`
              <div class="flex items-center gap-4">
                ${avatar(escapeHtml(getInitials(userName) || "ВЫ"), "h-16 w-16 text-base")}
                ${btn("Изменить аватар", { variant: "outline", size: "sm" })}
              </div>
              ${separator()}
              ${formGroup(label("Имя пользователя", "user-name"), input(`id="user-name" value="${escapeHtml(userName)}"`))}
              ${formGroup(label("Email", "user-email"), input(`id="user-email" type="email" value="${escapeHtml(email)}"`))}
              <div class="flex justify-end">
                ${btn("Сохранить изменения", { attrs: 'id="save-profile"' })}
              </div>
              ${separator()}
              <div class="space-y-2">
                ${btn("Сменить пароль", { variant: "outline" })}
              </div>
              ${separator()}
              <div class="flex items-center justify-end">
                ${btn("Выйти из аккаунта", { variant: "destructive", size: "sm", attrs: 'id="logout-btn"' })}
              </div>
            `, "space-y-4")}
          `)}

          ${card(`
            ${cardHeader(`
              <div class="flex items-center gap-2">${icon("settings", "h-5 w-5")}${cardTitle("Настройки интерфейса")}</div>
              ${cardDescription("Персонализация внешнего вида")}
            `)}
            ${cardContent(`
              <div class="flex items-center justify-between">
                <div class="space-y-0.5">
                  <label class="text-sm font-medium">Тема оформления</label>
                  <p class="text-sm text-muted-foreground">${getThemeLabel(theme)}</p>
                </div>
                ${select(
                  `<option value="light" ${theme === "light" ? "selected" : ""}>Светлая</option>
                   <option value="dark" ${theme === "dark" ? "selected" : ""}>Тёмная</option>
                   <option value="system" ${theme === "system" ? "selected" : ""}>Системная</option>`,
                  'id="theme-select" class="w-[180px]"',
                )}
              </div>
              ${separator()}
              ${formGroup(
                label("Язык интерфейса", "language"),
                select(
                  `<option value="ru" ${settings.language === "ru" ? "selected" : ""}>Русский</option>
                   <option value="en" ${settings.language === "en" ? "selected" : ""}>English</option>`,
                  'id="language"',
                ),
              )}
              ${separator()}
              ${settingRow(
                "Компактный режим",
                "Уменьшенные отступы между элементами",
                "compact-mode",
                !!settings.compactMode,
              )}
            `, "space-y-4")}
          `)}

          ${card(`
            ${cardHeader(`
              <div class="flex items-center gap-2">${icon("bell", "h-5 w-5")}${cardTitle("Настройки уведомлений")}</div>
              ${cardDescription("Управление оповещениями")}
            `)}
            ${cardContent(`
              ${settingRow("Включить уведомления", "Получать уведомления о событиях", "notif-enabled", notif.enabled !== false)}
              ${separator()}
              ${settingRow(
                "Уведомления о дедлайнах",
                "Напоминания о приближающихся сроках",
                "notif-deadlines",
                notif.deadlines !== false,
                !notif.enabled,
              )}
              ${separator()}
              ${settingRow(
                "Уведомления о комментариях",
                "Новые комментарии к задачам",
                "notif-comments",
                notif.comments !== false,
                !notif.enabled,
              )}
            `, "space-y-4")}
          `)}

          ${card(`
            ${cardHeader(`
              ${cardTitle("Настройки задач")}
              ${cardDescription("Параметры отображения задач")}
            `)}
            ${cardContent(`
              ${formGroup(
                label("Сортировка задач по умолчанию", "task-sort"),
                select(
                  `<option value="date" ${settings.taskSort === "date" ? "selected" : ""}>Дате создания</option>
                   <option value="priority" ${settings.taskSort === "priority" ? "selected" : ""}>Приоритету</option>
                   <option value="status" ${settings.taskSort === "status" ? "selected" : ""}>Статусу</option>
                   <option value="deadline" ${settings.taskSort === "deadline" ? "selected" : ""}>Дедлайну</option>`,
                  'id="task-sort"',
                ),
              )}
              ${separator()}
              ${settingRow(
                "Показывать завершённые задачи",
                "Отображать выполненные задачи в списке",
                "show-completed",
                settings.showCompleted !== false,
              )}
            `, "space-y-4")}
          `)}
        </div>
      </div>
    `;

    container.querySelector("#save-profile")?.addEventListener("click", () => {
      userName = container.querySelector("#user-name").value.trim();
      email = container.querySelector("#user-email").value.trim();
      if (!userName || !email) {
        showToast("Заполните все обязательные поля", "error");
        return;
      }
      saveSettings(settings);
      onProfileUpdate(userName, email);
      showToast("Изменения сохранены");
    });

    container.querySelector("#theme-select")?.addEventListener("change", (e) => {
      setTheme(e.target.value);
      render();
    });

    container.querySelector("#language")?.addEventListener("change", (e) => {
      settings.language = e.target.value;
      saveSettings(settings);
    });

    container.querySelector("#task-sort")?.addEventListener("change", (e) => {
      settings.taskSort = e.target.value;
      saveSettings(settings);
    });

    bindSwitch(container.querySelector("#compact-mode"), (checked) => {
      settings.compactMode = checked;
      saveSettings(settings);
    });

    bindSwitch(container.querySelector("#notif-enabled"), (checked) => {
      settings.notifications.enabled = checked;
      saveSettings(settings);
      render();
    });

    bindSwitch(container.querySelector("#notif-deadlines"), (checked) => {
      settings.notifications.deadlines = checked;
      saveSettings(settings);
    });

    bindSwitch(container.querySelector("#notif-comments"), (checked) => {
      settings.notifications.comments = checked;
      saveSettings(settings);
    });

    bindSwitch(container.querySelector("#show-completed"), (checked) => {
      settings.showCompleted = checked;
      saveSettings(settings);
    });

    container.querySelector("#logout-btn")?.addEventListener("click", () => {
      userName = container.querySelector("#user-name").value.trim();
      email = container.querySelector("#user-email").value.trim();
      if (userName && email) {
        onProfileUpdate(userName, email);
        localStorage.setItem("userProfile", JSON.stringify({ name: userName, email }));
      }
      saveSettings(settings);
      onLogout();
    });
  }

  render();
}
