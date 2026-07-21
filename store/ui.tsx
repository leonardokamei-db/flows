"use client";
// ============================================================
// UI app-level: modais e tema
// ============================================================
import React, { createContext, useCallback, useContext, useState } from "react";
import { LS_THEME } from "./flowStore";

export type ModalKind = "export" | "import" | "validate" | "map" | null;

interface UICtx {
  modal: ModalKind;
  openModal: (k: Exclude<ModalKind, null>) => void;
  closeModal: () => void;
  toggleTheme: () => void;
}

const Ctx = createContext<UICtx | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<ModalKind>(null);

  const openModal = useCallback((k: Exclude<ModalKind, null>) => setModal(k), []);
  const closeModal = useCallback(() => setModal(null), []);

  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    const cur = root.getAttribute("data-theme");
    let next: string;
    if (cur === "dark") next = "light";
    else if (cur === "light") next = "dark";
    else next = matchMedia("(prefers-color-scheme: dark)").matches ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem(LS_THEME, next);
    } catch {
      /* noop */
    }
  }, []);

  return (
    <Ctx.Provider value={{ modal, openModal, closeModal, toggleTheme }}>
      {children}
    </Ctx.Provider>
  );
}

export function useUI() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUI deve ser usado dentro de <UIProvider>");
  return ctx;
}
