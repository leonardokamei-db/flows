"use client";
// ============================================================
// Barra do modo UX (Editar / Testar)
// ============================================================
import React from "react";
import { Icon } from "@/lib/icons";
import { useFlow } from "@/store/flowStore";
import { usePlayControls } from "@/store/playControls";

export default function UxBar() {
  const { state } = useFlow();
  const { setPlay, playBack, playRestart } = usePlayControls();
  if (state.mode !== "ux") return null;

  return (
    <div className="ux-bar" style={{ display: "flex" }}>
      <div className="seg">
        <button className={!state.play ? "on" : ""} onClick={() => setPlay(false)}>
          <Icon name="body" size={14} />
          Editar
        </button>
        <button className={state.play ? "on" : ""} onClick={() => setPlay(true)}>
          <Icon name="flag" size={14} />
          Testar
        </button>
      </div>
      {state.play ? (
        <div className="ux-play-ctrls">
          <button className="btn sm" disabled={!state.navStack.length} onClick={playBack}>
            <Icon name="back" size={13} />
            Voltar
          </button>
          <button className="btn sm" onClick={playRestart}>
            <Icon name="redo" size={13} />
            Reiniciar
          </button>
          <span className="ux-testing">
            <Icon name="flag" size={13} />
            Modo teste — preencha os campos, selecione opções e toque nos botões para navegar
          </span>
        </div>
      ) : (
        <span className="ux-tip">
          <b>Editar:</b> clique num item da esquerda para adicioná-lo e clique dentro do celular
          para editar. Use <b>Testar</b> para simular a navegação como o usuário.
        </span>
      )}
    </div>
  );
}
