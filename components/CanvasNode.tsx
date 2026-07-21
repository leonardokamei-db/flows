"use client";
// ============================================================
// Canvas de edição — dropzones e nós recursivos
// ============================================================
import React from "react";
import type { FlowNode } from "@/lib/types";
import { Icon } from "@/lib/icons";
import { useFlow } from "@/store/flowStore";
import { useDnd } from "@/store/dnd";
import { useOps } from "@/store/ops";
import ComponentPreview from "./ComponentPreview";

function Placeholder() {
  return <div className="placeholder" />;
}

export function Dropzone({
  arrKey,
  nodes,
  root,
}: {
  arrKey: string;
  nodes: FlowNode[];
  root?: boolean;
}) {
  const { indicator, onDropzoneDragOver, onDropzoneDrop } = useDnd();
  const showPH = indicator && indicator.key === arrKey;
  const phIndex = showPH ? indicator!.index : -1;

  return (
    <div
      className={"dropzone" + (root ? " root" : "")}
      data-key={arrKey}
      onDragOver={onDropzoneDragOver(arrKey)}
      onDrop={onDropzoneDrop(arrKey)}
    >
      {nodes.length ? (
        <>
          {nodes.map((n, i) => (
            <React.Fragment key={n._id}>
              {phIndex === i ? <Placeholder /> : null}
              <CanvasNode node={n} />
            </React.Fragment>
          ))}
          {phIndex >= nodes.length ? <Placeholder /> : null}
        </>
      ) : (
        <>
          <div className={"dz-empty" + (root ? "" : " small")}>
            {root ? "Arraste componentes aqui" : "Solte aqui"}
          </div>
          {showPH ? <Placeholder /> : null}
        </>
      )}
    </div>
  );
}

export function CanvasNode({ node }: { node: FlowNode }) {
  const { state, set } = useFlow();
  const { draggingId, onNodeDragStart, onNodeDragEnd } = useDnd();
  const { deleteNode, duplicateNode, selectComponent } = useOps();

  const sel = state.sel.kind === "component" && state.sel.id === node._id;
  const dragging = draggingId === node._id;
  const pop = state.justAdded === node._id;
  const invisible = node.props.visible === false;

  let body: React.ReactNode;
  if (node.type === "If") {
    body = (
      <div className="logic">
        <div className="logic-hd">
          <Icon name="iff" size={14} />
          SE <span className="cond">{node.props.condition || "condição"}</span>
        </div>
        <div className="branch">
          <div className="branch-lbl">
            <span className="pill">então</span> mostrar
          </div>
          <Dropzone arrKey={"t|" + node._id} nodes={node.then || []} />
        </div>
        <div className="branch">
          <div className="branch-lbl">
            <span className="pill">senão</span> mostrar
          </div>
          <Dropzone arrKey={"e|" + node._id} nodes={node.else || []} />
        </div>
      </div>
    );
  } else if (node.type === "Switch") {
    const keys = Object.keys(node.cases || {});
    body = (
      <div className="logic">
        <div className="logic-hd">
          <Icon name="switch" size={14} />
          ESCOLHER <span className="cond">{node.props.value || "valor"}</span>
        </div>
        {keys.length ? (
          keys.map((k) => (
            <div className="branch" key={k}>
              <div className="branch-lbl">
                <span className="pill">caso</span> {k}
              </div>
              <Dropzone
                arrKey={"c|" + node._id + "|" + encodeURIComponent(k)}
                nodes={(node.cases as any)[k]}
              />
            </div>
          ))
        ) : (
          <div className="dz-empty small">Adicione casos no painel →</div>
        )}
      </div>
    );
  } else {
    body = <ComponentPreview node={node} />;
  }

  return (
    <div
      className={
        "cnode" + (sel ? " sel" : "") + (dragging ? " dragging" : "") + (pop ? " pop-in" : "")
      }
      data-node={node._id}
      draggable
      onDragStart={onNodeDragStart(node._id)}
      onDragEnd={onNodeDragEnd}
      onClick={(e) => {
        e.stopPropagation();
        selectComponent(node._id);
      }}
      onAnimationEnd={
        pop
          ? () =>
              set((d) => {
                if (d.justAdded === node._id) d.justAdded = null;
              })
          : undefined
      }
    >
      <div className="cnode-tools">
        <button
          className="grip"
          title="Mover"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Icon name="grip" size={14} />
        </button>
        <button
          title="Duplicar"
          onClick={(e) => {
            e.stopPropagation();
            duplicateNode(node._id);
          }}
        >
          <Icon name="copy" size={13} />
        </button>
        <button
          className="del"
          title="Excluir"
          onClick={(e) => {
            e.stopPropagation();
            deleteNode(node._id);
          }}
        >
          <Icon name="trash" size={13} />
        </button>
      </div>
      <div className="cnode-inner" style={invisible ? { opacity: 0.45 } : undefined}>
        {body}
      </div>
    </div>
  );
}
