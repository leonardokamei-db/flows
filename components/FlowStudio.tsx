"use client";
// ============================================================
// Flow Studio — componente raiz (providers + shell + efeitos globais)
// ============================================================
import React, { useEffect, useRef, useState } from "react";
import { FlowProvider, LS_KEY, LS_MODE, LS_THEME, useFlow } from "@/store/flowStore";
import { ToastProvider } from "@/store/toast";
import { UIProvider, useUI } from "@/store/ui";
import { DndProvider } from "@/store/dnd";
import { useOps } from "@/store/ops";
import { usePlayControls } from "@/store/playControls";
import Topbar from "./Topbar";
import Palette from "./Palette";
import Tabs from "./Tabs";
import UxBar from "./UxBar";
import PhoneCanvas from "./PhoneCanvas";
import Inspector from "./Inspector";
import Modals from "./Modals";
import Toasts from "./Toasts";

function AppShell() {
  const { state, dispatch, undo, redo } = useFlow();
  const { deleteNode } = useOps();
  const { closeSheet } = usePlayControls();
  const { modal, closeModal } = useUI();
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // ---- hidratação (localStorage) ----
  useEffect(() => {
    const patch: any = {};
    try {
      const s = localStorage.getItem(LS_KEY);
      if (s) {
        const o = JSON.parse(s);
        if (o.flow && o.flow.screens && o.flow.screens.length) {
          patch.flow = o.flow;
          patch.currentId =
            o.currentId && o.flow.screens.find((x: any) => x._id === o.currentId)
              ? o.currentId
              : o.flow.screens[0]._id;
        }
      }
    } catch {
      /* noop */
    }
    try {
      const md = localStorage.getItem(LS_MODE);
      if (md === "ux" || md === "dev") patch.mode = md;
    } catch {
      /* noop */
    }
    if (Object.keys(patch).length) dispatch({ type: "LOAD", patch });
    try {
      const th = localStorage.getItem(LS_THEME);
      if (th) document.documentElement.setAttribute("data-theme", th);
    } catch {
      /* noop */
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- persistência ----
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({ flow: state.flow, currentId: state.currentId }),
      );
    } catch {
      /* noop */
    }
  }, [state.flow, state.currentId, hydrated]);

  // ---- classes do body (mode-ux / playing) ----
  useEffect(() => {
    const playing = state.mode === "ux" && state.play;
    document.body.classList.toggle("mode-ux", state.mode === "ux");
    document.body.classList.toggle("playing", playing);
  }, [state.mode, state.play]);

  // ---- atalhos de teclado ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.key === "Escape") {
        if (s.sheet) closeSheet();
        else if (modal) closeModal();
        return;
      }
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (mod && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) {
        e.preventDefault();
        redo();
        return;
      }
      const tag = (document.activeElement && document.activeElement.tagName) || "";
      if (
        e.key === "Delete" &&
        s.sel.kind === "component" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(tag)
      ) {
        e.preventDefault();
        deleteNode(s.sel.id);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [undo, redo, deleteNode, closeSheet, closeModal, modal]);

  // Evita divergência de hidratação (ids dinâmicos e dados do localStorage):
  // renderiza um esqueleto estável no servidor/primeiro render e o app após montar.
  if (!hydrated) return <div className="app" />;

  return (
    <div className="app">
      <Topbar />
      <main className="main">
        <Palette />
        <section className="stage">
          <UxBar />
          <Tabs />
          <PhoneCanvas />
        </section>
        <Inspector />
      </main>
      <Modals />
      <Toasts />
    </div>
  );
}

export default function FlowStudio() {
  return (
    <ToastProvider>
      <FlowProvider>
        <UIProvider>
          <DndProvider>
            <AppShell />
          </DndProvider>
        </UIProvider>
      </FlowProvider>
    </ToastProvider>
  );
}
