export function showToast(message, type = "success") {
  const root = document.getElementById("toast-root");
  if (!root) return;

  const el = document.createElement("div");
  el.className = `fixed bottom-6 right-6 z-[2000] rounded-lg border bg-card px-4 py-3 shadow-lg text-sm animate-in slide-in-from-bottom-2 ${type === "error" ? "border-destructive" : "border-green-600"}`;
  el.textContent = message;
  root.appendChild(el);

  setTimeout(() => el.remove(), 3000);
}
