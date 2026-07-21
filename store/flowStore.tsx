"use client";
// ============================================================
// Store do Flow Studio — reducer + contexto + undo/redo
// ============================================================
import React, {
  createContext,
  useContext,
  useMemo,
  useReducer,
  useRef,
} from "react";
import type { FlowNode, FlowState, Mode, Screen, Selection, SheetState } from "@/lib/types";
import { buildSeed } from "@/lib/seed";
import { clone } from "@/lib/utils";
import { findNode } from "@/lib/tree";

export const LS_KEY = "flowstudio_v1";
export const LS_MODE = "flowstudio_mode";
export const LS_THEME = "flowstudio_theme";

// ---------------- estado inicial ----------------
export function initialState(): FlowState {
  const flow = buildSeed();
  return {
    flow,
    currentId: flow.screens[0]._id,
    sel: { kind: "screen" },
    mode: "dev",
    play: false,
    navStack: [],
    done: false,
    playData: {},
    playErr: {},
    navDir: "fwd",
    animScreen: false,
    justAdded: null,
    sheet: null,
    playEpoch: 0,
    undoStack: [],
    redoStack: [],
    armed: false,
  };
}

// ---------------- draft mutável ----------------
export interface Draft {
  flow: FlowState["flow"];
  currentId: string;
  sel: Selection;
  mode: Mode;
  play: boolean;
  navStack: string[];
  done: boolean;
  playData: Record<string, any>;
  playErr: Record<string, string>;
  navDir: FlowState["navDir"];
  animScreen: boolean;
  justAdded: string | null;
  sheet: SheetState | null;
  playEpoch: number;
}

function makeDraft(s: FlowState): Draft {
  return {
    flow: clone(s.flow),
    currentId: s.currentId,
    sel: clone(s.sel),
    mode: s.mode,
    play: s.play,
    navStack: s.navStack.slice(),
    done: s.done,
    playData: clone(s.playData),
    playErr: clone(s.playErr),
    navDir: s.navDir,
    animScreen: s.animScreen,
    justAdded: s.justAdded,
    sheet: clone(s.sheet),
    playEpoch: s.playEpoch,
  };
}

function snapshot(s: { flow: FlowState["flow"]; currentId: string }): string {
  return JSON.stringify({ flow: s.flow, currentId: s.currentId });
}

// ---------------- ações ----------------
export type Action =
  | { type: "SET"; mutate: (d: Draft) => void }
  | { type: "COMMIT"; record: "always" | "armed"; mutate: (d: Draft) => void }
  | { type: "ARM" }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "LOAD"; patch: Partial<FlowState> };

export function reducer(state: FlowState, action: Action): FlowState {
  switch (action.type) {
    case "SET": {
      const d = makeDraft(state);
      action.mutate(d);
      return { ...state, ...d };
    }
    case "COMMIT": {
      const shouldRecord =
        action.record === "always" || (action.record === "armed" && state.armed);
      const undoStack = shouldRecord
        ? (() => {
            const st = state.undoStack.slice();
            st.push(snapshot(state));
            if (st.length > 120) st.shift();
            return st;
          })()
        : state.undoStack;
      const redoStack = shouldRecord ? [] : state.redoStack;
      const armed = action.record === "armed" ? false : state.armed;
      const d = makeDraft(state);
      action.mutate(d);
      return { ...state, ...d, undoStack, redoStack, armed };
    }
    case "ARM":
      return state.armed ? state : { ...state, armed: true };
    case "UNDO": {
      if (!state.undoStack.length) return state;
      const undoStack = state.undoStack.slice();
      const redoStack = state.redoStack.slice();
      redoStack.push(snapshot(state));
      const snap = JSON.parse(undoStack.pop() as string);
      const flow = snap.flow;
      let currentId = snap.currentId;
      if (!flow.screens.find((s: Screen) => s._id === currentId))
        currentId = flow.screens[0] && flow.screens[0]._id;
      return { ...state, flow, currentId, sel: { kind: "screen" }, undoStack, redoStack };
    }
    case "REDO": {
      if (!state.redoStack.length) return state;
      const undoStack = state.undoStack.slice();
      const redoStack = state.redoStack.slice();
      undoStack.push(snapshot(state));
      const snap = JSON.parse(redoStack.pop() as string);
      const flow = snap.flow;
      let currentId = snap.currentId;
      if (!flow.screens.find((s: Screen) => s._id === currentId))
        currentId = flow.screens[0] && flow.screens[0]._id;
      return { ...state, flow, currentId, sel: { kind: "screen" }, undoStack, redoStack };
    }
    case "LOAD":
      return { ...state, ...action.patch };
    default:
      return state;
  }
}

// ---------------- contexto ----------------
interface FlowContextValue {
  state: FlowState;
  dispatch: React.Dispatch<Action>;
  /** muta o fluxo registrando histórico (equivalente ao commit() original) */
  commit: (mutate: (d: Draft) => void) => void;
  /** edição contínua (registra undo apenas na primeira alteração após foco) */
  editArmed: (mutate: (d: Draft) => void) => void;
  /** muta o estado sem registrar histórico (seleção, teste, sheet) */
  set: (mutate: (d: Draft) => void) => void;
  arm: () => void;
  undo: () => void;
  redo: () => void;
  currentScreen: () => Screen;
  findNode: (id: string) => FlowNode | null;
}

const FlowContext = createContext<FlowContextValue | null>(null);

export function FlowProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const api = useMemo<FlowContextValue>(
    () => ({
      state,
      dispatch,
      commit: (mutate) => dispatch({ type: "COMMIT", record: "always", mutate }),
      editArmed: (mutate) => dispatch({ type: "COMMIT", record: "armed", mutate }),
      set: (mutate) => dispatch({ type: "SET", mutate }),
      arm: () => dispatch({ type: "ARM" }),
      undo: () => dispatch({ type: "UNDO" }),
      redo: () => dispatch({ type: "REDO" }),
      currentScreen: () => {
        const s = stateRef.current;
        return s.flow.screens.find((x) => x._id === s.currentId) || s.flow.screens[0];
      },
      findNode: (id: string) => {
        const s = stateRef.current;
        const sc = s.flow.screens.find((x) => x._id === s.currentId) || s.flow.screens[0];
        return findNode(id, sc.children);
      },
    }),
    [state],
  );

  return <FlowContext.Provider value={api}>{children}</FlowContext.Provider>;
}

export function useFlow(): FlowContextValue {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error("useFlow deve ser usado dentro de <FlowProvider>");
  return ctx;
}

/** Helper para obter a tela atual a partir de um estado. */
export function screenOf(state: FlowState): Screen {
  return state.flow.screens.find((x) => x._id === state.currentId) || state.flow.screens[0];
}
