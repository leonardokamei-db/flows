"use client";
// ============================================================
// Paleta de componentes
// ============================================================
import React from "react";
import { Icon } from "@/lib/icons";
import { COMPONENTS, PALETTE } from "@/lib/registry";
import { useFlow } from "@/store/flowStore";
import { useOps } from "@/store/ops";
import { useDnd } from "@/store/dnd";

export default function Palette() {
  const { state } = useFlow();
  const { addComponent } = useOps();
  const { onPaletteDragStart } = useDnd();
  const isUX = state.mode === "ux";
  const groups = isUX ? PALETTE.filter((g) => g.group !== "Lógica & Navegação") : PALETTE;

  return (
    <aside className="palette">
      {groups.map((g) => (
        <React.Fragment key={g.group}>
          <div className="palette-hd">{g.group}</div>
          {g.items.map((t) => {
            const d = COMPONENTS[t];
            return (
              <div
                className="pal-item"
                key={t}
                draggable
                data-cat={d.cat}
                onDragStart={onPaletteDragStart(t)}
                onClick={() => addComponent(t)}
              >
                <span className="pal-ico">
                  <Icon name={d.icon} size={17} />
                </span>
                <span className="pal-tx">
                  <b>{d.label}</b>
                  <span>{d.desc}</span>
                </span>
              </div>
            );
          })}
        </React.Fragment>
      ))}
      {isUX ? (
        <div className="pal-hint">
          <b>Como usar:</b> clique num item para adicioná-lo à tela (ou arraste para posicioná-lo).
          Depois clique no item dentro do celular para editar o conteúdo. Para ligar uma tela a
          outra, use um <b>Rodapé (botão)</b> e escolha “Ir para outra tela”. Depois toque em{" "}
          <b>Testar</b> para simular a navegação.
        </div>
      ) : (
        <div className="pal-hint">
          <b>Dica:</b> arraste um componente para dentro do telefone ou clique para adicioná-lo ao
          fim da tela. <b>If</b> e <b>Switch</b> criam ramificações — coloque um <b>Rodapé</b> com
          ação <b>Navegar</b> dentro delas para transições condicionais entre telas.
        </div>
      )}
    </aside>
  );
}
