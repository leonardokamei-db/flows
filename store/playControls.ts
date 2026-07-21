"use client";
// ============================================================
// Controles do modo Testar (play)
// ============================================================
import type { FlowAction, FlowNode } from "@/lib/types";
import { findNode } from "@/lib/tree";
import { buildFormMap, validatePlayScreen } from "@/lib/play";
import { parseISO } from "@/lib/calendar";
import { useFlow, screenOf } from "./flowStore";
import { useToast } from "./toast";

export function usePlayControls() {
  const { state, set } = useFlow();
  const { toast } = useToast();
  const sc = screenOf(state);

  const scrollToErr = () => {
    requestAnimationFrame(() => {
      const el = document.querySelector("#waCanvasRoot .perr");
      if (el && typeof (el as HTMLElement).scrollIntoView === "function")
        (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const setPlay = (p: boolean) => {
    if (state.mode !== "ux") return;
    set((d) => {
      d.play = !!p;
      d.sheet = null;
      if (d.play) {
        d.navStack = [];
        d.done = false;
        d.playData = {};
        d.playErr = {};
        d.navDir = "fwd";
        d.animScreen = true;
        d.currentId = d.flow.screens[0]._id;
        d.sel = { kind: "screen" };
        d.playEpoch++;
      }
    });
  };

  const playRestart = () =>
    set((d) => {
      d.navStack = [];
      d.done = false;
      d.playData = {};
      d.playErr = {};
      d.sheet = null;
      d.navDir = "fwd";
      d.animScreen = true;
      d.currentId = d.flow.screens[0]._id;
      d.playEpoch++;
    });

  const playBack = () => {
    if (!state.navStack.length) return;
    set((d) => {
      d.currentId = d.navStack.pop() as string;
      d.done = false;
      d.playErr = {};
      d.sheet = null;
      d.navDir = "back";
      d.animScreen = true;
    });
  };

  const doPlayAction = (a: FlowAction) => {
    if (a.name === "navigate") {
      const target = state.flow.screens.find((x) => x.id === a.next);
      if (target) {
        set((d) => {
          d.sheet = null;
          d.navStack.push(d.currentId);
          d.currentId = target._id;
          d.done = false;
          d.playErr = {};
          d.navDir = "fwd";
          d.animScreen = true;
        });
      } else toast("Este botão ainda não tem uma tela de destino", "warn");
    } else if (a.name === "complete") {
      set((d) => {
        d.sheet = null;
        d.done = true;
        d.playErr = {};
        d.navDir = "fwd";
        d.animScreen = true;
      });
    } else if (a.name === "open_url") {
      toast("Abriria o link: " + (a.url || "(sem URL)"));
    } else {
      toast("Ação de dados — simulada no teste");
    }
  };

  const footerClick = (node: FlowNode) => {
    let a: FlowAction | undefined = node.props["on-click-action"];
    if (!a || !a.name || a.name === "none") a = node.props["on-select-action"];
    if (!a || !a.name || a.name === "none") return;
    if (node.type === "Footer") {
      const form = buildFormMap(state.flow, state.playData);
      const errs = validatePlayScreen(sc.children, state.playData, form);
      if (Object.keys(errs).length) {
        set((d) => {
          d.playErr = errs;
        });
        scrollToErr();
        toast("Preencha os campos destacados", "warn");
        return;
      }
    }
    doPlayAction(a);
  };

  const setPlayData = (nid: string, value: any) =>
    set((d) => {
      d.playData[nid] = value;
      delete d.playErr[nid];
    });

  const toggleCheck = (nid: string, oid: string, node: FlowNode) => {
    const p = node.props || {};
    let arr = Array.isArray(state.playData[nid]) ? state.playData[nid].slice() : [];
    if (arr.includes(oid)) arr = arr.filter((x: string) => x !== oid);
    else {
      const mx = +p["max-selected-items"];
      if (mx > 0 && arr.length >= mx) {
        toast("Máximo de " + mx + " opções", "warn");
        return;
      }
      arr.push(oid);
    }
    setPlayData(nid, arr);
  };

  const toggleOptin = (nid: string) => setPlayData(nid, !state.playData[nid]);

  const openSheet = (kind: "dropdown" | "calendar", nid: string) => {
    const node = findNode(nid, sc.children);
    if (!node) return;
    const p = node.props || {};
    if (kind === "calendar") {
      const cur =
        (node.type === "CalendarPicker"
          ? (state.playData[nid] || {}).start
          : state.playData[nid]) || "";
      const base = parseISO(cur) ? new Date(cur + "T00:00:00") : new Date();
      set((d) => {
        d.sheet = {
          kind: "calendar",
          nid,
          type: node.type,
          mode: p.mode || "single",
          y: base.getFullYear(),
          m: base.getMonth(),
          range:
            node.type === "CalendarPicker" && p.mode === "range"
              ? { start: (state.playData[nid] || {}).start || "", end: (state.playData[nid] || {}).end || "" }
              : {},
        };
      });
    } else {
      set((d) => {
        d.sheet = { kind: "dropdown", nid };
      });
    }
  };

  const closeSheet = () =>
    set((d) => {
      d.sheet = null;
    });

  return {
    setPlay,
    playRestart,
    playBack,
    doPlayAction,
    footerClick,
    setPlayData,
    toggleCheck,
    toggleOptin,
    openSheet,
    closeSheet,
  };
}
