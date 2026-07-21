"use client";
// ============================================================
// Canvas do modo Testar — componentes interativos
// ============================================================
import React, { useEffect } from "react";
import type { FlowNode, OptionItem } from "@/lib/types";
import { Icon } from "@/lib/icons";
import { fmtBR } from "@/lib/calendar";
import { buildFormMap, flattenPlay } from "@/lib/play";
import { useFlow, screenOf } from "@/store/flowStore";
import { usePlayControls } from "@/store/playControls";
import AutoTextarea from "./AutoTextarea";
import ComponentPreview from "./ComponentPreview";

const INPUT_TYPE: Record<string, string> = {
  text: "text",
  number: "number",
  email: "email",
  password: "password",
  passcode: "password",
  phone: "tel",
};
const IN_PH: Record<string, string> = {
  email: "exemplo@email.com",
  phone: "+55 (11) 90000-0000",
  number: "0",
  password: "••••••••",
  passcode: "0000",
};

function PlayNode({ node }: { node: FlowNode }) {
  const { state } = useFlow();
  const { setPlayData, toggleCheck, toggleOptin, openSheet, doPlayAction, footerClick } =
    usePlayControls();
  const p = node.props || {};
  const nid = node._id;
  const err = state.playErr[nid];
  const playData = state.playData;

  const lab = (
    <label className="wa-label">
      {p.label || ""}
      {p.required ? " *" : ""}
    </label>
  );
  const help = p["helper-text"] ? <div className="wa-help">{p["helper-text"]}</div> : null;
  const errH = err ? (
    <div className="wa-err">
      <Icon name="warn" size={12} />
      {err}
    </div>
  ) : null;
  const dis = p.enabled === false;

  let inner: React.ReactNode = null;
  let navClickable = false;

  switch (node.type) {
    case "TextInput": {
      const t = INPUT_TYPE[p["input-type"]] || "text";
      const ph = IN_PH[p["input-type"]] || "Digite aqui…";
      const v = playData[nid] != null ? playData[nid] : "";
      inner = (
        <>
          {lab}
          <input
            className="wa-inp-real"
            type={t}
            maxLength={+p["max-chars"] || 80}
            placeholder={ph}
            value={v}
            onChange={(e) => setPlayData(nid, e.target.value)}
          />
          {help}
          {errH}
        </>
      );
      break;
    }
    case "TextArea": {
      const v = playData[nid] != null ? playData[nid] : "";
      inner = (
        <>
          {lab}
          <AutoTextarea
            className="wa-inp-real area"
            maxLength={+p["max-length"] || 600}
            placeholder="Escreva sua mensagem…"
            disabled={dis}
            value={v}
            onChange={(e) => setPlayData(nid, e.target.value)}
          />
          {help}
          {errH}
        </>
      );
      break;
    }
    case "DatePicker": {
      const v = playData[nid] || "";
      const shown = v ? fmtBR(v) : "";
      inner = (
        <>
          {lab}
          <div
            className="wa-field wa-tapfield"
            style={dis ? { opacity: 0.55, pointerEvents: "none" } : undefined}
            onClick={() => openSheet("calendar", nid)}
          >
            <span className={"val" + (shown ? "" : " ph")}>{shown || "DD / MM / AAAA"}</span>
            <Icon name="date" size={18} />
          </div>
          {help}
          {errH}
        </>
      );
      break;
    }
    case "CalendarPicker": {
      const v = playData[nid] || {};
      let shown = "";
      if (p.mode === "range")
        shown =
          v.start || v.end
            ? (v.start ? fmtBR(v.start) : "…") + " – " + (v.end ? fmtBR(v.end) : "…")
            : "";
      else shown = v.start ? fmtBR(v.start) : "";
      const ph = p.mode === "range" ? "Início – Fim" : "Selecionar data";
      inner = (
        <>
          {lab}
          <div className="wa-field wa-tapfield" onClick={() => openSheet("calendar", nid)}>
            <span className={"val" + (shown ? "" : " ph")}>{shown || ph}</span>
            <Icon name="calendar" size={18} />
          </div>
          {help}
          {errH}
        </>
      );
      break;
    }
    case "Dropdown": {
      const v = playData[nid] || "";
      const ds: OptionItem[] = p["data-source"] || [];
      const selOpt = ds.find((o) => o.id === v);
      const shown = selOpt ? selOpt.title || "" : "";
      inner = (
        <>
          {lab}
          <div
            className="wa-field wa-tapfield"
            style={dis ? { opacity: 0.55, pointerEvents: "none" } : undefined}
            onClick={() => openSheet("dropdown", nid)}
          >
            <span className={"val" + (shown ? "" : " ph")}>{shown || "Selecione…"}</span>
            <Icon name="dropdown" size={18} />
          </div>
          {errH}
        </>
      );
      break;
    }
    case "CheckboxGroup":
    case "RadioButtonsGroup": {
      const radio = node.type === "RadioButtonsGroup";
      const ds: OptionItem[] = p["data-source"] || [];
      const val = playData[nid];
      inner = (
        <>
          {lab}
          {p.description ? (
            <div className="wa-cap" style={{ margin: "-2px 0 4px" }}>
              {p.description}
            </div>
          ) : null}
          <div className="wa-optlist">
            {ds.map((o) => {
              const on = radio ? val === o.id : Array.isArray(val) && val.includes(o.id);
              return (
                <div
                  className="wa-opt tap"
                  key={o.id}
                  onClick={() => (radio ? setPlayData(nid, o.id) : toggleCheck(nid, o.id, node))}
                >
                  <span className={"box " + (radio ? "round " : "") + (on ? "on" : "")}>
                    {on ? (
                      radio ? (
                        <span className="dot" />
                      ) : (
                        <span className="ck">
                          <Icon name="check" size={12} />
                        </span>
                      )
                    ) : null}
                  </span>
                  <span className="t">
                    <b>{o.title || ""}</b>
                    {o.description ? <span>{o.description}</span> : null}
                  </span>
                </div>
              );
            })}
          </div>
          {errH}
        </>
      );
      break;
    }
    case "OptIn": {
      const on = !!playData[nid];
      const a = p["on-click-action"];
      inner = (
        <>
          <div className="wa-opt tap" style={{ paddingLeft: 2 }} onClick={() => toggleOptin(nid)}>
            <span className={"box " + (on ? "on" : "")}>
              {on ? (
                <span className="ck">
                  <Icon name="check" size={12} />
                </span>
              ) : null}
            </span>
            <span className="t">
              <b style={{ fontWeight: 400 }}>
                {p.label || ""}
                {p.required ? " *" : ""}
              </b>
              {a && a.name && a.name !== "none" ? (
                <span
                  className="wa-link"
                  style={{ fontSize: "12.5px", marginTop: 2 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    doPlayAction(a);
                  }}
                >
                  Saiba mais
                </span>
              ) : null}
            </span>
          </div>
          {errH}
        </>
      );
      break;
    }
    case "Footer": {
      const cap =
        p["center-caption"] ||
        (p["left-caption"] || p["right-caption"]
          ? (p["left-caption"] || "") + " · " + (p["right-caption"] || "")
          : "");
      navClickable = true;
      inner = (
        <>
          {cap ? (
            <div className="wa-cap" style={{ textAlign: "center", marginBottom: 8 }}>
              {cap}
            </div>
          ) : null}
          <div className="wa-cta">{p.label || "Continuar"}</div>
        </>
      );
      break;
    }
    case "EmbeddedLink": {
      navClickable = true;
      inner = (
        <span className="wa-link">
          <Icon name="link" size={15} />
          {p.text || "Link"}
        </span>
      );
      break;
    }
    default:
      inner = <ComponentPreview node={node} />;
  }

  const hasAction = ["on-click-action", "on-select-action"].some((k) => {
    const a = p[k];
    return a && a.name && a.name !== "none";
  });
  const isNav = navClickable && hasAction;

  return (
    <div
      className={"cnode play" + (err ? " perr" : "")}
      data-node={nid}
      data-playnav={isNav ? "1" : undefined}
      style={p.visible === false ? { display: "none" } : undefined}
      onClick={isNav ? () => footerClick(node) : undefined}
    >
      <div className="cnode-inner">{inner}</div>
    </div>
  );
}

export default function PlayCanvas() {
  const { state, set } = useFlow();
  const sc = screenOf(state);
  const form = buildFormMap(state.flow, state.playData);

  useEffect(() => {
    if (!state.animScreen) return;
    const t = setTimeout(() => set((d) => (d.animScreen = false)), 760);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.animScreen, state.currentId, state.playEpoch]);

  let inner: React.ReactNode;
  if (state.done) {
    inner = (
      <div className="play-done">
        <div className="pd-ic">
          <Icon name="check" size={32} />
        </div>
        <b>Fluxo concluído!</b>
        <span>O usuário chegou ao fim do fluxo.</span>
        <RestartButton />
      </div>
    );
  } else {
    const list = flattenPlay(sc.children, form);
    inner = list.length ? (
      list.map((n) => <PlayNode node={n} key={n._id} />)
    ) : (
      <div className="dz-empty">Esta tela está vazia.</div>
    );
  }

  const animCls = state.animScreen
    ? " anim" + (state.navDir === "back" ? " nav-back" : " nav-fwd")
    : "";

  return (
    <div className={"play-wrap" + animCls} key={state.playEpoch + "-" + state.currentId}>
      {inner}
    </div>
  );
}

function RestartButton() {
  const { playRestart } = usePlayControls();
  return (
    <button className="btn primary" onClick={playRestart}>
      <Icon name="redo" size={15} />
      Reiniciar teste
    </button>
  );
}
