// ============================================================
// Helpers de modelo (mutam nós/telas já clonados pelo reducer)
// ============================================================
import type { FlowNode, Screen } from "./types";
import { walk } from "./tree";

export function uniqueScreenId(base: string, screens: Screen[]): string {
  base =
    String(base || "TELA")
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, "_")
      .replace(/^_+|_+$/g, "") || "TELA";
  let id = base;
  let n = 2;
  while (screens.some((s) => s.id === id)) id = base + "_" + n++;
  return id;
}

/** Garante um "name" único na tela (evita erro de nome duplicado ao adicionar). */
export function ensureUniqueName(node: FlowNode, screenChildren: FlowNode[]): void {
  if (!node || !node.props || !("name" in node.props)) return;
  const names = new Set<string>();
  walk(screenChildren, (n) => {
    if (n !== node && n.props && n.props.name) names.add(n.props.name);
  });
  const nm = node.props.name;
  if (nm && !names.has(nm)) return;
  const base = String(nm || node.type.toLowerCase()).replace(/_\d+$/, "");
  let i = 2;
  let c: string;
  do {
    c = base + "_" + i++;
  } while (names.has(c));
  node.props.name = c;
}

/** Renomeia o id de uma tela e atualiza navegações que apontavam para ela. */
export function setScreenIdInPlace(
  screens: Screen[],
  sc: Screen,
  raw: string,
): { ok: boolean; adjusted?: string; empty?: boolean } {
  let id = String(raw || "").trim().replace(/\s+/g, "_");
  if (!id) return { ok: false, empty: true };
  let adjusted: string | undefined;
  if (screens.some((s) => s !== sc && s.id === id)) {
    id = uniqueScreenId(id, screens);
    adjusted = id;
  }
  const old = sc.id;
  sc.id = id;
  screens.forEach((s) =>
    walk(s.children, (n) => {
      ["on-click-action", "on-select-action"].forEach((k) => {
        const a = n.props && n.props[k];
        if (a && a.name === "navigate" && a.next === old) a.next = id;
      });
    }),
  );
  return { ok: true, adjusted };
}
