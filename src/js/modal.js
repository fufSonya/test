import { icon } from "./icons.js";
import { bem, cx } from "./bem.js";

export class Modal {
  constructor({ title, description, bodyHtml, footerHtml, wide = false }) {
    this.title = title;
    this.description = description;
    this.bodyHtml = bodyHtml;
    this.footerHtml = footerHtml;
    this.wide = wide;
    this.overlay = null;
    this.root = document.getElementById("modal-root");
  }

  open() {
    const maxW = this.wide ? "sm:max-w-2xl" : "sm:max-w-lg";

    this.overlay = document.createElement("div");
    this.overlay.className = bem("modal");
    this.overlay.innerHTML = `
      <div class="${cx(bem("modal", "overlay"), "fixed inset-0 z-50 bg-black/50")}" data-modal-overlay></div>
      <div role="dialog" aria-modal="true" class="${cx(bem("modal", "dialog"), "bg-background fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200", maxW)}">
        <button type="button" class="${bem("modal", "close")} absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:outline-hidden" data-modal-close aria-label="Закрыть">
          ${icon("x", "h-4 w-4")}
        </button>
        <div class="flex flex-col gap-2 text-center sm:text-left">
          <h2 class="${cx(bem("modal", "title"), "text-lg leading-none font-semibold")}">${this.title}</h2>
          ${this.description ? `<p class="${cx(bem("modal", "description"), "text-muted-foreground text-sm")}">${this.description}</p>` : ""}
        </div>
        <div class="${bem("modal", "body")}">${this.bodyHtml}</div>
        ${this.footerHtml ? `<div class="${cx(bem("modal", "footer"), "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end")}">${this.footerHtml}</div>` : ""}
      </div>
    `;

    this.overlay.querySelector("[data-modal-overlay]")?.addEventListener("click", () => this.close());
    this.overlay.querySelectorAll("[data-modal-close]").forEach((btn) => {
      btn.addEventListener("click", () => this.close());
    });

    this.root.appendChild(this.overlay);
    return { close: () => this.close(), overlay: this.overlay };
  }

  close() {
    this.overlay?.remove();
    this.overlay = null;
  }
}

export function openModal(options) {
  const modal = new Modal(options);
  return modal.open();
}
