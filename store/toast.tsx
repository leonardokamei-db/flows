"use client";
// ============================================================
// Toasts — contexto simples
// ============================================================
import React, { createContext, useCallback, useContext, useRef, useState } from "react";

export interface ToastItem {
  id: number;
  msg: string;
  kind: "ok" | "warn";
  leaving?: boolean;
}

interface ToastCtx {
  toasts: ToastItem[];
  toast: (msg: string, kind?: "ok" | "warn") => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((msg: string, kind: "ok" | "warn" = "ok") => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, msg, kind }]);
    // inicia saída após 2s
    setTimeout(() => {
      setToasts((t) => t.map((x) => (x.id === id ? { ...x, leaving: true } : x)));
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 320);
    }, 2000);
  }, []);

  return <Ctx.Provider value={{ toasts, toast }}>{children}</Ctx.Provider>;
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast deve ser usado dentro de <ToastProvider>");
  return ctx;
}
