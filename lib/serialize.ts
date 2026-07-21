// ============================================================
// Serialização → Flow JSON do WhatsApp
// ============================================================
import type { FlowAction, FlowNode, OptionItem, PayloadPair, Screen } from "./types";
import { COMPONENTS } from "./registry";
import { coerce } from "./utils";

interface SerCtx {
  usesDX: boolean;
}

function payObj(pl?: PayloadPair[]): Record<string, any> {
  const o: Record<string, any> = {};
  (pl || []).forEach((p) => {
    if (p && p.key) o[p.key] = coerce(p.value);
  });
  return o;
}

function serializeAction(a?: FlowAction): any {
  if (!a || !a.name || a.name === "none") return null;
  if (a.name === "navigate")
    return { name: "navigate", next: { type: "screen", name: a.next || "" }, payload: payObj(a.payload) };
  if (a.name === "open_url") return { name: "open_url", url: a.url || "" };
  return { name: a.name, payload: payObj(a.payload) };
}

function cleanOption(o: OptionItem): OptionItem {
  const r: OptionItem = { id: o.id || "", title: o.title || "" };
  if (o.description) r.description = o.description;
  if (o.metadata) r.metadata = o.metadata;
  if (o.enabled === false) r.enabled = false;
  return r;
}

function serializeNode(node: FlowNode, ctx: SerCtx): any {
  const def = COMPONENTS[node.type];
  if (!def) return { type: node.type };
  const out: Record<string, any> = { type: node.type };
  for (const f of def.fields) {
    const v = node.props[f.key];
    if (f.type === "boolean") {
      const dv = !!f.def;
      const cur = v === undefined ? dv : !!v;
      if (cur !== dv) out[f.key] = cur;
      continue;
    }
    if (f.type === "options") {
      if (v && v.length) out[f.key] = v.map(cleanOption);
      continue;
    }
    if (f.type === "action") {
      const sa = serializeAction(v);
      if (sa) {
        out[f.key] = sa;
        if (sa.name === "data_exchange") ctx.usesDX = true;
      }
      continue;
    }
    if (f.type === "lines") {
      const arr = Array.isArray(v) ? v.slice() : String(v || "").split("\n");
      if (arr.some((x: any) => String(x).trim() !== "")) out[f.key] = arr;
      continue;
    }
    if (f.type === "number") {
      if (v !== "" && v != null && !isNaN(v)) out[f.key] = Number(v);
      continue;
    }
    if (f.type === "select") {
      if (v != null && v !== f.def && v !== "") out[f.key] = v;
      continue;
    }
    if (f.type === "condition") {
      if (v) out[f.key] = v;
      continue;
    }
    if (v != null && v !== "") out[f.key] = v;
  }
  if (node.type === "If") {
    out.then = (node.then || []).map((n) => serializeNode(n, ctx));
    if (node.else && node.else.length) out.else = node.else.map((n) => serializeNode(n, ctx));
  }
  if (node.type === "Switch") {
    out.cases = {};
    Object.keys(node.cases || {}).forEach((k) => {
      out.cases[k] = (node.cases as any)[k].map((n: FlowNode) => serializeNode(n, ctx));
    });
  }
  return out;
}

export function serializeScreen(sc: Screen, ctx: SerCtx = { usesDX: false }): any {
  const out: Record<string, any> = { id: sc.id, title: sc.title || sc.id };
  if (sc.terminal) {
    out.terminal = true;
    out.success = true;
  }
  let data: any = {};
  if (sc.dataText && sc.dataText.trim()) {
    try {
      data = JSON.parse(sc.dataText);
    } catch {
      data = {};
    }
  }
  out.data = data;
  out.layout = {
    type: "SingleColumnLayout",
    children: (sc.children || []).map((n) => serializeNode(n, ctx)),
  };
  return out;
}

export function buildFlowJSON(flow: { version: string; screens: Screen[] }): any {
  const ctx: SerCtx = { usesDX: false };
  const screens = flow.screens.map((sc) => serializeScreen(sc, ctx));
  const out: Record<string, any> = { version: flow.version };
  if (ctx.usesDX) out.data_api_version = "3.0";
  out.screens = screens;
  return out;
}
