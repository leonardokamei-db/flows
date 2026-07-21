"use client";
// ============================================================
// Abas de telas
// ============================================================
import React from "react";
import { Icon } from "@/lib/icons";
import { useFlow } from "@/store/flowStore";
import { useOps } from "@/store/ops";

export default function Tabs() {
  const { state } = useFlow();
  const { setCurrent, addScreen } = useOps();

  return (
    <div className="tabs">
      {state.flow.screens.map((s, i) => {
        const cls =
          "tab" +
          (s._id === state.currentId ? " active" : "") +
          (i === 0 ? " start" : "") +
          (s.terminal ? " term" : "");
        return (
          <button className={cls} key={s._id} onClick={() => setCurrent(s._id)}>
            <span className="tdot" />
            <span className="tname">{s.title || s.id}</span>
          </button>
        );
      })}
      <button className="tab-add" title="Adicionar tela" onClick={addScreen}>
        <Icon name="plus" size={18} />
      </button>
    </div>
  );
}
