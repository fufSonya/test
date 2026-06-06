import { icon } from "./icons.js";
import { bem, cx } from "./bem.js";

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] shrink-0";

const BTN_VARIANTS = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  destructive:
    "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
  outline:
    "border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
  link: "text-primary underline-offset-4 hover:underline",
};

const BTN_SIZES = {
  default: "h-9 px-4 py-2",
  sm: "h-8 rounded-md gap-1.5 px-3",
  lg: "h-10 rounded-md px-6",
  icon: "size-9",
};

const BADGE_VARIANTS = {
  default: "border-transparent bg-primary text-primary-foreground",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  destructive: "border-transparent bg-destructive text-white dark:bg-destructive/60",
  outline: "text-foreground",
};

const BADGE_BASE =
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 transition-[color,box-shadow] overflow-hidden";

const INPUT_CLASS =
  "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

const TEXTAREA_CLASS =
  "placeholder:text-muted-foreground dark:bg-input/30 border-input flex min-h-16 w-full rounded-md border bg-input-background px-3 py-2 text-base transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

const SELECT_CLASS =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50 w-full rounded-md border bg-input-background px-3 py-2 text-sm transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 h-9 appearance-none cursor-pointer";

function btnModifiers(variant, size) {
  const mods = [];
  if (variant !== "default") mods.push(variant);
  if (size !== "default" && size !== "icon") mods.push(size);
  if (size === "icon") mods.push("icon");
  return mods;
}

export function btn(content, { variant = "default", size = "default", className = "", attrs = "", type = "button" } = {}) {
  return `<button type="${type}" class="${cx(bem("btn", null, btnModifiers(variant, size)), BTN_BASE, BTN_VARIANTS[variant], BTN_SIZES[size], className)}" ${attrs}>${content}</button>`;
}

export function badge(content, { variant = "default", className = "" } = {}) {
  const mods = variant !== "default" ? [variant] : [];
  return `<span class="${cx(bem("badge", null, mods), BADGE_BASE, BADGE_VARIANTS[variant], className)}">${content}</span>`;
}

export function card(content, className = "", modifiers = []) {
  return `<div class="${cx(bem("card", null, modifiers), "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border", className)}">${content}</div>`;
}

export function cardHeader(content, className = "") {
  return `<div class="${cx(bem("card", "header"), "grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 pt-6", className)}">${content}</div>`;
}

export function cardTitle(content, className = "") {
  return `<h4 class="${cx(bem("card", "title"), "leading-none", className)}">${content}</h4>`;
}

export function cardDescription(content, className = "") {
  return `<p class="${cx(bem("card", "description"), "text-muted-foreground", className)}">${content}</p>`;
}

export function cardContent(content, className = "") {
  return `<div class="${cx(bem("card", "content"), "px-6 [&:last-child]:pb-6", className)}">${content}</div>`;
}

export function cardFooter(content, className = "") {
  return `<div class="${cx(bem("card", "footer"), "flex items-center px-6 pb-6", className)}">${content}</div>`;
}

export function input(attrs = "", className = "") {
  return `<input class="${cx(bem("field", "input"), INPUT_CLASS, className)}" ${attrs} />`;
}

export function textarea(content = "", attrs = "", className = "") {
  return `<textarea class="${cx(bem("field", "textarea"), TEXTAREA_CLASS, className)}" ${attrs}>${content}</textarea>`;
}

export function select(optionsHtml, attrs = "", className = "") {
  return `<select class="${cx(bem("field", "select"), SELECT_CLASS, className)}" ${attrs}>${optionsHtml}</select>`;
}

export function selectField(optionsHtml, attrs = "", widthClass = "w-[200px]") {
  return `
    <div class="relative ${widthClass}">
      <select class="${cx(bem("field", "select"), SELECT_CLASS, widthClass, "w-full pr-9")}" ${attrs}>${optionsHtml}</select>
      <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-muted-foreground">
        ${icon("chevronDown", "h-4 w-4 opacity-50")}
      </span>
    </div>`;
}

export function filterBar(contentHtml) {
  return `<div class="flex gap-2 items-center flex-wrap">${contentHtml}</div>`;
}

export function label(text, forId = "", className = "") {
  return `<label class="${cx(bem("form", "label"), "flex items-center gap-2 text-sm leading-none font-medium select-none", className)}" ${forId ? `for="${forId}"` : ""}>${text}</label>`;
}

export function formGroup(labelHtml, fieldHtml, className = "") {
  return `<div class="${cx(bem("form", "group"), className || "grid gap-2")}">${labelHtml}${fieldHtml}</div>`;
}

export function alert(content, className = "") {
  return `<div role="alert" class="${cx(bem("alert"), "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start text-destructive bg-card [&>svg]:size-4 [&>svg]:translate-y-0.5", className)}">${content}</div>`;
}

export function tabsList(buttonsHtml, className = "grid w-full grid-cols-2") {
  return `<div class="${cx(bem("tabs", "list"), "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-xl p-[3px] flex", className)}" role="tablist">${buttonsHtml}</div>`;
}

export function tabTrigger(label, active = false, dataTab = "") {
  const activeClass = active
    ? "bg-card text-foreground border border-transparent shadow-sm dark:text-foreground dark:border-input dark:bg-input/30"
    : "text-foreground dark:text-muted-foreground";
  return `<button type="button" role="tab" data-tab="${dataTab}" class="${cx(bem("tabs", "trigger", active ? ["active"] : []), "inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-xl border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1", activeClass)}">${label}</button>`;
}

export function avatar(initials, className = "h-10 w-10") {
  return `<span class="${cx(bem("avatar"), "relative flex shrink-0 overflow-hidden rounded-full bg-muted items-center justify-center text-xs font-medium", className)}">${initials}</span>`;
}

export function separator(className = "") {
  return `<div class="${cx(bem("separator"), "bg-border shrink-0 h-px w-full", className)}"></div>`;
}

export function switchBtn(checked, id, disabled = false) {
  return `<button type="button" role="switch" id="${id}" aria-checked="${checked ? "true" : "false"}" ${disabled ? "disabled aria-disabled=\"true\"" : ""} class="${cx(bem("switch", null, checked ? ["on"] : ["off"]), "peer inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50", checked ? "bg-primary" : "bg-switch-background")}"><span class="bg-background pointer-events-none block size-4 rounded-full ring-0 transition-transform ${checked ? "translate-x-[calc(100%-2px)]" : "translate-x-0"}"></span></button>`;
}

export function pageHeader(title, description, actionHtml = "") {
  return `<div class="${bem("page", "header")} flex items-center justify-between mb-6">
    <div>
      <h1 class="${bem("page", "title")}">${title}</h1>
      <p class="${cx(bem("page", "description"), "text-muted-foreground")}">${description}</p>
    </div>
    ${actionHtml}
  </div>`;
}

export function themeToggleBtn(attrs = 'id="theme-toggle" title="Переключить тему"') {
  return btn(
    `${icon("sun", "h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0")}${icon("moon", "absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100")}<span class="sr-only">Переключить тему</span>`,
    { variant: "ghost", size: "icon", className: cx(bem("theme-toggle"), "relative"), attrs },
  );
}
