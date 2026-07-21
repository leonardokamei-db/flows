// ============================================================
// Utilitários de data / calendário (modo teste)
// ============================================================

export const MONTHS_BR = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// Dom Seg Ter Qua Qui Sex Sáb
export const DOW_BR = ["D", "S", "T", "Q", "Q", "S", "S"];

export const pad2 = (n: number): string => (n < 10 ? "0" : "") + n;

export const isoOf = (y: number, m: number, d: number): string =>
  y + "-" + pad2(m + 1) + "-" + pad2(d);

export function fmtBR(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  return m ? m[3] + "/" + m[2] + "/" + m[1] : iso || "";
}

export const parseISO = (s: string): string =>
  /^\d{4}-\d{2}-\d{2}$/.test(s || "") ? s : "";

export function withinBounds(iso: string, min?: string, max?: string): boolean {
  const mn = parseISO(min || "");
  const mx = parseISO(max || "");
  if (mn && iso < mn) return false;
  if (mx && iso > mx) return false;
  return true;
}
