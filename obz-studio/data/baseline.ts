import * as XLSX from "xlsx";

export type BaselineValueByMonth = Record<string, number>; // "2024-01" -> value

export type BaselineRow = {
  label: string;
  scope?: string; // "Sim" / "Não" / etc
  values: BaselineValueByMonth;
};

export type BaselineDataset = {
  rows: BaselineRow[];
  months: string[]; // ordered: ["2024-01", ...]
  sourceFileName?: string;
};

function isNumberLike(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function normalizeMonthCell(v: unknown): string | null {
  // SheetJS pode trazer Date, number (serial), string
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }
  if (typeof v === "number") {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(v);
    if (!d) return null;
    const y = d.y;
    const m = String(d.m).padStart(2, "0");
    return `${y}-${m}`;
  }
  return null;
}

/**
 * Parser “pragmático” para a sua planilha atual (aba Baseline):
 * - Cabeçalho de meses na linha 3
 * - Labels na coluna B
 * - Escopo na coluna C
 * - Meses a partir da coluna D
 */
export function parseBaselineXlsx(buffer: ArrayBuffer, fileName?: string): BaselineDataset {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const ws = wb.Sheets["Baseline"] ?? wb.Sheets[wb.SheetNames[0]];
  if (!ws) throw new Error("Não encontrei nenhuma aba no arquivo.");

  // Converte para matriz (rows x cols)
  const grid: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });

  const headerRowIdx = 2; // linha 3 (0-based)
  const dataStartIdx = 4; // linha 5 (0-based)

  const header = grid[headerRowIdx] ?? [];
  // Meses começam na coluna D => index 3
  const monthCols: { colIdx: number; key: string }[] = [];
  for (let c = 3; c < header.length; c++) {
    const monthKey = normalizeMonthCell(header[c]);
    if (!monthKey) continue;
    monthCols.push({ colIdx: c, key: monthKey });
  }

  const months = monthCols.map(m => m.key);

  const rows: BaselineRow[] = [];
  for (let r = dataStartIdx; r < grid.length; r++) {
    const line = grid[r] ?? [];
    const label = String(line[1] ?? "").trim(); // coluna B
    if (!label) continue;

    const scope = (line[2] ?? undefined) as string | undefined; // coluna C

    const values: BaselineValueByMonth = {};
    for (const mc of monthCols) {
      const v = line[mc.colIdx];
      if (isNumberLike(v)) values[mc.key] = v;
    }

    rows.push({ label, scope, values });
  }

  return { rows, months, sourceFileName: fileName };
}
