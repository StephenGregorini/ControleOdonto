export function formatNumber(v) {
  if (v == null || isNaN(v)) return "-";
  return Number(v).toLocaleString("pt-BR");
}

export function formatCurrency(v) {
  if (v == null || isNaN(v)) return "-";
  return Number(v).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatPercent(v) {
  if (v == null || isNaN(v)) return "-";
  let num = Number(v);
  if (num <= 1 && num >= -1) num = num * 100;
  return `${num.toFixed(2)}%`;
}

export function formatMesRef(str) {
  if (!str) return "-";
  const [ano, mes] = String(str).split("-");
  if (!ano || !mes) return str;
  return `${mes}/${ano}`;
}
