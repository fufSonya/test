import { escapeHtml } from "../utils.js";
import { bem, cx } from "../bem.js";
import { openModal } from "../modal.js";
import { showToast } from "../toast.js";
import {
  ALL_PERMISSIONS,
  PERMISSION_CATEGORIES,
  getCategoryName,
  getPermissionsByCategory,
  canManageRoles,
} from "../permissions.js";
import { icon } from "../icons.js";
import { COLOR_OPTIONS, roleColorStyle } from "../role-colors.js";
import {
  btn,
  badge,
  card,
  cardHeader,
  cardTitle,
  cardDescription,
  cardContent,
  input,
  label,
  formGroup,
  separator,
  switchBtn,
} from "../ui.js";

function getDefaultRoles() {
  return [
    { id: "0", name: "Владелец", description: "Полный доступ и владение системой", color: "bg-yellow-600", permissions: ALL_PERMISSIONS.map((p) => p.id), usersCount: 0, isSystem: true },
    { id: "1", name: "Администратор", description: "Полный доступ ко всем функциям системы", color: "bg-purple-600", permissions: ALL_PERMISSIONS.map((p) => p.id), usersCount: 1, isSystem: true },
    { id: "2", name: "Разработчик", description: "Доступ к проектам и задачам", color: "bg-green-600", permissions: ["projects.view", "projects.edit", "tasks.create", "tasks.edit.own", "tasks.assign", "team.view"], usersCount: 2, isSystem: true },
    { id: "3", name: "Дизайнер", description: "Доступ к задачам и просмотру проектов", color: "bg-pink-600", permissions: ["projects.view", "tasks.create", "tasks.edit.own", "team.view"], usersCount: 2, isSystem: true },
    { id: "4", name: "Участник", description: "Базовый доступ к системе", color: "bg-blue-600", permissions: ["projects.view", "tasks.edit.own", "team.view"], usersCount: 1, isSystem: true },
  ];
}

const ROLES_LAYOUT_VERSION = 2;

function isValidRole(role) {
  return (
    role &&
    typeof role.name === "string" &&
    typeof role.description === "string" &&
    typeof role.color === "string" &&
    Array.isArray(role.permissions) &&
    typeof role.usersCount === "number" &&
    typeof role.isSystem === "boolean"
  );
}

function loadRoles() {
  const layoutVersion = localStorage.getItem("rolesLayoutVersion");
  const saved = localStorage.getItem("customRoles");

  if (layoutVersion !== String(ROLES_LAYOUT_VERSION)) {
    localStorage.setItem("rolesLayoutVersion", String(ROLES_LAYOUT_VERSION));
    const defaults = getDefaultRoles();
    saveRoles(defaults);
    return defaults;
  }

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(isValidRole)) {
        return parsed;
      }
    } catch {
      /* defaults */
    }
  }

  const defaults = getDefaultRoles();
  saveRoles(defaults);
  return defaults;
}

function saveRoles(roles) {
  localStorage.setItem("customRoles", JSON.stringify(roles));
}

function colorPickerHtml(selectedColor, prefix) {
  return `
    <div class="grid gap-2">
      <label>Цвет роли</label>
      <div class="flex gap-2 flex-wrap" id="${prefix}-colors">
        ${COLOR_OPTIONS.map(
          (c) => `
          <button type="button" data-color="${c.value}" title="${c.label}"
            style="${roleColorStyle(c.value)}"
            class="h-8 w-8 rounded-full border border-black/10 ${selectedColor === c.value ? "ring-2 ring-offset-2 ring-primary" : ""}"></button>`,
        ).join("")}
      </div>
    </div>`;
}

function permissionsByCategoryHtml(selectedPerms, prefix) {
  return `
    <div class="space-y-4">
      <label class="text-sm font-medium">Права доступа</label>
      ${PERMISSION_CATEGORIES.map((category) => {
        const perms = getPermissionsByCategory(category);
        return card(`
          ${cardHeader(cardTitle(getCategoryName(category), "text-base"))}
          ${cardContent(
            perms
              .map(
                (p) => `
              <div class="flex items-center justify-between gap-4">
                <div class="space-y-0.5">
                  <label class="text-sm font-medium">${escapeHtml(p.name)}</label>
                  <p class="text-sm text-muted-foreground">${escapeHtml(p.description)}</p>
                </div>
                ${switchBtn(selectedPerms.includes(p.id), `${prefix}-${p.id}`)}
              </div>`,
              )
              .join(""),
            "space-y-3",
          )}
        `);
      }).join("")}
    </div>`;
}

function readPermissionsFromModal(overlay, prefix) {
  return ALL_PERMISSIONS.filter((p) => {
    const sw = overlay.querySelector(`#${prefix}-${p.id}`);
    return sw?.getAttribute("aria-checked") === "true";
  }).map((p) => p.id);
}

function bindColorPicker(overlay, prefix, onSelect) {
  let selected = overlay.dataset.selectedColor || "bg-gray-600";
  overlay.querySelectorAll(`#${prefix}-colors [data-color]`).forEach((btnEl) => {
    btnEl.addEventListener("click", () => {
      selected = btnEl.dataset.color;
      overlay.dataset.selectedColor = selected;
      overlay.querySelectorAll(`#${prefix}-colors [data-color]`).forEach((b) => {
        b.classList.toggle("ring-2", b.dataset.color === selected);
        b.classList.toggle("ring-offset-2", b.dataset.color === selected);
        b.classList.toggle("ring-primary", b.dataset.color === selected);
      });
      onSelect(selected);
    });
  });
}

function bindPermissionSwitches(overlay) {
  overlay.querySelectorAll('[role="switch"]').forEach((sw) => {
    sw.addEventListener("click", () => {
      const checked = sw.getAttribute("aria-checked") === "true";
      const next = !checked;
      sw.setAttribute("aria-checked", next ? "true" : "false");
      sw.classList.toggle("bg-primary", next);
      sw.classList.toggle("bg-switch-background", !next);
      sw.querySelector("span")?.classList.toggle("translate-x-[calc(100%-2px)]", next);
    });
  });
}

export function renderRoles(container, { userProfile }) {
  let roles = loadRoles();
  const canManage = canManageRoles(userProfile.email);

  function openCreateModal() {
    const { overlay, close } = openModal({
      title: "Создать новую роль",
      description: "Настройте название, описание и права для новой роли",
      wide: true,
      bodyHtml: `
        <div class="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          ${formGroup(label("Название роли"), input('id="role-name" placeholder="Например: Менеджер проектов"'))}
          ${formGroup(label("Описание"), input('id="role-desc" placeholder="Краткое описание роли"'))}
          ${colorPickerHtml("bg-gray-600", "new")}
          ${separator()}
          ${permissionsByCategoryHtml([], "new")}
        </div>
      `,
      footerHtml: `
        ${btn("Отмена", { variant: "outline", attrs: "data-modal-close" })}
        ${btn("Создать роль", { attrs: 'id="create-role"' })}
      `,
    });

    overlay.dataset.selectedColor = "bg-gray-600";
    bindColorPicker(overlay, "new", (c) => {
      overlay.dataset.selectedColor = c;
    });
    bindPermissionSwitches(overlay);

    overlay.querySelector("#create-role").addEventListener("click", () => {
      const name = overlay.querySelector("#role-name").value.trim();
      if (!name) return;
      roles.push({
        id: Date.now().toString(),
        name,
        description: overlay.querySelector("#role-desc").value.trim(),
        color: overlay.dataset.selectedColor || "bg-gray-600",
        permissions: readPermissionsFromModal(overlay, "new"),
        usersCount: 0,
        isSystem: false,
      });
      saveRoles(roles);
      close();
      showToast(`Роль "${name}" создана`);
      render();
    });
  }

  function openEditModal(role) {
    const { overlay, close } = openModal({
      title: "Редактировать роль",
      description: "Измените название, описание и права для роли",
      wide: true,
      bodyHtml: `
        <div class="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          ${formGroup(label("Название роли"), input(`id="edit-role-name" value="${escapeHtml(role.name)}" placeholder="Например: Менеджер проектов" ${role.isSystem ? "readonly" : ""}`))}
          ${formGroup(label("Описание"), input(`id="edit-role-desc" value="${escapeHtml(role.description)}" placeholder="Краткое описание роли"`))}
          ${colorPickerHtml(role.color, "edit")}
          ${separator()}
          ${permissionsByCategoryHtml(role.permissions, "edit")}
        </div>
      `,
      footerHtml: `
        ${btn("Отмена", { variant: "outline", attrs: "data-modal-close" })}
        ${btn("Сохранить изменения", { attrs: 'id="save-role"' })}
      `,
    });

    overlay.dataset.selectedColor = role.color;
    bindColorPicker(overlay, "edit", (c) => {
      overlay.dataset.selectedColor = c;
    });
    bindPermissionSwitches(overlay);

    overlay.querySelector("#save-role").addEventListener("click", () => {
      const updated = {
        ...role,
        name: role.isSystem ? role.name : overlay.querySelector("#edit-role-name").value.trim(),
        description: overlay.querySelector("#edit-role-desc").value.trim(),
        color: overlay.dataset.selectedColor || role.color,
        permissions: readPermissionsFromModal(overlay, "edit"),
      };
      roles = roles.map((r) => (r.id === role.id ? updated : r));
      saveRoles(roles);
      close();
      showToast(`Роль "${updated.name}" обновлена`);
      render();
    });
  }

  function deleteRole(roleId) {
    const role = roles.find((r) => r.id === roleId);
    if (role?.isSystem) {
      showToast("Невозможно удалить системную роль", "error");
      return;
    }
    if ((role?.usersCount ?? 0) > 0) {
      showToast("Невозможно удалить роль с назначенными пользователями", "error");
      return;
    }
    roles = roles.filter((r) => r.id !== roleId);
    saveRoles(roles);
    showToast(`Роль "${role?.name}" удалена`);
    render();
  }

  function renderRoleCard(role) {
    const permBadges = role.permissions
      .map((permId) => {
        const perm = ALL_PERMISSIONS.find((p) => p.id === permId);
        return perm ? badge(escapeHtml(perm.name), { variant: "secondary", className: "text-xs" }) : "";
      })
      .join("");

    return card(`
      ${cardHeader(`
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="${cx(bem("role-card", "icon"), "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0")}" style="${roleColorStyle(role.color)}">
              ${icon("shield", "h-5 w-5 text-white")}
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                ${cardTitle(escapeHtml(role.name))}
                ${role.isSystem ? badge("Системная", { variant: "outline", className: "text-xs" }) : ""}
              </div>
              ${cardDescription(escapeHtml(role.description))}
            </div>
          </div>
          ${
            canManage
              ? `<div class="flex items-center gap-2 flex-shrink-0">
              ${btn(`${icon("edit", "h-4 w-4 mr-2")}Редактировать`, { variant: "outline", size: "sm", attrs: `data-edit="${role.id}"` })}
              ${
                !role.isSystem
                  ? btn(icon("trash2", "h-4 w-4"), {
                      variant: "outline",
                      size: "sm",
                      attrs: `data-delete="${role.id}" ${role.usersCount > 0 ? "disabled" : ""}`,
                    })
                  : ""
              }
            </div>`
              : ""
          }
        </div>
      `)}
      ${cardContent(`
        <div class="space-y-3">
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            ${icon("users", "h-4 w-4")}
            <span>${role.usersCount} пользователей</span>
          </div>
          ${separator()}
          <div>
            <p class="text-sm font-medium mb-2">Права доступа:</p>
            <div class="${bem("role-card", "permissions")} flex flex-wrap gap-2">${permBadges}</div>
          </div>
        </div>
      `)}
    `);
  }

  function render() {
    roles = loadRoles();

    container.innerHTML = `
      <div class="${cx(bem("page"), "p-6 space-y-6")}">
        <div class="${bem("page", "header")} flex items-center justify-between">
          <div>
            <h1 class="${bem("page", "title")}">Управление ролями</h1>
            <p class="${cx(bem("page", "description"), "text-muted-foreground")}">Создавайте и настраивайте роли с правами доступа</p>
          </div>
          ${canManage ? btn(`${icon("plus", "mr-2 h-4 w-4")}Создать роль`, { attrs: 'id="new-role-btn"' }) : ""}
        </div>

        <div class="grid gap-4">
          ${roles.map((role) => renderRoleCard(role)).join("")}
        </div>
      </div>
    `;

    container.querySelector("#new-role-btn")?.addEventListener("click", openCreateModal);
    container.querySelectorAll("[data-edit]").forEach((btnEl) => {
      btnEl.addEventListener("click", () => {
        const role = roles.find((r) => r.id === btnEl.dataset.edit);
        if (role) openEditModal({ ...role });
      });
    });
    container.querySelectorAll("[data-delete]").forEach((btnEl) => {
      btnEl.addEventListener("click", () => deleteRole(btnEl.dataset.delete));
    });
  }

  render();
}
