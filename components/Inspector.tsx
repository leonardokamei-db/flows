"use client";
// ============================================================
// Inspector (painel direito) — edição de tela e componentes
// ============================================================
import React, { useEffect, useRef, useState } from "react";
import type { FieldDef, FlowNode, Screen } from "@/lib/types";
import { Icon } from "@/lib/icons";
import { ACT_LABEL, COMPONENTS, UX_ACTS, UX_ACT_LABEL, UX_HIDE } from "@/lib/registry";
import { walk } from "@/lib/tree";
import { useFlow, screenOf } from "@/store/flowStore";
import { useOps } from "@/store/ops";
import { usePlayControls } from "@/store/playControls";
import AutoTextarea from "./AutoTextarea";

// ---------- pequenos utilitários visuais ----------
function Toggle({ on }: { on: boolean }) {
  return <span className={"tgl" + (on ? " on" : "")} />;
}
function Counter({ v, max }: { v: any; max?: number }) {
  if (!max) return null;
  const l = String(v || "").length;
  return <div className={"cnt" + (l > max ? " over" : "")}>{l} / {max}</div>;
}
function FieldLabel({ f }: { f: FieldDef }) {
  return (
    <label>
      {f.label}
      {f.req ? <span className="sub"> · obrigatório</span> : null}
    </label>
  );
}
function FieldHelp({ f }: { f: FieldDef }) {
  if (!f.help) return null;
  return (
    <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 5, lineHeight: 1.4 }}>{f.help}</div>
  );
}

// ======================= campos individuais =======================
function Field({ node, f }: { node: FlowNode; f: FieldDef }) {
  const { state, arm } = useFlow();
  const isUX = state.mode === "ux";
  const ops = useOps();
  if (isUX && UX_HIDE.has(f.key)) return null;
  const v = node.props[f.key];

  if (f.type === "boolean") {
    const on = v === undefined ? !!f.def : !!v;
    return (
      <div className="switch" onClick={() => ops.toggleComp(f.key)}>
        <div className="lb">
          <b>{f.label}</b>
          {f.help ? <span>{f.help}</span> : null}
        </div>
        <Toggle on={on} />
      </div>
    );
  }

  let inner: React.ReactNode = null;
  if (f.type === "text")
    inner = (
      <>
        <input
          className="inp"
          maxLength={f.max}
          value={v || ""}
          placeholder={f.placeholder || ""}
          onFocus={arm}
          onChange={(e) => ops.editProp(f.key, e.target.value)}
        />
        <Counter v={v} max={f.max} />
      </>
    );
  else if (f.type === "textarea")
    inner = (
      <>
        <AutoTextarea
          className="ta"
          maxLength={f.max}
          value={v || ""}
          onFocus={arm}
          onChange={(e) => ops.editProp(f.key, e.target.value)}
        />
        <Counter v={v} max={f.max} />
      </>
    );
  else if (f.type === "number")
    inner = (
      <input
        type="number"
        className="inp"
        value={v == null ? "" : v}
        onFocus={arm}
        onChange={(e) => ops.editProp(f.key, e.target.value === "" ? "" : Number(e.target.value))}
      />
    );
  else if (f.type === "select") {
    const cur = v == null ? f.def : v;
    inner = (
      <select className="sel" value={cur} onChange={(e) => ops.setProp(f.key, e.target.value)}>
        {(f.opts || []).map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  } else if (f.type === "lines")
    inner = (
      <AutoTextarea
        className="ta"
        style={{ minHeight: 110 }}
        value={Array.isArray(v) ? v.join("\n") : v || ""}
        onFocus={arm}
        onChange={(e) => ops.editProp(f.key, e.target.value.split("\n"))}
      />
    );
  else if (f.type === "condition") inner = <ConditionEditor node={node} />;
  else if (f.type === "options") inner = <OptionsEditor node={node} fkey={f.key} />;
  else if (f.type === "action")
    inner = isUX ? <UxActionEditor node={node} f={f} /> : <ActionEditor node={node} f={f} />;
  else if (f.type === "image") inner = <ImageEditor node={node} fkey={f.key} />;

  return (
    <div className="fld">
      <FieldLabel f={f} />
      {inner}
      <FieldHelp f={f} />
    </div>
  );
}

function ConditionEditor({ node }: { node: FlowNode }) {
  const { arm } = useFlow();
  const { setCondition } = useOps();
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const chips = ["${form.", "${data.", "} ", "== true", "== ''", "!= ", "&& ", "|| ", "> ", "< ", "!", "( )"];
  const v = node.props.condition || "";

  const insert = (text: string) => {
    const ta = ref.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const en = ta.selectionEnd;
    const val = ta.value;
    const nv = val.slice(0, s) + text + val.slice(en);
    arm();
    setCondition(nv);
    requestAnimationFrame(() => {
      const el = ref.current;
      if (el) {
        el.focus();
        el.selectionStart = el.selectionEnd = s + text.length;
      }
    });
  };

  return (
    <>
      <AutoTextarea
        ref={ref}
        className="ta mono"
        style={{ minHeight: 70 }}
        value={v}
        onFocus={arm}
        onChange={(e) => setCondition(e.target.value)}
      />
      <div className="chips">
        {chips.map((c) => (
          <button className="chip" key={c} onClick={() => insert(c)}>
            {c}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6, lineHeight: 1.4 }}>
        Use uma variável dinâmica e resolva em booleano. Ex.: <code>{"${form.aceite} == true"}</code>
      </div>
    </>
  );
}

function OptionsEditor({ node, fkey }: { node: FlowNode; fkey: string }) {
  const { state, arm } = useFlow();
  const { addOption, delOption, editOption } = useOps();
  const isUX = state.mode === "ux";
  const ds = node.props[fkey] || [];
  return (
    <div>
      {ds.map((o: any, i: number) => (
        <div className="opt-card" key={i}>
          <div className="oc-hd">
            <span className="oi">{i + 1}</span>
            <input
              className="inp"
              maxLength={30}
              value={o.title || ""}
              placeholder="Título da opção"
              onFocus={arm}
              onChange={(e) => editOption(fkey, i, "title", e.target.value)}
            />
            <button className="x-btn" onClick={() => delOption(fkey, i)}>
              <Icon name="trash" size={13} />
            </button>
          </div>
          {isUX ? (
            <div>
              <span className="mini">Descrição (opcional)</span>
              <input
                className="inp"
                maxLength={300}
                value={o.description || ""}
                placeholder="Texto de apoio"
                onFocus={arm}
                onChange={(e) => editOption(fkey, i, "description", e.target.value)}
              />
            </div>
          ) : (
            <div className="grid">
              <div>
                <span className="mini">id</span>
                <input
                  className="inp"
                  value={o.id || ""}
                  onFocus={arm}
                  onChange={(e) => editOption(fkey, i, "id", e.target.value)}
                />
              </div>
              <div>
                <span className="mini">Descrição</span>
                <input
                  className="inp"
                  maxLength={300}
                  value={o.description || ""}
                  onFocus={arm}
                  onChange={(e) => editOption(fkey, i, "description", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      ))}
      <button className="add-btn" onClick={() => addOption(fkey)}>
        <Icon name="plus" size={15} />
        Adicionar opção
      </button>
    </div>
  );
}

function ActionEditor({ node, f }: { node: FlowNode; f: FieldDef }) {
  const { state, arm } = useFlow();
  const { setActionName, setActionNext, setActionUrl, addPayload, delPayload, editPayload } = useOps();
  const allowed = f.allowed || ["navigate", "complete", "data_exchange", "open_url"];
  let a = node.props[f.key];
  if (!a || !a.name) a = { name: allowed[0], payload: [] };
  return (
    <div className="opt-card">
      <span className="mini">Tipo de ação</span>
      <select className="sel" value={a.name} onChange={(e) => setActionName(f.key, e.target.value)}>
        {allowed.map((x) => (
          <option key={x} value={x}>
            {ACT_LABEL[x] || x}
          </option>
        ))}
      </select>
      {a.name === "navigate" ? (
        <div style={{ marginTop: 9 }}>
          <span className="mini">Tela de destino</span>
          <select className="sel" value={a.next || ""} onChange={(e) => setActionNext(f.key, e.target.value)}>
            <option value="">— selecione a tela —</option>
            {state.flow.screens.map((s) => (
              <option key={s._id} value={s.id}>
                {(s.title || s.id) + " (" + s.id + ")"}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {a.name === "open_url" ? (
        <div style={{ marginTop: 9 }}>
          <span className="mini">URL</span>
          <input
            className="inp"
            value={a.url || ""}
            placeholder="https://…"
            onFocus={arm}
            onChange={(e) => setActionUrl(f.key, e.target.value)}
          />
        </div>
      ) : null}
      {["navigate", "data_exchange", "update_data"].includes(a.name) ? (
        <div style={{ marginTop: 9 }}>
          <span className="mini">Payload (opcional)</span>
          {(a.payload || []).map((pp: any, i: number) => (
            <div className="pair-row" key={i}>
              <input
                className="inp"
                value={pp.key || ""}
                placeholder="chave"
                onFocus={arm}
                onChange={(e) => editPayload(f.key, i, "key", e.target.value)}
              />
              <input
                className="inp"
                value={pp.value || ""}
                placeholder="valor / ${form.x}"
                onFocus={arm}
                onChange={(e) => editPayload(f.key, i, "value", e.target.value)}
              />
              <button className="x-btn" onClick={() => delPayload(f.key, i)}>
                <Icon name="trash" size={13} />
              </button>
            </div>
          ))}
          <button className="add-btn" onClick={() => addPayload(f.key)}>
            <Icon name="plus" size={14} />
            Adicionar campo
          </button>
        </div>
      ) : null}
    </div>
  );
}

function UxActionEditor({ node, f }: { node: FlowNode; f: FieldDef }) {
  const { state } = useFlow();
  const { setActionName, setActionNext } = useOps();
  const { arm } = useFlow();
  const { setActionUrl } = useOps();
  const allowed = f.allowed || ["navigate", "complete", "open_url"];
  let a = node.props[f.key];
  if (!a || !a.name) a = { name: allowed[0], payload: [] };
  const opts = UX_ACTS.filter((x) => allowed.includes(x));
  if (!opts.includes(a.name)) opts.push(a.name);
  const title = f.key === "on-select-action" ? "Ao escolher uma opção" : "Ao tocar neste item";
  return (
    <div className="opt-card">
      <span className="mini">{title}</span>
      <select className="sel" value={a.name} onChange={(e) => setActionName(f.key, e.target.value)}>
        {opts.map((x) => (
          <option key={x} value={x}>
            {UX_ACT_LABEL[x] || ACT_LABEL[x] || x}
          </option>
        ))}
      </select>
      {a.name === "navigate" ? (
        <div style={{ marginTop: 9 }}>
          <span className="mini">Tela de destino</span>
          <select className="sel" value={a.next || ""} onChange={(e) => setActionNext(f.key, e.target.value)}>
            <option value="">— escolha a tela —</option>
            {state.flow.screens.map((s) => (
              <option key={s._id} value={s.id}>
                {s.title || s.id}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {a.name === "open_url" ? (
        <div style={{ marginTop: 9 }}>
          <span className="mini">Endereço (URL)</span>
          <input
            className="inp"
            value={a.url || ""}
            placeholder="https://…"
            onFocus={arm}
            onChange={(e) => setActionUrl(f.key, e.target.value)}
          />
        </div>
      ) : null}
    </div>
  );
}

function ImageEditor({ node, fkey }: { node: FlowNode; fkey: string }) {
  const { arm } = useFlow();
  const { editProp, setProp } = useOps();
  const v = node.props[fkey];
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const rd = new FileReader();
    rd.onload = () => setProp(fkey, rd.result);
    rd.readAsDataURL(file);
  };
  return (
    <div>
      {v ? (
        <div className="wa-img" style={{ height: 120, marginBottom: 8 }}>
          <img src={v} style={{ height: "100%", objectFit: "contain" }} alt="" />
        </div>
      ) : null}
      <input type="file" accept="image/*" style={{ fontSize: 12, width: "100%", marginBottom: 7 }} onChange={onFile} />
      <AutoTextarea
        className="ta mono"
        placeholder="data:image/png;base64,…"
        style={{ minHeight: 70 }}
        value={v || ""}
        onFocus={arm}
        onChange={(e) => editProp(fkey, e.target.value)}
      />
    </div>
  );
}

function CasesManager({ node }: { node: FlowNode }) {
  const { addCase, delCase, renameCase } = useOps();
  const keys = Object.keys(node.cases || {});
  return (
    <div className="insp-sec">
      <div className="sec-t">Casos do Switch</div>
      <div style={{ fontSize: 11, color: "var(--text-3)", margin: "2px 0 6px" }}>
        Cada caso corresponde a um valor de <code>{node.props.value || "value"}</code>.
      </div>
      {keys.map((k) => (
        <div className="pair-row" key={k}>
          <input
            className="inp"
            defaultValue={k}
            onBlur={(e) => {
              if (!renameCase(k, e.target.value)) e.target.value = k;
            }}
          />
          <button className="x-btn" disabled={keys.length <= 1} onClick={() => delCase(k)}>
            <Icon name="trash" size={13} />
          </button>
        </div>
      ))}
      <button className="add-btn" onClick={addCase}>
        <Icon name="plus" size={15} />
        Adicionar caso
      </button>
    </div>
  );
}

// ======================= inspetores =======================
function navSummary(sc: Screen): string[] {
  const outs: string[] = [];
  walk(sc.children, (n) => {
    ["on-click-action", "on-select-action"].forEach((k) => {
      const a = n.props && n.props[k];
      if (a && a.name === "navigate" && a.next) outs.push(a.next);
      if (a && a.name === "complete") outs.push("__complete__");
    });
  });
  return outs;
}

function ScreenIdField({ sc }: { sc: Screen }) {
  const { setScreenId } = useOps();
  const [val, setVal] = useState(sc.id);
  useEffect(() => setVal(sc.id), [sc._id, sc.id]);
  return (
    <input
      className="inp"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => setScreenId(val)}
    />
  );
}

function InspScreen({ sc }: { sc: Screen }) {
  const { state, arm } = useFlow();
  const ops = useOps();
  const isUX = state.mode === "ux";
  const idx = state.flow.screens.findIndex((s) => s._id === sc._id);
  const total = state.flow.screens.length;
  const outs = navSummary(sc);
  const navTargets = [...new Set(outs.filter((x) => x !== "__complete__"))];
  const screenTitleById = (id: string) => {
    const s = state.flow.screens.find((x) => x.id === id);
    return s ? s.title || s.id : id;
  };

  return (
    <>
      <div className="insp-hd">
        <div className="k">
          Tela {idx + 1} de {total}
        </div>
        <div className="n">
          <span className="ci">
            <Icon name="gear" size={17} />
          </span>
          <div>
            <b>{sc.title || sc.id}</b>
            <div className="type">{isUX ? "Tela " + (idx + 1) : sc.id}</div>
          </div>
        </div>
        <div className="tool-btns">
          <button
            className="btn sm"
            disabled={idx === 0}
            title="Mover para a esquerda"
            onClick={() => ops.moveScreen(-1)}
          >
            <Icon name="back" size={13} />
          </button>
          <button className="btn sm" onClick={ops.duplicateScreen}>
            <Icon name="copy" size={13} />
            Duplicar
          </button>
          <button
            className="btn sm"
            disabled={idx === total - 1}
            title="Mover para a direita"
            onClick={() => ops.moveScreen(1)}
          >
            <Icon name="redo" size={13} />
          </button>
          <button className="btn sm" disabled={total <= 1} onClick={ops.deleteScreen}>
            <Icon name="trash" size={13} />
          </button>
        </div>
      </div>
      <div className="insp-body">
        <div className="fld">
          <label>{isUX ? "Nome da tela" : "Título (exibido no topo)"}</label>
          <input
            className="inp"
            value={sc.title || ""}
            onFocus={arm}
            onChange={(e) => ops.editScreenTitle(e.target.value)}
          />
        </div>
        {!isUX ? (
          <div className="fld">
            <label>
              ID da tela <span className="sub">· único, MAIÚSCULAS</span>
            </label>
            <ScreenIdField sc={sc} />
          </div>
        ) : null}
        <div className="switch" onClick={ops.toggleTerminal}>
          <div className="lb">
            <b>{isUX ? "É a última tela?" : "Tela final (terminal)"}</b>
            <span>
              {isUX
                ? "Finaliza o fluxo quando o usuário concluir"
                : 'Última tela do fluxo — usa ação "complete"'}
            </span>
          </div>
          <Toggle on={sc.terminal} />
        </div>
        {!isUX ? (
          <div className="insp-sec">
            <div className="sec-t">Modelo de dados (data)</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", margin: "2px 0 7px", lineHeight: 1.4 }}>
              JSON opcional recebido do servidor. Ex.:{" "}
              <code>{'{"nome":{"type":"string","__example__":"Ana"}}'}</code>
            </div>
            <AutoTextarea
              className="ta mono"
              placeholder="{}"
              style={{ minHeight: 90 }}
              value={sc.dataText || ""}
              onFocus={arm}
              onChange={(e) => ops.editScreenData(e.target.value)}
            />
          </div>
        ) : null}
        <div className="insp-sec">
          <div className="sec-t">{isUX ? "Para onde esta tela leva" : "Transições desta tela"}</div>
          {navTargets.length ? (
            navTargets.map((t) => (
              <div
                key={t}
                style={{
                  fontSize: "12.5px",
                  color: "var(--accent-deep)",
                  fontWeight: 600,
                  marginTop: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Icon name="map" size={14} />→ {isUX ? screenTitleById(t) : t}
              </div>
            ))
          ) : outs.includes("__complete__") ? (
            <div style={{ fontSize: "12.5px", color: "#6d28d9", fontWeight: 600, marginTop: 6 }}>
              ✓ conclui o fluxo
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 6 }}>
              {isUX
                ? "Nenhuma ainda. Adicione um Rodapé (botão) e escolha “Ir para outra tela”."
                : 'Nenhuma. Adicione um Rodapé/Link com ação "Navegar".'}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function InspComponent({ node }: { node: FlowNode }) {
  const { state } = useFlow();
  const { duplicateNode, deleteNode } = useOps();
  const isUX = state.mode === "ux";
  const def = COMPONENTS[node.type];

  return (
    <>
      <div className="insp-hd">
        <div className="k">Componente</div>
        <div className="n">
          <span className="ci">
            <Icon name={def.icon} size={17} />
          </span>
          <div>
            <b>{def.label}</b>
            <div className="type">{node.type}</div>
          </div>
        </div>
        <div className="tool-btns">
          <button className="btn sm" onClick={() => duplicateNode(node._id)}>
            <Icon name="copy" size={13} />
            Duplicar
          </button>
          <button className="btn sm" onClick={() => deleteNode(node._id)}>
            <Icon name="trash" size={13} />
            Excluir
          </button>
        </div>
      </div>
      <div className="insp-body">
        {isUX && (node.type === "If" || node.type === "Switch") ? (
          <div className="note">
            Este é um bloco <b>avançado</b> ({node.type === "If" ? "condição" : "seleção por valor"}
            ). Para editar a lógica de ramificação, use o modo <b>Dev</b>. Aqui você ainda pode
            excluí-lo pelo botão acima.
          </div>
        ) : (
          <>
            {def.fields.map((f) => (
              <Field node={node} f={f} key={f.key} />
            ))}
            {!isUX && node.type === "If" ? (
              <div className="note">
                As ramificações <b>então</b> e <b>senão</b> são editadas arrastando componentes para
                dentro delas no telefone. Para transições condicionais, coloque um <b>Rodapé</b>{" "}
                (ação Navegar) em cada ramo.
              </div>
            ) : null}
            {!isUX && node.type === "Switch" ? <CasesManager node={node} /> : null}
          </>
        )}
      </div>
    </>
  );
}

function InspPlay() {
  const { state } = useFlow();
  const { playBack, playRestart } = usePlayControls();
  const sc = screenOf(state);
  return (
    <>
      <div className="insp-hd">
        <div className="k">Modo teste</div>
        <div className="n">
          <span className="ci">
            <Icon name="flag" size={17} />
          </span>
          <div>
            <b>Testando o fluxo</b>
            <div className="type">{sc.title || sc.id}</div>
          </div>
        </div>
      </div>
      <div className="insp-play">
        <p>
          Preencha os <b>campos</b>, selecione <b>opções</b> e toque nos <b>botões</b> para navegar
          entre as telas — como o usuário faria no WhatsApp. As respostas ficam guardadas até
          reiniciar, e ramificações (If/Switch) reagem ao que foi preenchido.
        </p>
        <div className="tool-btns">
          <button className="btn sm" disabled={!state.navStack.length} onClick={playBack}>
            <Icon name="back" size={13} />
            Voltar
          </button>
          <button className="btn sm" onClick={playRestart}>
            <Icon name="redo" size={13} />
            Reiniciar
          </button>
        </div>
      </div>
    </>
  );
}

export default function Inspector() {
  const { state } = useFlow();
  const playing = state.mode === "ux" && state.play;
  const sc = screenOf(state);
  let content: React.ReactNode;
  if (playing) content = <InspPlay />;
  else if (state.sel.kind === "component") {
    const node = sc.children.length
      ? findNodeIn(sc, state.sel.id)
      : null;
    content = node ? <InspComponent node={node} /> : <InspScreen sc={sc} />;
  } else content = <InspScreen sc={sc} />;

  return <aside className="inspector">{content}</aside>;
}

function findNodeIn(sc: Screen, id: string): FlowNode | null {
  let found: FlowNode | null = null;
  walk(sc.children, (n) => {
    if (n._id === id) found = n;
  });
  return found;
}
