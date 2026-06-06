import { escapeHtml } from "./utils.js";
import { icon } from "./icons.js";
import { bem, cx } from "./bem.js";

const WIDTH_PX = {
  "w-[180px]": 180,
  "w-[200px]": 200,
  "w-[220px]": 220,
  "w-[280px]": 280,
};

const SELECT_TRIGGER_CLASS = cx(
  bem("select", "trigger"),
  "border-input text-foreground dark:bg-input/30 dark:hover:bg-input/50",
  "flex w-full items-center justify-between gap-2 rounded-md border bg-input-background",
  "px-3 py-2 text-sm font-medium whitespace-nowrap transition-[color,box-shadow]",
  "outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  "disabled:cursor-not-allowed disabled:opacity-50 h-9 cursor-pointer",
);

const SELECT_ITEM_CLASS = cx(
  bem("select", "item"),
  "relative flex w-full cursor-default items-center rounded-sm py-1.5 pr-8 pl-2 text-sm",
  "outline-none select-none hover:bg-accent hover:text-accent-foreground",
  "focus:bg-accent focus:text-accent-foreground",
);

const SELECT_PANEL_CLASS = cx(
  bem("select", "content"),
  "hidden rounded-md border bg-popover text-popover-foreground shadow-md p-1",
  "max-h-[min(24rem,var(--select-panel-max-height,24rem))] overflow-y-auto",
  "animate-in fade-in-0 zoom-in-95",
);

let outsideListenerBound = false;

function closeAllSelectMenus() {
  document.querySelectorAll("[data-select-content]").forEach((panel) => {
    panel.classList.add("hidden");
    panel.style.position = "";
    panel.style.top = "";
    panel.style.left = "";
    panel.style.width = "";
    panel.style.zIndex = "";
  });
  document.querySelectorAll("[data-select-trigger]").forEach((trigger) => {
    trigger.setAttribute("aria-expanded", "false");
  });
}

function positionSelectPanel(trigger, panel) {
  const rect = trigger.getBoundingClientRect();
  panel.style.position = "fixed";
  panel.style.top = `${rect.bottom + 4}px`;
  panel.style.left = `${rect.left}px`;
  panel.style.width = `${rect.width}px`;
  panel.style.zIndex = "100";
  panel.style.setProperty("--select-panel-max-height", `${Math.max(160, window.innerHeight - rect.bottom - 16)}px`);
}

function ensureOutsideClose() {
  if (outsideListenerBound) return;
  outsideListenerBound = true;

  document.addEventListener("click", closeAllSelectMenus);
  window.addEventListener("resize", closeAllSelectMenus);
  window.addEventListener(
    "scroll",
    () => {
      document.querySelectorAll("[data-select-content]:not(.hidden)").forEach((panel) => {
        const wrap = panel.closest("[data-custom-select]");
        const trigger = wrap?.querySelector("[data-select-trigger]");
        if (trigger) positionSelectPanel(trigger, panel);
      });
    },
    true,
  );
}

export function selectMenu(id, options, selectedValue, widthClass = "w-[200px]", placeholder = "Выберите") {
  const selected = options.find((o) => o.value === selectedValue);
  const widthPx = WIDTH_PX[widthClass] ?? 200;

  return `
    <div
      class="${cx(bem("select"), "relative inline-flex shrink-0", widthClass)}"
      data-custom-select="${id}"
      style="width:${widthPx}px"
    >
      <button type="button" data-select-trigger class="${SELECT_TRIGGER_CLASS}" aria-haspopup="listbox" aria-expanded="false">
        <span class="truncate text-left flex-1" data-select-label>${escapeHtml(selected?.label ?? placeholder)}</span>
        ${icon("chevronDown", "h-4 w-4 opacity-50 shrink-0 pointer-events-none")}
      </button>
      <div class="${SELECT_PANEL_CLASS}" data-select-content role="listbox">
        ${options
          .map((o) => {
            const active = o.value === selectedValue;
            return `
          <button
            type="button"
            role="option"
            data-select-option
            data-value="${escapeHtml(o.value)}"
            class="${SELECT_ITEM_CLASS} ${active ? "bg-accent text-accent-foreground" : ""}"
            aria-selected="${active ? "true" : "false"}"
          >
            <span class="truncate">${escapeHtml(o.label)}</span>
            ${active ? `<span class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">${icon("check", "h-4 w-4")}</span>` : ""}
          </button>`;
          })
          .join("")}
      </div>
    </div>`;
}

export function bindSelectMenu(root, id, options, onChange) {
  const wrap = root.querySelector(`[data-custom-select="${id}"]`);
  if (!wrap) return;

  ensureOutsideClose();

  const trigger = wrap.querySelector("[data-select-trigger]");
  const panel = wrap.querySelector("[data-select-content]");
  const items = wrap.querySelectorAll("[data-select-option]");

  trigger?.addEventListener("click", (e) => {
    e.stopPropagation();
    const willOpen = panel.classList.contains("hidden");
    closeAllSelectMenus();
    if (willOpen) {
      positionSelectPanel(trigger, panel);
      panel.classList.remove("hidden");
      trigger.setAttribute("aria-expanded", "true");
    }
  });

  items.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      closeAllSelectMenus();
      const value = item.getAttribute("data-value");
      if (value != null) onChange(value);
    });
  });
}

export function closeSelectMenus() {
  closeAllSelectMenus();
}

export function filterRow(itemsHtml, className = "") {
  return `
    <div class="${cx("flex gap-2 items-center flex-wrap", className)}">
      ${icon("filter", "h-4 w-4 text-muted-foreground shrink-0")}
      ${itemsHtml}
    </div>`;
}
