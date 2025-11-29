// src/utils/theme.js
// Tokens simples pra você reaproveitar nos componentes se quiser.

export const THEME = {
  colors: {
    pageBg: "#020617", // slate-950
    sidebarBg: "#020617",
    cardBg: "#020617",
    cardBorder: "#0f172a",
    accent: "#0ea5e9", // sky-500
    accentSoft: "#38bdf8",
    accentMuted: "#082f49",
    danger: "#fb7185", // rose-400
  },
  layout: {
    maxWidth: "1200px",
  },
};

// janelas padrão para filtros de dashboard (se quiser usar)
export const JANELAS_MOVEIS = [
  { value: 3, label: "Últimos 3 meses" },
  { value: 6, label: "Últimos 6 meses" },
  { value: 12, label: "Últimos 12 meses" },
];

// anos padrão (usado em selects de ano, se precisar)
export const ANOS = [
  new Date().getFullYear() - 1,
  new Date().getFullYear(),
];

// exemplo de token tipográfico (se quiser usar em inline-style)
export const LETTER_SPACING_TIGHT = "-0.03em";
