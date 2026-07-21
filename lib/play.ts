// ============================================================
// Simulação do modo Testar: valores, condições e campos
// ============================================================
import type { Flow, FlowNode } from "./types";
import { walk } from "./tree";

/** Mapa name → valor a partir das respostas preenchidas no teste. */
export function buildFormMap(
  flow: Flow,
  playData: Record<string, any>,
): Record<string, any> {
  const m: Record<string, any> = {};
  flow.screens.forEach((s) =>
    walk(s.children, (n) => {
      if (n.props && n.props.name && n._id in playData) m[n.props.name] = playData[n._id];
    }),
  );
  return m;
}

/** Avalia uma condição do If. Retorna true/false, ou null se não avaliável. */
export function playEvalCondition(
  cond: string | undefined,
  form: Record<string, any>,
): boolean | null {
  if (!cond) return null;
  let bad = false;
  const expr = String(cond).replace(
    /\$\{\s*(form|data|screen)\.([A-Za-z0-9_.\-]+)\s*\}/g,
    (_m, scope, key) => {
      const v = scope === "form" ? form[key] : undefined;
      if (v === undefined) return "undefined";
      try {
        return JSON.stringify(v);
      } catch {
        bad = true;
        return "undefined";
      }
    },
  );
  if (bad || /\$\{/.test(expr)) return null;
  const stripped = expr
    .replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, "")
    .replace(/\b(?:true|false|null|undefined)\b/g, "");
  if (!/^[\s0-9+\-*/%()!<>=&|.,[\]]*$/.test(stripped)) return null;
  try {
    return !!new Function("return (" + expr + ");")();
  } catch {
    return null;
  }
}

export function resolvePlayValue(
  tpl: string | undefined,
  form: Record<string, any>,
): string {
  if (tpl == null) return "";
  return String(tpl)
    .replace(/\$\{\s*(form|data|screen)\.([A-Za-z0-9_.\-]+)\s*\}/g, (_m, scope, key) => {
      const v = scope === "form" ? form[key] : undefined;
      return v == null ? "" : String(v);
    })
    .trim();
}

/** Achata a árvore resolvendo ramificações If/Switch de acordo com o teste. */
export function flattenPlay(
  nodes: FlowNode[] | undefined,
  form: Record<string, any>,
): FlowNode[] {
  const out: FlowNode[] = [];
  for (const n of nodes || []) {
    if (n.type === "If") {
      const r = playEvalCondition(n.props && n.props.condition, form);
      out.push(...flattenPlay(r === false ? n.else || [] : n.then || [], form));
    } else if (n.type === "Switch") {
      const v = resolvePlayValue(n.props && n.props.value, form);
      const keys = Object.keys(n.cases || {});
      const k = keys.includes(v) ? v : keys[0];
      out.push(...flattenPlay((k !== undefined && (n.cases as any)[k]) || [], form));
    } else out.push(n);
  }
  return out;
}

/** Valida os campos visíveis da tela atual no modo teste. */
export function validatePlayScreen(
  children: FlowNode[],
  playData: Record<string, any>,
  form: Record<string, any>,
): Record<string, string> {
  const errs: Record<string, string> = {};
  for (const n of flattenPlay(children, form)) {
    const p = n.props || {};
    if (p.visible === false) continue;
    const v = playData[n._id];
    if (n.type === "TextInput" || n.type === "TextArea") {
      const s = (v == null ? "" : String(v)).trim();
      if (p.required && !s) {
        errs[n._id] = "Campo obrigatório";
        continue;
      }
      const mn = +p["min-chars"];
      if (n.type === "TextInput" && mn > 0 && s && s.length < mn)
        errs[n._id] = "Mínimo de " + mn + " caracteres";
      if (
        n.type === "TextInput" &&
        p["input-type"] === "email" &&
        s &&
        !/^\S+@\S+\.\S+$/.test(s)
      )
        errs[n._id] = "E-mail inválido";
    } else if (n.type === "Dropdown" || n.type === "RadioButtonsGroup") {
      if (p.required && !v) errs[n._id] = "Escolha uma opção";
    } else if (n.type === "CheckboxGroup" && p.required) {
      const min = Math.max(1, +p["min-selected-items"] || 1);
      if (!Array.isArray(v) || v.length < min)
        errs[n._id] =
          min > 1 ? "Escolha ao menos " + min + " opções" : "Escolha ao menos uma opção";
    } else if (n.type === "OptIn" && p.required && !v)
      errs[n._id] = "É preciso aceitar para continuar";
  }
  return errs;
}
