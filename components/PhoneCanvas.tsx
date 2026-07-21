"use client";
// ============================================================
// Telefone: cabeçalho WhatsApp + corpo (edição/teste) + overlay
// ============================================================
import React from "react";
import { Icon } from "@/lib/icons";
import { useFlow, screenOf } from "@/store/flowStore";
import { useOps } from "@/store/ops";
import { usePlayControls } from "@/store/playControls";
import { Dropzone } from "./CanvasNode";
import PlayCanvas from "./PlayCanvas";
import Overlay from "./Overlay";

export default function PhoneCanvas() {
  const { state } = useFlow();
  const { selectScreen } = useOps();
  const { playBack, closeSheet } = usePlayControls();
  const sc = screenOf(state);
  const isUX = state.mode === "ux";
  const playing = isUX && state.play;

  const sub = isUX
    ? sc.terminal
      ? "tela final"
      : ""
    : sc.id + (sc.terminal ? " · final" : "");

  const backClick = () => {
    if (state.sheet) {
      closeSheet();
      return;
    }
    if (playing) playBack();
  };

  return (
    <div className="canvas-scroll">
      <div className="phone">
        <div className="phone-screen">
          <div className="wa-head">
            <span
              className="wa-back"
              onClick={backClick}
              style={playing ? { cursor: "pointer" } : undefined}
            >
              <Icon name="back" size={20} />
            </span>
            <div className="wa-title">
              <b>{sc.title || sc.id}</b>
              <span>{sub}</span>
            </div>
            <span>
              {sc.terminal ? (
                <span className="term-badge">
                  <Icon name="flag" size={10} />
                  FINAL
                </span>
              ) : (
                <Icon name="dots" size={20} />
              )}
            </span>
          </div>
          <div
            className="wa-body"
            id="waCanvasRoot"
            onClick={!playing ? () => selectScreen() : undefined}
          >
            {playing ? (
              <PlayCanvas />
            ) : (
              <Dropzone arrKey={"s|" + sc._id} nodes={sc.children} root />
            )}
          </div>
          <Overlay />
        </div>
      </div>
    </div>
  );
}
