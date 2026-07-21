"use client";
// ============================================================
// Preview estático de um componente (modo edição)
// ============================================================
import React from "react";
import type { FlowNode, OptionItem } from "@/lib/types";
import { Icon } from "@/lib/icons";
import { mdInline, renderRich } from "@/lib/markdown";
import { actionSummary } from "@/lib/registry";

const IN_PH: Record<string, string> = {
  email: "exemplo@email.com",
  phone: "+55 (11) 90000-0000",
  number: "0",
  password: "••••••••",
  passcode: "0000",
};

function OptList({ node, round }: { node: FlowNode; round: boolean }) {
  const ds: OptionItem[] = node.props["data-source"] || [];
  if (!ds.length)
    return <div className="dz-empty small">Sem opções — adicione no painel</div>;
  return (
    <div className="wa-optlist">
      {ds.slice(0, 8).map((o, i) => (
        <div className="wa-opt" key={i}>
          <span className={"box " + (round ? "round" : "") + (i === 0 ? " on" : "")} />
          <span className="t">
            <b>{o.title || "Opção"}</b>
            {o.description ? <span>{o.description}</span> : null}
          </span>
        </div>
      ))}
      {ds.length > 8 ? (
        <div className="wa-cap" style={{ padding: "6px 2px" }}>
          + {ds.length - 8} opções
        </div>
      ) : null}
    </div>
  );
}

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <label className="wa-label">
      {text}
      {required ? " *" : ""}
    </label>
  );
}

export default function ComponentPreview({ node }: { node: FlowNode }) {
  const p = node.props || {};
  switch (node.type) {
    case "TextHeading":
      return <div className="wa-h1">{p.text || "Título"}</div>;
    case "TextSubheading":
      return <div className="wa-h2">{p.text || "Subtítulo"}</div>;
    case "TextBody": {
      const fw = String(p["font-weight"] || "");
      const style: React.CSSProperties = {
        fontWeight: fw.includes("bold") ? 700 : 400,
        ...(fw.includes("italic") ? { fontStyle: "italic" } : {}),
      };
      const cls = "wa-body-t" + (p.strikethrough ? " wa-strike" : "");
      return p.markdown ? (
        <div className={cls} style={style} dangerouslySetInnerHTML={{ __html: mdInline(p.text || "") }} />
      ) : (
        <div className={cls} style={style}>
          {p.text || "Corpo"}
        </div>
      );
    }
    case "TextCaption": {
      const cls = "wa-cap" + (p.strikethrough ? " wa-strike" : "");
      return p.markdown ? (
        <div className={cls} dangerouslySetInnerHTML={{ __html: mdInline(p.text || "") }} />
      ) : (
        <div className={cls}>{p.text || "Legenda"}</div>
      );
    }
    case "RichText":
      return <div className="wa-rich" dangerouslySetInnerHTML={{ __html: renderRich(p.text) }} />;
    case "TextInput":
      return (
        <>
          <Label text={p.label || "Rótulo"} required={p.required} />
          <div className="wa-field">
            {p["helper-text"] || IN_PH[p["input-type"]] || "Digite aqui…"}
          </div>
          {p["helper-text"] ? <div className="wa-help">{p["helper-text"]}</div> : null}
        </>
      );
    case "TextArea":
      return (
        <>
          <Label text={p.label || "Rótulo"} required={p.required} />
          <div className="wa-field area">{p["helper-text"] || "Escreva sua mensagem…"}</div>
        </>
      );
    case "DatePicker":
      return (
        <>
          <Label text={p.label || "Data"} />
          <div className="wa-field">
            <span>DD / MM / AAAA</span>
            <Icon name="date" size={18} />
          </div>
        </>
      );
    case "CalendarPicker":
      return (
        <>
          <Label text={p.label || "Calendário"} />
          <div className="wa-field">
            <span>{p.mode === "range" ? "Início – Fim" : "Selecionar data"}</span>
            <Icon name="calendar" size={18} />
          </div>
        </>
      );
    case "CheckboxGroup":
      return (
        <>
          <Label text={p.label || "Rótulo"} />
          <OptList node={node} round={false} />
        </>
      );
    case "RadioButtonsGroup":
      return (
        <>
          <Label text={p.label || "Rótulo"} />
          <OptList node={node} round={true} />
        </>
      );
    case "Dropdown": {
      const ds: OptionItem[] = p["data-source"] || [];
      return (
        <>
          <Label text={p.label || "Rótulo"} />
          <div className="wa-field">
            <span>{(ds[0] && ds[0].title) || "Escolha…"}</span>
            <Icon name="dropdown" size={18} />
          </div>
        </>
      );
    }
    case "Footer": {
      const a = p["on-click-action"] || {};
      const cap =
        p["center-caption"] ||
        (p["left-caption"] || p["right-caption"]
          ? (p["left-caption"] || "") + " · " + (p["right-caption"] || "")
          : "");
      return (
        <>
          {cap ? (
            <div className="wa-cap" style={{ textAlign: "center", marginBottom: 8 }}>
              {cap}
            </div>
          ) : null}
          <div className="wa-cta">{p.label || "Continuar"}</div>
          <div
            className="wa-cap"
            style={{ textAlign: "center", marginTop: 6 }}
            dangerouslySetInnerHTML={{ __html: actionSummary(a) }}
          />
        </>
      );
    }
    case "EmbeddedLink":
      return (
        <>
          <span className="wa-link">
            <Icon name="link" size={15} />
            {p.text || "Link"}
          </span>
          <div
            className="wa-cap"
            style={{ marginTop: 5 }}
            dangerouslySetInnerHTML={{ __html: actionSummary(p["on-click-action"] || {}) }}
          />
        </>
      );
    case "OptIn":
      return (
        <div className="wa-opt" style={{ paddingLeft: 0 }}>
          <span className="box" />
          <span className="t">
            <b style={{ fontWeight: 400 }}>{p.label || "Aceito os termos"}</b>
          </span>
        </div>
      );
    case "Image": {
      const h = p.height ? p.height + "px" : "150px";
      return (
        <div className="wa-img" style={{ height: h }}>
          {p.src ? (
            <img
              src={p.src}
              alt={p["alt-text"] || ""}
              style={{ height: "100%", objectFit: p["scale-type"] === "cover" ? "cover" : "contain" }}
            />
          ) : (
            <>
              <Icon name="image" size={30} />
              <span style={{ marginTop: 6, fontSize: 11 }}>Imagem (base64)</span>
            </>
          )}
        </div>
      );
    }
    default:
      return null;
  }
}
