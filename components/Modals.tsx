"use client";
// ============================================================
// Modais: Exportar, Importar, Validar e Mapa de fluxo
// ============================================================
import React, { useLayoutEffect, useRef, useState } from "react";
import { Icon } from "@/lib/icons";
import { buildFlowJSON, serializeScreen } from "@/lib/serialize";
import { validateFlow } from "@/lib/validate";
import { walk } from "@/lib/tree";
import { copyText, downloadJSON, jsonHi } from "@/lib/format";
import { useFlow, screenOf } from "@/store/flowStore";
import { useOps } from "@/store/ops";
import { useUI } from "@/store/ui";
import { useToast } from "@/store/toast";

function ModalShell({
  icon,
  title,
  subtitle,
  wide,
  children,
  footer,
  onClose,
}: {
  icon: string;
  title: string;
  subtitle: string;
  wide?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="backdrop open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={"modal" + (wide ? " wide" : "")}>
        <div className="modal-hd">
          <span className="mi">
            <Icon name={icon} size={18} />
          </span>
          <div className="mt">
            <b>{title}</b>
            <span>{subtitle}</span>
          </div>
          <button className="btn icon ghost" onClick={onClose}>
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}

function ExportModal() {
  const { state } = useFlow();
  const { closeModal } = useUI();
  const { toast } = useToast();
  const [tab, setTab] = useState<"full" | "one">("full");

  const obj = tab === "full" ? buildFlowJSON(state.flow) : serializeScreen(screenOf(state));
  const str = JSON.stringify(obj, null, 2);

  return (
    <ModalShell
      icon="export"
      title="Exportar Flow JSON"
      subtitle="Pronto para colar no WhatsApp Flows Playground"
      onClose={closeModal}
      footer={
        <>
          <button
            className="btn"
            onClick={() =>
              downloadJSON(str, (tab === "full" ? "flow" : screenOf(state).id) + ".json")
                ? toast("Download iniciado")
                : toast("Não foi possível baixar — use Copiar", "warn")
            }
          >
            <Icon name="import" size={15} />
            Baixar .json
          </button>
          <button
            className="btn primary"
            onClick={() =>
              copyText(
                str,
                () => toast("Copiado!"),
                () => toast("Copie manualmente", "warn"),
              )
            }
          >
            <Icon name="copy" size={15} />
            Copiar JSON
          </button>
        </>
      }
    >
      <div style={{ marginBottom: 12 }}>
        <div className="seg">
          <button className={tab === "full" ? "on" : ""} onClick={() => setTab("full")}>
            Fluxo completo · {state.flow.screens.length} telas
          </button>
          <button className={tab === "one" ? "on" : ""} onClick={() => setTab("one")}>
            Somente tela atual
          </button>
        </div>
      </div>
      <pre className="code" dangerouslySetInnerHTML={{ __html: jsonHi(str) }} />
    </ModalShell>
  );
}

function ImportModal() {
  const { closeModal } = useUI();
  const { importFlowJSON } = useOps();
  const { toast } = useToast();
  const [text, setText] = useState("");

  const load = () => {
    let obj: any;
    try {
      obj = JSON.parse(text);
    } catch (e: any) {
      toast("JSON inválido: " + e.message, "warn");
      return;
    }
    if (!obj || !obj.screens) {
      toast('JSON precisa ter "screens"', "warn");
      return;
    }
    const err = importFlowJSON(obj);
    if (err) toast(err, "warn");
    else {
      toast("Fluxo importado");
      closeModal();
    }
  };

  return (
    <ModalShell
      icon="import"
      title="Importar Flow JSON"
      subtitle="Cole um JSON existente para editá-lo visualmente"
      onClose={closeModal}
      footer={
        <>
          <button className="btn" onClick={closeModal}>
            Cancelar
          </button>
          <button className="btn primary" onClick={load}>
            <Icon name="import" size={15} />
            Carregar fluxo
          </button>
        </>
      }
    >
      <textarea
        className="import-ta"
        placeholder={'{ "version": "7.0", "screens": [ ... ] }'}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </ModalShell>
  );
}

function ValidateModal() {
  const { state } = useFlow();
  const { closeModal } = useUI();
  const issues = validateFlow(state.flow);
  const errs = issues.filter((i) => i.level === "err").length;
  const warns = issues.filter((i) => i.level === "warn").length;

  return (
    <ModalShell
      icon="check"
      title="Validação do fluxo"
      subtitle={errs + " erro(s) · " + warns + " aviso(s)"}
      onClose={closeModal}
      footer={
        <button className="btn primary" onClick={closeModal}>
          Fechar
        </button>
      }
    >
      {!issues.length ? (
        <div className="vitem ok">
          <span className="vic">
            <Icon name="check" size={15} />
          </span>
          <div className="vt">
            <b>Tudo certo!</b>
            <span>Nenhum problema encontrado — seu fluxo está pronto para exportar.</span>
          </div>
        </div>
      ) : (
        <div className="vlist">
          {issues.map((i, idx) => (
            <div className={"vitem " + i.level} key={idx}>
              <span className="vic">
                <Icon name={i.level === "err" ? "warn" : "info"} size={15} />
              </span>
              <div className="vt">
                <b>{i.title}</b>
                <span>{i.msg}</span>
                {i.loc ? <span className="vloc">tela: {i.loc}</span> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </ModalShell>
  );
}

function MapModal() {
  const { state } = useFlow();
  const { closeModal } = useUI();
  const { gotoScreen } = useOps();
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [paths, setPaths] = useState("");
  const scr = state.flow.screens;

  useLayoutEffect(() => {
    const draw = () => {
      const grid = gridRef.current;
      if (!grid) return;
      const gr = grid.getBoundingClientRect();
      const w = grid.scrollWidth;
      const h = grid.scrollHeight;
      const pos: Record<string, { x: number; y: number; w: number; h: number }> = {};
      grid.querySelectorAll("[data-screen]").forEach((elRaw) => {
        const el = elRaw as HTMLElement;
        const r = el.getBoundingClientRect();
        pos[el.dataset.screen as string] = {
          x: r.left - gr.left,
          y: r.top - gr.top,
          w: r.width,
          h: r.height,
        };
      });
      const edges: [string, string][] = [];
      const seen = new Set<string>();
      scr.forEach((s) => {
        const outs = new Set<string>();
        walk(s.children, (n) => {
          ["on-click-action", "on-select-action"].forEach((k) => {
            const a = n.props && n.props[k];
            if (a && a.name === "navigate" && a.next) outs.add(a.next);
          });
        });
        outs.forEach((t) => {
          const key = s.id + ">" + t;
          if (!seen.has(key) && pos[t] && pos[s.id]) {
            seen.add(key);
            edges.push([s.id, t]);
          }
        });
      });
      let p =
        '<defs><marker id="arw" markerWidth="10" markerHeight="10" refX="7.5" refY="4.5" orient="auto"><path d="M1 1 L7.5 4.5 L1 8" fill="none" stroke="var(--accent)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>';
      edges.forEach(([from, to]) => {
        const a = pos[from];
        const b = pos[to];
        if (!a || !b) return;
        let sx, sy, tx, ty, c1x, c1y, c2x, c2y;
        const sameRow = Math.abs(a.y - b.y) < a.h * 0.6;
        if (b.x > a.x + a.w * 0.3 || sameRow) {
          sx = a.x + a.w;
          sy = a.y + a.h / 2;
          tx = b.x;
          ty = b.y + b.h / 2;
          const dx = Math.max(36, (tx - sx) / 2);
          c1x = sx + dx;
          c1y = sy;
          c2x = tx - dx;
          c2y = ty;
        } else {
          sx = a.x + a.w / 2;
          sy = a.y + a.h;
          tx = b.x + b.w / 2;
          ty = b.y + b.h;
          const dip = Math.max(a.h, b.h) * 0.6 + 34;
          c1x = sx;
          c1y = sy + dip;
          c2x = tx;
          c2y = ty + dip;
        }
        p +=
          '<path d="M' +
          sx +
          " " +
          sy +
          " C" +
          c1x +
          " " +
          c1y +
          " " +
          c2x +
          " " +
          c2y +
          " " +
          tx +
          " " +
          ty +
          '" fill="none" stroke="var(--accent)" stroke-width="2" marker-end="url(#arw)" opacity=".8"/>';
      });
      setDims({ w, h });
      setPaths(p);
    };
    const raf = requestAnimationFrame(draw);
    window.addEventListener("resize", draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", draw);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scr]);

  return (
    <ModalShell
      icon="map"
      title="Mapa de fluxo"
      subtitle="Telas e transições — clique numa tela para editá-la"
      wide
      onClose={closeModal}
      footer={
        <button className="btn primary" onClick={closeModal}>
          Fechar
        </button>
      }
    >
      <div className="map-legend">
        <span>
          <i style={{ borderColor: "var(--accent)" }} />
          navegação (navigate)
        </span>
        <span>
          <i style={{ borderColor: "#6d28d9" }} />
          conclusão (complete)
        </span>
        <span>{scr.length} telas</span>
      </div>
      <div className="map-wrap">
        <div className="map-grid" ref={gridRef}>
          <svg
            className="map-svg"
            width={dims.w}
            height={dims.h}
            dangerouslySetInnerHTML={{ __html: paths }}
          />
          {scr.map((s, i) => {
            const outs: string[] = [];
            walk(s.children, (n) => {
              ["on-click-action", "on-select-action"].forEach((k) => {
                const a = n.props && n.props[k];
                if (a && a.name === "navigate" && a.next) outs.push(a.next);
                if (a && a.name === "complete") outs.push("__c");
              });
            });
            const nav = [...new Set(outs.filter((x) => x !== "__c"))];
            const hasComplete = outs.includes("__c");
            const cls = "mcard" + (i === 0 ? " start" : "") + (s.terminal ? " term" : "");
            return (
              <div
                className={cls}
                key={s._id}
                data-screen={s.id}
                onClick={() => {
                  gotoScreen(s._id);
                  closeModal();
                }}
              >
                <div className="mc-hd">
                  <span>{s.title || s.id}</span>
                  <span>
                    {i === 0 ? <span className="map-badge">INÍCIO</span> : null}
                    {s.terminal ? <span className="map-badge">FINAL</span> : null}
                  </span>
                </div>
                <div className="mc-id">{s.id}</div>
                <div className="mc-body">
                  {nav.map((t) => (
                    <div className="mrow nav" key={t}>
                      <Icon name="map" size={13} /> → {t}
                    </div>
                  ))}
                  {hasComplete ? (
                    <div className="mrow done">
                      <Icon name="flag" size={13} /> conclui o fluxo
                    </div>
                  ) : null}
                  {!nav.length && !hasComplete ? (
                    <div className="mrow">sem saída definida</div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ModalShell>
  );
}

export default function Modals() {
  const { modal } = useUI();
  if (modal === "export") return <ExportModal />;
  if (modal === "import") return <ImportModal />;
  if (modal === "validate") return <ValidateModal />;
  if (modal === "map") return <MapModal />;
  return null;
}
