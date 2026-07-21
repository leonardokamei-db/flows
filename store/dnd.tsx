"use client";
// ============================================================
// Drag & drop — arrastar da paleta e reordenar no canvas
// ============================================================
import React, { createContext, useContext, useMemo, useRef, useState } from "react";
import type { FlowNode } from "@/lib/types";
import { childArrays, findWithParent, getArrayByKey } from "@/lib/tree";
import { makeNode } from "@/lib/seed";
import { ensureUniqueName } from "@/lib/model";
import { useFlow, type Draft } from "./flowStore";

interface DragInfo {
  kind: "new" | "move";
  type?: string;
  id?: string;
}

export interface DropIndicator {
  key: string;
  index: number;
}

interface DndCtx {
  draggingId: string | null;
  indicator: DropIndicator | null;
  onPaletteDragStart: (type: string) => (e: React.DragEvent) => void;
  onNodeDragStart: (id: string) => (e: React.DragEvent) => void;
  onNodeDragEnd: () => void;
  onDropzoneDragOver: (key: string) => (e: React.DragEvent) => void;
  onDropzoneDrop: (key: string) => (e: React.DragEvent) => void;
}

const Ctx = createContext<DndCtx | null>(null);

function arrInNode(node: FlowNode, arr: FlowNode[]): boolean {
  for (const a of childArrays(node)) {
    if (a === arr) return true;
    for (const ch of a) if (arrInNode(ch, arr)) return true;
  }
  return false;
}

/** Índice de inserção (coordenadas do array completo) a partir do cursor. */
function computeIndex(dzEl: HTMLElement, clientY: number): number {
  const items = Array.from(dzEl.querySelectorAll(":scope > [data-node]")) as HTMLElement[];
  for (let i = 0; i < items.length; i++) {
    const r = items[i].getBoundingClientRect();
    if (clientY < r.top + r.height / 2) return i;
  }
  return items.length;
}

export function DndProvider({ children }: { children: React.ReactNode }) {
  const { commit } = useFlow();
  const dragRef = useRef<DragInfo | null>(null);
  const draggedElRef = useRef<HTMLElement | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [indicator, setIndicator] = useState<DropIndicator | null>(null);

  const clear = () => {
    dragRef.current = null;
    draggedElRef.current = null;
    setDraggingId(null);
    setIndicator(null);
  };

  const api = useMemo<DndCtx>(() => {
    return {
      draggingId,
      indicator,
      onPaletteDragStart: (type) => (e) => {
        dragRef.current = { kind: "new", type };
        draggedElRef.current = null;
        try {
          e.dataTransfer.setData("text/plain", "new");
          e.dataTransfer.effectAllowed = "copy";
        } catch {
          /* noop */
        }
      },
      onNodeDragStart: (id) => (e) => {
        e.stopPropagation();
        dragRef.current = { kind: "move", id };
        draggedElRef.current = e.currentTarget as HTMLElement;
        setTimeout(() => setDraggingId(id), 0);
        try {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", "move");
        } catch {
          /* noop */
        }
      },
      onNodeDragEnd: () => clear(),
      onDropzoneDragOver: (key) => (e) => {
        const drag = dragRef.current;
        if (!drag) return;
        const dzEl = e.currentTarget as HTMLElement;
        // não permite soltar dentro da própria subárvore
        if (drag.kind === "move" && draggedElRef.current && draggedElRef.current.contains(dzEl)) {
          setIndicator(null);
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        try {
          e.dataTransfer.dropEffect = drag.kind === "new" ? "copy" : "move";
        } catch {
          /* noop */
        }
        const index = computeIndex(dzEl, e.clientY);
        setIndicator((cur) =>
          cur && cur.key === key && cur.index === index ? cur : { key, index },
        );
      },
      onDropzoneDrop: (key) => (e) => {
        const drag = dragRef.current;
        if (!drag) return;
        e.preventDefault();
        e.stopPropagation();
        const dzEl = e.currentTarget as HTMLElement;
        const index = computeIndex(dzEl, e.clientY);
        const kind = drag.kind;
        const type = drag.type;
        const id = drag.id;
        commit((d: Draft) => {
          const sc = d.flow.screens.find((s) => s._id === d.currentId) || d.flow.screens[0];
          const arr = getArrayByKey(key, sc);
          if (!arr) return;
          if (kind === "new" && type) {
            const n = makeNode(type);
            ensureUniqueName(n, sc.children);
            arr.splice(index, 0, n);
            d.sel = { kind: "component", id: n._id };
            d.justAdded = n._id;
          } else if (kind === "move" && id) {
            const src = findWithParent(id, sc.children);
            if (!src) return;
            if (arrInNode(src.node, arr)) return; // evita mover para dentro de si
            let target = index;
            if (src.arr === arr && src.index < index) target = index - 1;
            const [node] = src.arr.splice(src.index, 1);
            arr.splice(target, 0, node);
            d.sel = { kind: "component", id: node._id };
          }
        });
        clear();
      },
    };
  }, [draggingId, indicator, commit]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useDnd() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDnd deve ser usado dentro de <DndProvider>");
  return ctx;
}
