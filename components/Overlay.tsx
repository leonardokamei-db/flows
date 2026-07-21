"use client";
// ============================================================
// Sobreposição estilo WhatsApp — bottom sheet (lista) e calendário
// ============================================================
import React from "react";
import type { OptionItem, SheetState } from "@/lib/types";
import { Icon } from "@/lib/icons";
import { DOW_BR, MONTHS_BR, fmtBR, isoOf, withinBounds } from "@/lib/calendar";
import { findNode } from "@/lib/tree";
import { useFlow, screenOf } from "@/store/flowStore";
import { usePlayControls } from "@/store/playControls";

export default function Overlay() {
  const { state, set } = useFlow();
  const { closeSheet } = usePlayControls();
  const playing = state.mode === "ux" && state.play;
  const s = state.sheet;

  if (!s || !playing || state.done) return <div className="wa-overlay" />;
  const sc = screenOf(state);
  const node = findNode(s.nid, sc.children);
  if (!node) return <div className="wa-overlay" />;
  const p = node.props || {};

  const selectDropdownOpt = (oid: string) =>
    set((d) => {
      d.playData[s.nid] = oid;
      delete d.playErr[s.nid];
      d.sheet = null;
    });

  const navMonth = (delta: number) =>
    set((d) => {
      if (!d.sheet) return;
      let m = (d.sheet.m || 0) + delta;
      let y = d.sheet.y || 0;
      if (m < 0) {
        m = 11;
        y--;
      }
      if (m > 11) {
        m = 0;
        y++;
      }
      d.sheet.m = m;
      d.sheet.y = y;
    });

  const pickDay = (iso: string) =>
    set((d) => {
      if (!d.sheet) return;
      const sheet = d.sheet;
      if (sheet.mode === "range") {
        const r = sheet.range || {};
        if (!r.start || r.end) {
          sheet.range = { start: iso, end: "" };
          return;
        }
        if (iso < r.start) {
          sheet.range = { start: iso, end: "" };
          return;
        }
        d.playData[s.nid] = { start: r.start, end: iso };
        delete d.playErr[s.nid];
        d.sheet = null;
        return;
      }
      if (sheet.type === "CalendarPicker") d.playData[s.nid] = { start: iso };
      else d.playData[s.nid] = iso;
      delete d.playErr[s.nid];
      d.sheet = null;
    });

  let body: React.ReactNode;
  if (s.kind === "dropdown") {
    const ds: OptionItem[] = p["data-source"] || [];
    const cur = state.playData[s.nid] || "";
    body = (
      <div className="wa-sheet">
        <div className="wa-sheet-hd">
          <b>{p.label || "Selecione"}</b>
          <button className="wa-sheet-close" onClick={closeSheet}>
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="wa-sheet-list">
          {ds.length ? (
            ds.map((o) => (
              <div
                key={o.id}
                className={
                  "wa-sheet-opt" +
                  (cur === o.id ? " on" : "") +
                  (o.enabled === false ? " disabled" : "")
                }
                onClick={() => o.enabled !== false && selectDropdownOpt(o.id)}
              >
                <span className="radio" />
                <span className="ot">
                  <b>{o.title || ""}</b>
                  {o.description ? <span>{o.description}</span> : null}
                </span>
              </div>
            ))
          ) : (
            <div className="wa-sheet-opt disabled">
              <span className="ot">
                <b>Sem opções</b>
              </span>
            </div>
          )}
        </div>
      </div>
    );
  } else {
    body = (
      <div className="wa-sheet">
        <div className="wa-sheet-hd">
          <b>{p.title || p.label || "Selecionar data"}</b>
          <button className="wa-sheet-close" onClick={closeSheet}>
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="wa-cal">
          <CalBody sheet={s} p={p} playData={state.playData} onNav={navMonth} onPick={pickDay} />
        </div>
      </div>
    );
  }

  return (
    <div className="wa-overlay open">
      <div className="wa-scrim" onClick={closeSheet} />
      {body}
    </div>
  );
}

function CalBody({
  sheet,
  p,
  playData,
  onNav,
  onPick,
}: {
  sheet: SheetState;
  p: any;
  playData: Record<string, any>;
  onNav: (delta: number) => void;
  onPick: (iso: string) => void;
}) {
  const y = sheet.y || 0;
  const m = sheet.m || 0;
  const startDow = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const now = new Date();
  const todayIso = isoOf(now.getFullYear(), now.getMonth(), now.getDate());
  const range = sheet.range || {};
  const selStart =
    sheet.mode === "range"
      ? range.start
      : sheet.type === "CalendarPicker"
        ? (playData[sheet.nid] || {}).start
        : playData[sheet.nid];
  const selEnd = sheet.mode === "range" ? range.end : "";

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < startDow; i++)
    cells.push(<div className="wa-cal-day blank" key={"b" + i} />);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = isoOf(y, m, d);
    let cls = "wa-cal-day";
    const disabled = !withinBounds(iso, p["min-date"], p["max-date"]);
    if (disabled) cls += " disabled";
    if (iso === todayIso) cls += " today";
    if ((selStart && iso === selStart) || (selEnd && iso === selEnd)) cls += " on";
    else if (sheet.mode === "range" && selStart && selEnd && iso > selStart && iso < selEnd)
      cls += " range";
    cells.push(
      <div className={cls} key={iso} onClick={() => !disabled && onPick(iso)}>
        {d}
      </div>,
    );
  }

  const foot =
    sheet.mode === "range" ? (
      <div className="wa-cal-foot">
        <span className="hint">
          {range.start
            ? "Início: " +
              fmtBR(range.start) +
              (range.end ? " · Fim: " + fmtBR(range.end) : " — escolha o fim")
            : "Toque na data inicial"}
        </span>
      </div>
    ) : null;

  return (
    <>
      <div className="wa-cal-nav">
        <button onClick={() => onNav(-1)} title="Mês anterior">
          <Icon name="back" size={18} />
        </button>
        <b>
          {MONTHS_BR[m]} {y}
        </b>
        <button onClick={() => onNav(1)} title="Próximo mês">
          <Icon name="redo" size={18} />
        </button>
      </div>
      <div className="wa-cal-grid">
        {DOW_BR.map((d, i) => (
          <div className="wa-cal-dow" key={i}>
            {d}
          </div>
        ))}
        {cells}
      </div>
      {foot}
    </>
  );
}
