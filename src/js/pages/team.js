import { escapeHtml, getInitials } from "../utils.js";
import { openModal } from "../modal.js";
import { showToast } from "../toast.js";
import { ALL_PERMISSIONS, getDefaultPermissions } from "../permissions.js";
import { loadTeamMembers, saveTeamMembers, getRoleLabel } from "../team-data.js";
import { icon } from "../icons.js";
import { btn, badge, card, cardContent, input, label, formGroup, select, avatar } from "../ui.js";

export function renderTeam(container, { userProfile }) {
  let members = loadTeamMembers();
  let searchQuery = "";

  function filteredMembers() {
    if (!searchQuery) return members;
    const q = searchQuery.toLowerCase();
    return members.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  }

  function openAddModal() {
    const { overlay, close } = openModal({
      title: "Добавить участника",
      description: "Пригласите нового члена команды",
      bodyHtml: `
        ${formGroup(label("Имя"), input('id="member-name"'))}
        ${formGroup(label("Email"), input('id="member-email" type="email"'))}
        ${formGroup(label("Роль"), select('<option value="member">Участник</option><option value="developer">Разработчик</option><option value="designer">Дизайнер</option><option value="admin">Администратор</option>', 'id="member-role"'))}
      `,
      footerHtml: `${btn("Отмена", { variant: "outline", attrs: "data-modal-close" })} ${btn("Добавить", { attrs: 'id="add-member"' })}`,
    });

    overlay.querySelector("#add-member").addEventListener("click", () => {
      const name = overlay.querySelector("#member-name").value.trim();
      const email = overlay.querySelector("#member-email").value.trim();
      const role = overlay.querySelector("#member-role").value;
      if (!name || !email) return;
      members.push({
        id: Date.now().toString(),
        name,
        email,
        role,
        status: "offline",
        lastSeen: "Только что добавлен",
        initials: getInitials(name),
        permissions: getDefaultPermissions(role),
      });
      saveTeamMembers(members);
      close();
      showToast(`${name} добавлен в команду`);
      render();
    });
  }

  function openPermissionsModal(member) {
    const permHtml = ALL_PERMISSIONS.map(
      (p) => `
      <label class="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer">
        <input type="checkbox" data-perm="${p.id}" ${member.permissions.includes(p.id) ? "checked" : ""} class="rounded border-input" />
        <span class="text-sm">${escapeHtml(p.name)}</span>
      </label>`,
    ).join("");

    const { overlay, close } = openModal({
      title: `Права: ${member.name}`,
      description: getRoleLabel(member.role),
      wide: true,
      bodyHtml: `
        ${formGroup(label("Роль"), select(
          `<option value="owner">Владелец</option><option value="admin">Администратор</option><option value="developer">Разработчик</option><option value="designer">Дизайнер</option><option value="member">Участник</option>`.replace(
            `value="${member.role}"`,
            `value="${member.role}" selected`,
          ),
          'id="perm-role"',
        ))}
        <div class="max-h-64 overflow-y-auto space-y-1 mt-2">${permHtml}</div>
      `,
      footerHtml: `${btn("Отмена", { variant: "outline", attrs: "data-modal-close" })} ${btn("Сохранить", { attrs: 'id="save-perms"' })}`,
    });

    overlay.querySelector("#perm-role").addEventListener("change", (e) => {
      const role = e.target.value;
      const defaults = getDefaultPermissions(role);
      overlay.querySelectorAll("[data-perm]").forEach((cb) => {
        cb.checked = defaults.includes(cb.dataset.perm);
      });
    });

    overlay.querySelector("#save-perms").addEventListener("click", () => {
      const role = overlay.querySelector("#perm-role").value;
      const permissions = [...overlay.querySelectorAll("[data-perm]:checked")].map((cb) => cb.dataset.perm);
      members = members.map((m) => (m.id === member.id ? { ...m, role, permissions } : m));
      saveTeamMembers(members);
      close();
      showToast("Права обновлены");
      render();
    });
  }

  function statusDot(status) {
    const colors = { online: "bg-green-500", offline: "bg-gray-500", away: "bg-yellow-500" };
    return `<span class="inline-block h-2.5 w-2.5 rounded-full ${colors[status] || colors.offline}"></span>`;
  }

  function render() {
    const list = filteredMembers();

    container.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1>Команда</h1>
            <p class="text-muted-foreground">Управление участниками и правами доступа</p>
          </div>
          ${btn(`${icon("plus", "mr-2 h-4 w-4")}Добавить`, { attrs: 'id="add-member-btn"' })}
        </div>

        <div class="relative max-w-sm mb-6">
          ${icon("search", "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground")}
          ${input(`id="team-search" class="pl-9" type="search" placeholder="Поиск..." value="${escapeHtml(searchQuery)}"`)}
        </div>

        ${card(`
          ${cardContent(`
            <div class="divide-y p-0">
              ${
                list.length === 0
                  ? '<p class="text-center text-muted-foreground py-8">Участники не найдены</p>'
                  : list
                      .map(
                        (m) => `
                <div class="flex items-center gap-4 p-4">
                  ${avatar(escapeHtml(m.initials))}
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-medium">${escapeHtml(m.name)}</span>
                      ${m.email === userProfile.email ? badge("Вы", { variant: "default" }) : ""}
                    </div>
                    <p class="text-sm text-muted-foreground">${escapeHtml(m.email)}</p>
                    <div class="flex items-center gap-2 mt-1 text-sm">
                      ${statusDot(m.status)}
                      ${badge(getRoleLabel(m.role), { variant: "secondary" })}
                      <span class="text-muted-foreground text-xs">${escapeHtml(m.lastSeen)}</span>
                    </div>
                  </div>
                  <div class="flex gap-2">
                    ${btn("Права", { variant: "outline", size: "sm", attrs: `data-perms="${m.id}"` })}
                    ${m.email !== userProfile.email ? btn("Удалить", { variant: "destructive", size: "sm", attrs: `data-remove="${m.id}"` }) : ""}
                  </div>
                </div>`,
                      )
                      .join("")
              }
            </div>
          `, "p-0")}
        `)}
      </div>
    `;

    container.querySelector("#add-member-btn")?.addEventListener("click", openAddModal);
    container.querySelector("#team-search")?.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      render();
    });
    container.querySelectorAll("[data-perms]").forEach((btnEl) => {
      btnEl.addEventListener("click", () => {
        const member = members.find((m) => m.id === btnEl.dataset.perms);
        if (member) openPermissionsModal(member);
      });
    });
    container.querySelectorAll("[data-remove]").forEach((btnEl) => {
      btnEl.addEventListener("click", () => {
        members = members.filter((m) => m.id !== btnEl.dataset.remove);
        saveTeamMembers(members);
        showToast("Участник удалён");
        render();
      });
    });
  }

  render();
}
