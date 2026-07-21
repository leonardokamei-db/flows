"use client";
// ============================================================
// Barra superior
// ============================================================
import React from "react";
import { Icon } from "@/lib/icons";
import { useFlow } from "@/store/flowStore";
import { useOps } from "@/store/ops";
import { useUI } from "@/store/ui";

const VERSIONS = ["7.2", "7.1", "7.0", "6.3", "6.2", "6.1", "6.0", "5.1", "5.0", "4.0", "3.1", "3.0"];

export default function Topbar() {
  const { state, set, undo, redo } = useFlow();
  const { setVersion } = useOps();
  const { openModal, toggleTheme } = useUI();
  const isUX = state.mode === "ux";

  const setMode = (m: "dev" | "ux") =>
    set((d) => {
      if (m !== "ux" && m !== "dev") return;
      d.mode = m;
      if (m !== "ux") d.play = false;
      d.sel = { kind: "screen" };
      try {
        localStorage.setItem("flowstudio_mode", m);
      } catch {
        /* noop */
      }
    });

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-logo">
          <Icon name="logo" size={22} />
        </div>
        <div className="brand-txt">
          <b>Flow&nbsp;Studio</b>
          <span>Construtor de WhatsApp Flows</span>
        </div>
      </div>
      <div className="top-sep" />
      <div className="seg mode-seg" title="Alternar entre visão de Desenvolvimento e de UX">
        <button className={!isUX ? "on" : ""} onClick={() => setMode("dev")}>
          Dev
        </button>
        <button className={isUX ? "on" : ""} onClick={() => setMode("ux")}>
          UX
        </button>
      </div>
      <div className="top-sep" />
      <div className="ver-wrap" title="Versão do Flow JSON">
        <span>Flow JSON</span>
        <select value={state.flow.version} onChange={(e) => setVersion(e.target.value)}>
          {VERSIONS.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </div>
      <div className="top-spacer" />
      <button
        className="btn icon"
        title="Desfazer (Ctrl+Z)"
        disabled={!state.undoStack.length}
        onClick={undo}
      >
        <Icon name="undo" size={17} />
      </button>
      <button
        className="btn icon"
        title="Refazer (Ctrl+Y)"
        disabled={!state.redoStack.length}
        onClick={redo}
      >
        <Icon name="redo" size={17} />
      </button>
      <div className="top-sep" />
      <button className="btn" title="Mapa de fluxo" onClick={() => openModal("map")}>
        <Icon name="map" size={16} />
        <span className="blabel">Mapa de fluxo</span>
      </button>
      <button className="btn" title="Validar" onClick={() => openModal("validate")}>
        <Icon name="check" size={16} />
        <span className="blabel">Validar</span>
      </button>
      <button className="btn" title="Importar" onClick={() => openModal("import")}>
        <Icon name="import" size={16} />
        <span className="blabel">Importar</span>
      </button>
      <button className="btn primary" title="Exportar JSON" onClick={() => openModal("export")}>
        <Icon name="export" size={16} />
        <span className="blabel">Exportar JSON</span>
      </button>
      <button className="btn icon ghost" title="Alternar tema" onClick={toggleTheme}>
        <Icon name="sun" size={18} />
      </button>
    </header>
  );
}
