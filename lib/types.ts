// ============================================================
// Tipos centrais do Flow Studio
// ============================================================

export type NodeProps = Record<string, any>;

/** Um componente/nó dentro de uma tela. */
export interface FlowNode {
  _id: string;
  type: string;
  props: NodeProps;
  /** ramos do If */
  then?: FlowNode[];
  else?: FlowNode[];
  /** casos do Switch */
  cases?: Record<string, FlowNode[]>;
}

/** Uma tela do fluxo. */
export interface Screen {
  _id: string;
  id: string;
  title: string;
  terminal: boolean;
  dataText: string;
  children: FlowNode[];
}

/** O fluxo completo. */
export interface Flow {
  version: string;
  screens: Screen[];
}

/** Ação (on-click-action / on-select-action) no formato interno de edição. */
export interface FlowAction {
  name: string; // navigate | complete | data_exchange | update_data | open_url | none
  next?: string;
  url?: string;
  payload?: PayloadPair[];
}

export interface PayloadPair {
  key: string;
  value: string;
}

export interface OptionItem {
  id: string;
  title: string;
  description?: string;
  metadata?: any;
  enabled?: boolean;
}

/** Seleção atual no editor. */
export type Selection =
  | { kind: "screen" }
  | { kind: "component"; id: string };

export type Mode = "dev" | "ux";
export type NavDir = "fwd" | "back";

/** Estado de uma sobreposição (bottom sheet / calendário) no modo teste. */
export interface SheetState {
  kind: "dropdown" | "calendar";
  nid: string;
  type?: string;
  mode?: string;
  y?: number;
  m?: number;
  range?: { start?: string; end?: string };
}

/** Estado global do editor. */
export interface FlowState {
  flow: Flow;
  currentId: string;
  sel: Selection;
  mode: Mode;
  play: boolean;
  navStack: string[];
  done: boolean;
  playData: Record<string, any>;
  playErr: Record<string, string>;
  navDir: NavDir;
  animScreen: boolean;
  justAdded: string | null;
  sheet: SheetState | null;
  /** contador incrementado a cada (re)início de teste — força remontagem dos campos */
  playEpoch: number;
  // histórico
  undoStack: string[];
  redoStack: string[];
  armed: boolean;
}

/** Definição de um campo editável de um componente (inspector). */
export interface FieldDef {
  key: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "number"
    | "select"
    | "boolean"
    | "lines"
    | "condition"
    | "options"
    | "action"
    | "image";
  req?: boolean;
  max?: number;
  def?: any;
  help?: string;
  placeholder?: string;
  opts?: string[];
  allowed?: string[];
}

/** Definição de um tipo de componente no registro. */
export interface ComponentDef {
  label: string;
  icon: string;
  cat: string;
  desc: string;
  fields: FieldDef[];
  defaults: NodeProps;
  branches?: string[];
  isSwitch?: boolean;
}

export interface ValidationIssue {
  level: "err" | "warn" | "ok";
  title: string;
  msg: string;
  loc?: string;
}
