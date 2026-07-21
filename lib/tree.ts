// ============================================================
// Travessia e manipulação da árvore de nós
// ============================================================
import type { FlowNode, Screen } from "./types";
import { clone, uid } from "./utils";

export function childArrays(node: FlowNode): FlowNode[][] {
  if (node.type === "If") return [node.then || [], node.else || []];
  if (node.type === "Switch") return Object.values(node.cases || {});
  return [];
}

export function walk(
  nodes: FlowNode[],
  fn: (n: FlowNode, parent?: FlowNode) => void,
  parent?: FlowNode,
): void {
  for (const n of nodes) {
    fn(n, parent);
    childArrays(n).forEach((a) => walk(a, fn, n));
  }
}

export function findNode(id: string, nodes: FlowNode[]): FlowNode | null {
  let found: FlowNode | null = null;
  walk(nodes, (n) => {
    if (n._id === id) found = n;
  });
  return found;
}

export interface FoundWithParent {
  arr: FlowNode[];
  index: number;
  node: FlowNode;
}

export function findWithParent(
  id: string,
  nodes: FlowNode[],
): FoundWithParent | null {
  let res: FoundWithParent | null = null;
  const rec = (arr: FlowNode[]) => {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i]._id === id) {
        res = { arr, index: i, node: arr[i] };
        return;
      }
      childArrays(arr[i]).forEach(rec);
      if (res) return;
    }
  };
  rec(nodes);
  return res;
}

/** Resolve o array (dropzone) a partir da "key" dentro de uma tela. */
export function getArrayByKey(key: string, screen: Screen): FlowNode[] | null {
  const p = key.split("|");
  if (p[0] === "s") return screen.children;
  const node = findNode(p[1], screen.children);
  if (!node) return null;
  if (p[0] === "t") return node.then || null;
  if (p[0] === "e") return node.else || null;
  if (p[0] === "c") return (node.cases || {})[decodeURIComponent(p[2])] || null;
  return null;
}

/** Regenera ids do nó e de todos os descendentes. */
export function reid(n: FlowNode): void {
  n._id = uid();
  childArrays(n).forEach((a) => a.forEach(reid));
}

/** Clona um nó com ids novos. */
export function cloneFresh(n: FlowNode): FlowNode {
  const c = clone(n);
  reid(c);
  return c;
}
