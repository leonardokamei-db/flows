// ============================================================
// Importação de Flow JSON → estado interno
// ============================================================
import type { Flow, FlowAction, FlowNode } from "./types";
import { COMPONENTS } from "./registry";
import { uid } from "./utils";

function parseAction(v: any): FlowAction {
  if (!v) return { name: "none", payload: [] };
  const a: FlowAction = { name: v.name };
  if (v.name === "navigate") a.next = (v.next && v.next.name) || "";
  if (v.name === "open_url") a.url = v.url || "";
  a.payload = v.payload
    ? Object.keys(v.payload).map((k) => ({ key: k, value: String(v.payload[k]) }))
    : [];
  return a;
}

function importNode(c: any): FlowNode[] {
  if (!c || !c.type) return [];
  if (c.type === "Form") return importNodes(c.children || []);
  const def = COMPONENTS[c.type];
  if (!def) return [];
  const node: FlowNode = { _id: uid(), type: c.type, props: {} };
  for (const f of def.fields) {
    if (!(f.key in c)) continue;
    const v = c[f.key];
    if (f.type === "action") node.props[f.key] = parseAction(v);
    else if (f.type === "lines")
      node.props[f.key] = Array.isArray(v) ? v : String(v).split("\n");
    else if (f.type === "options")
      node.props[f.key] = Array.isArray(v)
        ? v.map((o: any) => ({
            id: o.id,
            title: o.title,
            description: o.description,
            metadata: o.metadata,
            enabled: o.enabled,
          }))
        : [];
    else node.props[f.key] = v;
  }
  if (c.type === "If") {
    node.props.condition = c.condition || "";
    node.then = importNodes(c.then);
    node.else = importNodes(c.else);
  }
  if (c.type === "Switch") {
    node.props.value = c.value || "";
    node.cases = {};
    Object.keys(c.cases || {}).forEach((k) => {
      (node.cases as any)[k] = importNodes(c.cases[k]);
    });
    if (!Object.keys(node.cases).length) node.cases = { caso_1: [] };
  }
  return [node];
}

function importNodes(arr: any[]): FlowNode[] {
  return (arr || []).flatMap(importNode);
}

/** Converte um objeto Flow JSON no fluxo interno. Lança erro se não houver telas. */
export function importFlow(obj: any): { flow: Flow; currentId: string } {
  const screens = (obj.screens || []).map((s: any) => ({
    _id: uid(),
    id: s.id || "TELA",
    title: s.title || s.id || "Tela",
    terminal: !!s.terminal,
    dataText:
      s.data && Object.keys(s.data).length ? JSON.stringify(s.data, null, 2) : "",
    children: importNodes((s.layout && s.layout.children) || s.children || []),
  }));
  if (!screens.length) throw new Error("Nenhuma tela encontrada");
  return {
    flow: { version: obj.version || "7.0", screens },
    currentId: screens[0]._id,
  };
}
