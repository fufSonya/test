import { icon } from "./icons.js";
import { btn } from "./ui.js";
import { bem } from "./bem.js";

const MONTHS_RU = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

const WEEKDAYS_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function formatPickerDate(date) {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getDate()} ${MONTHS_RU[d.getMonth()]} ${d.getFullYear()} г.`;
}

export function formatPickerShort(date) {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function isBeforeDay(a, b) {
  return startOfDay(a).getTime() < startOfDay(b).getTime();
}

function isInRange(day, from, to) {
  if (!from || !to) return false;
  const t = startOfDay(day).getTime();
  return t >= startOfDay(from).getTime() && t <= startOfDay(to).getTime();
}

function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
}

function renderCalendarHtml(state) {
  const { year, month, mode, selected, rangeFrom, rangeTo, disablePast, month2 } = state;
  const today = startOfDay(new Date());

  function renderMonth(y, m, extraClass = "") {
    const cells = buildMonthGrid(y, m);
    return `
      <div class="date-picker__month ${extraClass}">
        <div class="text-sm font-medium text-center mb-2 capitalize">${MONTHS_RU[m]} ${y}</div>
        <div class="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1">
          ${WEEKDAYS_RU.map((w) => `<div class="h-8 flex items-center justify-center">${w}</div>`).join("")}
        </div>
        <div class="grid grid-cols-7 gap-1">
          ${cells
            .map((day) => {
              if (!day) return '<div class="h-8"></div>';
              const disabled = disablePast && isBeforeDay(day, today);
              const isSelected =
                mode === "single"
                  ? isSameDay(day, selected)
                  : isSameDay(day, rangeFrom) || isSameDay(day, rangeTo) || isInRange(day, rangeFrom, rangeTo);
              return `<button type="button" data-day="${day.toISOString()}" ${disabled ? "disabled" : ""}
                class="date-picker__day h-8 w-8 rounded-md text-sm inline-flex items-center justify-center transition-colors
                ${disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-accent cursor-pointer"}
                ${isSelected ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}">${day.getDate()}</button>`;
            })
            .join("")}
        </div>
      </div>`;
  }

  return `
    <div class="${bem("date-picker", "calendar")} p-2">
      <div class="flex items-center justify-between mb-2">
        <button type="button" class="date-picker__nav h-8 w-8 rounded-md hover:bg-accent inline-flex items-center justify-center" data-cal-prev aria-label="Предыдущий месяц">${icon("chevronDown", "h-4 w-4 rotate-90")}</button>
        <span class="text-sm font-medium">${mode === "range" ? "Диапазон дат" : "Выберите дату"}</span>
        <button type="button" class="date-picker__nav h-8 w-8 rounded-md hover:bg-accent inline-flex items-center justify-center" data-cal-next aria-label="Следующий месяц">${icon("chevronDown", "h-4 w-4 -rotate-90")}</button>
      </div>
      <div class="${mode === "range" ? "flex gap-4 flex-wrap" : ""}">
        ${renderMonth(year, month)}
        ${mode === "range" ? renderMonth(month2.year, month2.month, "hidden sm:block") : ""}
      </div>
    </div>`;
}

export function datePickerField(id, { value = "", placeholder = "Выберите дату" } = {}) {
  const display = value ? formatPickerDate(value) : `<span class="text-muted-foreground">${placeholder}</span>`;
  return `
    <div class="${bem("date-picker")} relative w-full" data-date-picker-root="${id}">
      ${btn(`${icon("calendar", "mr-2 h-4 w-4")}${display}`, {
        variant: "outline",
        className: "w-full justify-start text-left font-normal",
        attrs: `type="button" data-date-picker-trigger="${id}"`,
      })}
      <div class="hidden absolute top-full left-0 z-[60] mt-1 rounded-md border bg-popover text-popover-foreground shadow-md" data-date-picker-panel="${id}"></div>
      <input type="hidden" id="${id}" value="${value ? new Date(value).toISOString().slice(0, 10) : ""}" />
    </div>`;
}

export function bindDatePicker(root, id, { disablePast = false, onChange } = {}) {
  const wrap = root.querySelector(`[data-date-picker-root="${id}"]`);
  if (!wrap) return;

  const trigger = wrap.querySelector(`[data-date-picker-trigger="${id}"]`);
  const panel = wrap.querySelector(`[data-date-picker-panel="${id}"]`);
  const hidden = wrap.querySelector(`#${id}`);

  let open = false;
  let selected = hidden.value ? new Date(hidden.value) : undefined;
  const now = new Date();
  let year = (selected || now).getFullYear();
  let month = (selected || now).getMonth();

  function paintPanel() {
    panel.innerHTML = renderCalendarHtml({
      year,
      month,
      mode: "single",
      selected,
      disablePast,
      month2: { year, month },
    });
    panel.querySelector("[data-cal-prev]")?.addEventListener("click", (e) => {
      e.stopPropagation();
      month -= 1;
      if (month < 0) { month = 11; year -= 1; }
      paintPanel();
    });
    panel.querySelector("[data-cal-next]")?.addEventListener("click", (e) => {
      e.stopPropagation();
      month += 1;
      if (month > 11) { month = 0; year += 1; }
      paintPanel();
    });
    panel.querySelectorAll("[data-day]").forEach((btnEl) => {
      btnEl.addEventListener("click", (e) => {
        e.stopPropagation();
        selected = new Date(btnEl.dataset.day);
        hidden.value = selected.toISOString().slice(0, 10);
        open = false;
        panel.classList.add("hidden");
        updateTriggerLabel();
        onChange?.(selected);
      });
    });
  }

  function updateTriggerLabel() {
    const label = selected ? formatPickerDate(selected) : `<span class="text-muted-foreground">Выберите дату</span>`;
    trigger.innerHTML = `${icon("calendar", "mr-2 h-4 w-4")}${label}`;
  }

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    open = !open;
    panel.classList.toggle("hidden", !open);
    if (open) paintPanel();
  });

  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) {
      open = false;
      panel.classList.add("hidden");
    }
  });
}

export function dateRangePickerButton(id = "activity-date-range") {
  return `
    <div class="${bem("date-picker", "range")} relative" data-range-picker="${id}">
      ${btn(`${icon("calendar", "mr-2 h-4 w-4")}<span data-range-label>Выберите диапазон дат</span>`, {
        variant: "outline",
        className: "w-[280px] justify-start text-left font-normal",
        attrs: `type="button" data-range-trigger`,
      })}
      <div class="hidden absolute top-full left-0 z-[60] mt-1 rounded-md border bg-popover shadow-md" data-range-panel></div>
    </div>`;
}

export function bindDateRangePicker(root, { onChange, onClear }) {
  const wrap = root.querySelector("[data-range-picker]");
  if (!wrap) return;

  const trigger = wrap.querySelector("[data-range-trigger]");
  const panel = wrap.querySelector("[data-range-panel]");
  const label = wrap.querySelector("[data-range-label]");

  let open = false;
  let from;
  let to;
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();

  function month2() {
    const m = month + 1;
    return m > 11 ? { year: year + 1, month: 0 } : { year, month: m };
  }

  function updateLabel() {
    if (from && to) {
      label.textContent = `${formatPickerShort(from)} - ${formatPickerShort(to)}`;
    } else if (from) {
      label.textContent = formatPickerShort(from);
    } else {
      label.textContent = "Выберите диапазон дат";
    }
  }

  function paintPanel() {
    panel.innerHTML = renderCalendarHtml({
      year,
      month,
      mode: "range",
      rangeFrom: from,
      rangeTo: to,
      month2: month2(),
    });

    panel.querySelector("[data-cal-prev]")?.addEventListener("click", (e) => {
      e.stopPropagation();
      month -= 1;
      if (month < 0) { month = 11; year -= 1; }
      paintPanel();
    });
    panel.querySelector("[data-cal-next]")?.addEventListener("click", (e) => {
      e.stopPropagation();
      month += 1;
      if (month > 11) { month = 0; year += 1; }
      paintPanel();
    });

    panel.querySelectorAll("[data-day]").forEach((btnEl) => {
      btnEl.addEventListener("click", (e) => {
        e.stopPropagation();
        const day = new Date(btnEl.dataset.day);
        if (!from || (from && to)) {
          from = day;
          to = undefined;
        } else if (isBeforeDay(day, from)) {
          to = from;
          from = day;
        } else {
          to = day;
        }
        updateLabel();
        onChange?.({ from, to });
        if (from && to) {
          open = false;
          panel.classList.add("hidden");
        }
        paintPanel();
      });
    });
  }

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    open = !open;
    panel.classList.toggle("hidden", !open);
    if (open) paintPanel();
  });

  wrap.addEventListener("click", (e) => {
    if (e.target.closest("[data-range-clear]")) {
      e.stopPropagation();
      from = undefined;
      to = undefined;
      updateLabel();
      onClear?.();
      paintPanel();
    }
  });

  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) {
      open = false;
      panel.classList.add("hidden");
    }
  });

  return {
    clear() {
      from = undefined;
      to = undefined;
      updateLabel();
      onClear?.();
    },
  };
}
