// фиксированные цвета ролей (hex)
export const COLOR_OPTIONS = [
  { value: "bg-purple-600", hex: "#9333ea", label: "Фиолетовый" },
  { value: "bg-green-600", hex: "#16a34a", label: "Зелёный" },
  { value: "bg-pink-600", hex: "#db2777", label: "Розовый" },
  { value: "bg-blue-600", hex: "#2563eb", label: "Синий" },
  { value: "bg-red-600", hex: "#dc2626", label: "Красный" },
  { value: "bg-yellow-600", hex: "#ca8a04", label: "Жёлтый" },
  { value: "bg-indigo-600", hex: "#4f46e5", label: "Индиго" },
  { value: "bg-orange-600", hex: "#ea580c", label: "Оранжевый" },
  { value: "bg-teal-600", hex: "#0d9488", label: "Бирюзовый" },
  { value: "bg-gray-600", hex: "#4b5563", label: "Серый" },
];

const HEX_BY_CLASS = Object.fromEntries(COLOR_OPTIONS.map((c) => [c.value, c.hex]));

export function getRoleColorHex(colorClass) {
  return HEX_BY_CLASS[colorClass] || "#4b5563";
}

export function roleColorStyle(colorClass) {
  return `background-color: ${getRoleColorHex(colorClass)}`;
}
