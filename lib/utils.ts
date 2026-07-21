// ============================================================
// Utilitários genéricos
// ============================================================

/** Escapa HTML (usado apenas onde ainda geramos markup em string, ex.: markdown). */
export const esc = (s: unknown): string =>
  String(s == null ? "" : s).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c] as string,
  );

/** Clona profundamente via JSON (mesma semântica do app original). */
export const clone = <T>(o: T): T => JSON.parse(JSON.stringify(o));

let _uid = 0;
/** Gera um id único e estável durante a sessão. */
export const uid = (): string =>
  "n" +
  Date.now().toString(36) +
  (_uid++).toString(36) +
  Math.floor(Math.random() * 1e4).toString(36);

/** Converte strings "true"/"false"/número para o tipo correspondente (payloads). */
export function coerce(v: any): any {
  if (v === "true") return true;
  if (v === "false") return false;
  if (
    typeof v === "string" &&
    v !== "" &&
    !/^\$\{/.test(v) &&
    /^-?\d+(\.\d+)?$/.test(v)
  )
    return Number(v);
  return v;
}
