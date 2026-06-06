export function bem(block, element = null, modifiers = []) {
  const base = element ? `${block}__${element}` : block;
  const mods = modifiers.filter(Boolean).map((mod) => `${base}--${mod}`);
  return [base, ...mods].join(" ");
}

export function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}
