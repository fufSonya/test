import { escapeHtml } from "../utils.js";
import { icon } from "../icons.js";
import { bem, cx } from "../bem.js";
import {
  card,
  cardHeader,
  cardTitle,
  cardDescription,
  cardContent,
  cardFooter,
  btn,
  input,
  label,
  formGroup,
  alert,
  tabsList,
  tabTrigger,
} from "../ui.js";

export function renderLogin(container, { onLogin }) {
  let activeTab = "login";

  function render() {
    container.innerHTML = `
      <div class="${cx(bem("login"), "min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4")}">
        <div class="${cx(bem("login", "container"), "w-full max-w-md")}">
          <div class="${cx(bem("login", "brand"), "flex flex-col items-center mb-8")}">
            <div class="flex items-center gap-2 mb-2">
              ${icon("folderKanban", "h-10 w-10")}
              <h1 class="text-4xl font-bold">TaskFlow</h1>
            </div>
            <p class="text-muted-foreground">Управление проектами для малых команд</p>
          </div>

          ${tabsList(
            tabTrigger("Вход", activeTab === "login", "login") +
              tabTrigger("Регистрация", activeTab === "register", "register"),
          )}

          <div class="mt-2">
            ${
              activeTab === "login"
                ? card(`
              ${cardHeader(`${cardTitle("Вход в систему")}${cardDescription("Введите свои данные для входа в аккаунт")}`)}
              <form id="login-form">
                ${cardContent(`
                  <div id="login-error" class="mb-4"></div>
                  ${formGroup(label("Email", "login-email"), input('id="login-email" type="email" placeholder="your@email.com" required'))}
                  ${formGroup(label("Пароль", "login-password"), input('id="login-password" type="password" placeholder="••••••••" required'))}
                `, "space-y-4")}
                ${cardFooter(`
                  ${btn("Войти", { className: "w-full", type: "submit" })}
                  ${btn("Забыли пароль?", { variant: "link", className: "text-sm text-muted-foreground w-full" })}
                `, "flex flex-col gap-2")}
              </form>
            `)
                : card(`
              ${cardHeader(`${cardTitle("Создать аккаунт")}${cardDescription("Заполните форму для регистрации нового аккаунта")}`)}
              <form id="register-form">
                ${cardContent(`
                  <div id="register-error" class="mb-4"></div>
                  ${formGroup(label("Имя", "register-name"), input('id="register-name" type="text" placeholder="Иван Иванов" required'))}
                  ${formGroup(label("Email", "register-email"), input('id="register-email" type="email" placeholder="your@email.com" required'))}
                  ${formGroup(label("Пароль", "register-password"), input('id="register-password" type="password" placeholder="••••••••" required'))}
                  ${formGroup(label("Подтвердите пароль", "register-confirm"), input('id="register-confirm" type="password" placeholder="••••••••" required'))}
                `, "space-y-4")}
                ${cardFooter(btn("Зарегистрироваться", { className: "w-full", type: "submit" }))}
              </form>
            `)}
          </div>

          <p class="text-center text-sm text-muted-foreground mt-4">
            Продолжая, вы соглашаетесь с условиями использования
          </p>
        </div>
      </div>
    `;

    container.querySelectorAll("[data-tab]").forEach((btnEl) => {
      btnEl.addEventListener("click", () => {
        activeTab = btnEl.dataset.tab;
        render();
      });
    });

    container.querySelector("#login-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = container.querySelector("#login-email").value.trim();
      const password = container.querySelector("#login-password").value;
      const errorEl = container.querySelector("#login-error");
      errorEl.innerHTML = "";

      const registeredUsers = localStorage.getItem("registeredUsers");
      if (!registeredUsers) {
        errorEl.innerHTML = alert(`${icon("alertCircle")}<div>Пользователь не найден. Пожалуйста, зарегистрируйтесь.</div>`);
        return;
      }

      const users = JSON.parse(registeredUsers);
      const user = users.find((u) => u.email === email && u.password === password);
      if (user) {
        onLogin(user.name, user.email);
        return;
      }

      const emailExists = users.find((u) => u.email === email);
      errorEl.innerHTML = alert(
        `${icon("alertCircle")}<div>${escapeHtml(emailExists ? "Неверный пароль" : "Пользователь не найден. Пожалуйста, зарегистрируйтесь.")}</div>`,
      );
    });

    container.querySelector("#register-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = container.querySelector("#register-name").value.trim();
      const email = container.querySelector("#register-email").value.trim();
      const password = container.querySelector("#register-password").value;
      const confirm = container.querySelector("#register-confirm").value;
      const errorEl = container.querySelector("#register-error");
      errorEl.innerHTML = "";

      if (!name || !email || !password || !confirm) {
        errorEl.innerHTML = alert(`${icon("alertCircle")}<div>Пожалуйста, заполните все поля</div>`);
        return;
      }
      if (password !== confirm) {
        errorEl.innerHTML = alert(`${icon("alertCircle")}<div>Пароли не совпадают</div>`);
        return;
      }

      const users = JSON.parse(localStorage.getItem("registeredUsers") || "[]");
      if (users.find((u) => u.email === email)) {
        errorEl.innerHTML = alert(`${icon("alertCircle")}<div>Пользователь с таким email уже зарегистрирован</div>`);
        return;
      }

      users.push({ name, email, password });
      localStorage.setItem("registeredUsers", JSON.stringify(users));
      onLogin(name, email);
    });
  }

  render();
}
