"use client";
// ============================================================
// Operações de modelo (todas passam pelo histórico via commit/editArmed)
// ============================================================
import type { Draft } from "./flowStore";
import type { FlowNode, Screen } from "@/lib/types";
import { COMPONENTS } from "@/lib/registry";
import { makeNode } from "@/lib/seed";
import { clone, uid } from "@/lib/utils";
import { findNode, findWithParent, cloneFresh, reid } from "@/lib/tree";
import { ensureUniqueName, uniqueScreenId, setScreenIdInPlace } from "@/lib/model";
import { importFlow } from "@/lib/import";
import { useFlow, screenOf } from "./flowStore";
import { useToast } from "./toast";

const cur = (d: Draft): Screen =>
  d.flow.screens.find((s) => s._id === d.currentId) || d.flow.screens[0];

const selNode = (d: Draft): FlowNode | null =>
  d.sel.kind === "component" ? findNode(d.sel.id, cur(d).children) : null;

export function useOps() {
  const { state, commit, editArmed, set } = useFlow();
  const { toast } = useToast();

  // ---------- componentes ----------
  const addComponent = (type: string) => {
    commit((d) => {
      const sc = cur(d);
      const n = makeNode(type);
      ensureUniqueName(n, sc.children);
      sc.children.push(n);
      d.sel = { kind: "component", id: n._id };
      d.justAdded = n._id;
    });
    toast(COMPONENTS[type].label + " adicionado");
  };

  const deleteNode = (id: string) =>
    commit((d) => {
      const r = findWithParent(id, cur(d).children);
      if (r) r.arr.splice(r.index, 1);
      if (d.sel.kind === "component" && d.sel.id === id) d.sel = { kind: "screen" };
    });

  const duplicateNode = (id: string) =>
    commit((d) => {
      const r = findWithParent(id, cur(d).children);
      if (r) {
        const c = cloneFresh(r.node);
        r.arr.splice(r.index + 1, 0, c);
        d.sel = { kind: "component", id: c._id };
      }
    });

  // ---------- telas ----------
  const addScreen = () => {
    commit((d) => {
      const id = uniqueScreenId("TELA", d.flow.screens);
      const s: Screen = { _id: uid(), id, title: "Nova tela", terminal: false, dataText: "", children: [] };
      d.flow.screens.push(s);
      d.currentId = s._id;
      d.sel = { kind: "screen" };
    });
    toast("Tela adicionada");
  };

  const duplicateScreen = () => {
    commit((d) => {
      const sc = cur(d);
      const idx = d.flow.screens.indexOf(sc);
      const c: Screen = clone(sc);
      c._id = uid();
      c.id = uniqueScreenId(sc.id + "_COPY", d.flow.screens);
      c.title = (sc.title || sc.id) + " (cópia)";
      c.children.forEach(reid);
      d.flow.screens.splice(idx + 1, 0, c);
      d.currentId = c._id;
      d.sel = { kind: "screen" };
    });
    toast("Tela duplicada");
  };

  const deleteScreen = () => {
    if (state.flow.screens.length <= 1) {
      toast("É preciso ao menos uma tela", "warn");
      return;
    }
    commit((d) => {
      const idx = d.flow.screens.indexOf(cur(d));
      d.flow.screens.splice(idx, 1);
      d.currentId = d.flow.screens[Math.max(0, idx - 1)]._id;
      d.sel = { kind: "screen" };
    });
  };

  const moveScreen = (dir: number) => {
    const idx = state.flow.screens.findIndex((s) => s._id === state.currentId);
    const t = idx + dir;
    if (t < 0 || t >= state.flow.screens.length) return;
    commit((d) => {
      const arr = d.flow.screens;
      const [s] = arr.splice(idx, 1);
      arr.splice(t, 0, s);
    });
  };

  const setScreenId = (value: string) => {
    const raw = String(value || "").trim().replace(/\s+/g, "_");
    if (!raw) {
      toast("ID vazio", "warn");
      return;
    }
    const scCur = screenOf(state);
    let id = raw;
    let adjusted = false;
    if (state.flow.screens.some((s) => s !== scCur && s.id === id)) {
      id = uniqueScreenId(id, state.flow.screens);
      adjusted = true;
    }
    commit((d) => {
      setScreenIdInPlace(d.flow.screens, cur(d), value);
    });
    if (adjusted) toast("ID já existia — ajustado para " + id, "warn");
  };

  const setCurrent = (screenDomId: string) =>
    set((d) => {
      d.currentId = screenDomId;
      d.sel = { kind: "screen" };
    });

  const gotoScreen = (screenDomId: string) =>
    set((d) => {
      d.currentId = screenDomId;
      d.sel = { kind: "screen" };
    });

  // ---------- seleção ----------
  const selectComponent = (id: string) => set((d) => (d.sel = { kind: "component", id }));
  const selectScreen = () => set((d) => (d.sel = { kind: "screen" }));

  // ---------- propriedades ----------
  /** edição contínua de campo simples (text/textarea/number/lines já convertido) */
  const editProp = (key: string, value: any) =>
    editArmed((d) => {
      const n = selNode(d);
      if (n) n.props[key] = value;
    });

  const setProp = (key: string, value: any) =>
    commit((d) => {
      const n = selNode(d);
      if (n) n.props[key] = value;
    });

  const toggleComp = (key: string) => {
    const node = state.sel.kind === "component" ? findNode(state.sel.id, screenOf(state).children) : null;
    if (!node) return;
    const f = COMPONENTS[node.type].fields.find((x) => x.key === key);
    const curVal = node.props[key] === undefined ? !!(f && f.def) : !!node.props[key];
    commit((d) => {
      const n = selNode(d);
      if (n) n.props[key] = !curVal;
    });
  };

  const toggleTerminal = () =>
    commit((d) => {
      const sc = cur(d);
      sc.terminal = !sc.terminal;
    });

  // ---------- opções (data-source) ----------
  const addOption = (key: string) =>
    commit((d) => {
      const n = selNode(d);
      if (n) n.props[key].push({ id: "op_" + (n.props[key].length + 1), title: "Nova opção" });
    });
  const delOption = (key: string, idx: number) =>
    commit((d) => {
      const n = selNode(d);
      if (n) n.props[key].splice(idx, 1);
    });
  const editOption = (key: string, idx: number, field: string, value: string) =>
    editArmed((d) => {
      const n = selNode(d);
      if (n) n.props[key][idx][field] = value;
    });

  // ---------- ações ----------
  const setActionName = (fk: string, value: string) =>
    commit((d) => {
      const n = selNode(d);
      if (!n) return;
      const old = n.props[fk] || {};
      const na: any = { name: value, payload: old.payload || [] };
      if (value === "navigate") na.next = old.next || "";
      if (value === "open_url") na.url = old.url || "";
      n.props[fk] = na;
    });
  const setActionNext = (fk: string, value: string) =>
    commit((d) => {
      const n = selNode(d);
      if (n) n.props[fk].next = value;
    });
  const setActionUrl = (fk: string, value: string) =>
    editArmed((d) => {
      const n = selNode(d);
      if (n) n.props[fk].url = value;
    });
  const addPayload = (fk: string) =>
    commit((d) => {
      const n = selNode(d);
      if (n) (n.props[fk].payload = n.props[fk].payload || []).push({ key: "", value: "" });
    });
  const delPayload = (fk: string, idx: number) =>
    commit((d) => {
      const n = selNode(d);
      if (n) n.props[fk].payload.splice(idx, 1);
    });
  const editPayload = (fk: string, idx: number, field: string, value: string) =>
    editArmed((d) => {
      const n = selNode(d);
      if (n) (n.props[fk].payload = n.props[fk].payload || [])[idx][field] = value;
    });

  // ---------- condição / casos ----------
  const setCondition = (value: string) =>
    editArmed((d) => {
      const n = selNode(d);
      if (n) n.props.condition = value;
    });
  const setSwitchValue = (value: string) =>
    editArmed((d) => {
      const n = selNode(d);
      if (n) n.props.value = value;
    });
  const addCase = () =>
    commit((d) => {
      const n = selNode(d);
      if (!n || !n.cases) return;
      let i = 1;
      while (n.cases["caso_" + i]) i++;
      n.cases["caso_" + i] = [];
    });
  const delCase = (key: string) =>
    commit((d) => {
      const n = selNode(d);
      if (n && n.cases) delete n.cases[key];
    });
  const renameCase = (oldk: string, newk: string) => {
    const node = state.sel.kind === "component" ? findNode(state.sel.id, screenOf(state).children) : null;
    const nk = (newk || "").trim() || oldk;
    if (nk === oldk || (node && node.cases && node.cases[nk])) return false;
    commit((d) => {
      const n = selNode(d);
      if (!n || !n.cases) return;
      const nc: Record<string, FlowNode[]> = {};
      Object.keys(n.cases).forEach((k) => (nc[k === oldk ? nk : k] = n.cases![k]));
      n.cases = nc;
    });
    return true;
  };

  // ---------- tela: título / dados ----------
  const editScreenTitle = (value: string) =>
    editArmed((d) => {
      cur(d).title = value;
    });
  const editScreenData = (value: string) =>
    editArmed((d) => {
      cur(d).dataText = value;
    });

  const setVersion = (value: string) => commit((d) => (d.flow.version = value));

  /** importa um Flow JSON (registra histórico). Retorna erro (string) ou null. */
  const importFlowJSON = (obj: any): string | null => {
    try {
      const { flow, currentId } = importFlow(obj);
      commit((d) => {
        d.flow = flow;
        d.currentId = currentId;
        d.sel = { kind: "screen" };
      });
      return null;
    } catch (e: any) {
      return e?.message || "Falha ao importar";
    }
  };

  return {
    addComponent,
    deleteNode,
    duplicateNode,
    addScreen,
    duplicateScreen,
    deleteScreen,
    moveScreen,
    setScreenId,
    setCurrent,
    gotoScreen,
    selectComponent,
    selectScreen,
    editProp,
    setProp,
    toggleComp,
    toggleTerminal,
    addOption,
    delOption,
    editOption,
    setActionName,
    setActionNext,
    setActionUrl,
    addPayload,
    delPayload,
    editPayload,
    setCondition,
    setSwitchValue,
    addCase,
    delCase,
    renameCase,
    editScreenTitle,
    editScreenData,
    setVersion,
    importFlowJSON,
  };
}
