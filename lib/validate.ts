// ============================================================
// Validação do fluxo
// ============================================================
import type { Flow, ValidationIssue } from "./types";
import { COMPONENTS } from "./registry";
import { walk } from "./tree";

export function validateFlow(flow: Flow): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  const push = (
    level: ValidationIssue["level"],
    title: string,
    msg: string,
    loc?: string,
  ) => out.push({ level, title, msg, loc });
  const idset = new Set(flow.screens.map((s) => s.id));
  const seenIds: Record<string, number> = {};
  if (!flow.screens.some((s) => s.terminal))
    push(
      "warn",
      "Sem tela final",
      "Nenhuma tela marcada como terminal — o fluxo pode não concluir.",
    );
  flow.screens.forEach((sc) => {
    seenIds[sc.id] = (seenIds[sc.id] || 0) + 1;
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(sc.id))
      push("warn", "ID de tela incomum", "Use letras maiúsculas/underscore, sem espaços.", sc.id);
    if (!sc.children.length)
      push("err", "Tela vazia", "Adicione ao menos um componente.", sc.id);
    const topFooters = sc.children.filter((n) => n.type === "Footer").length;
    if (topFooters > 1)
      push("err", "Vários rodapés", "Só é permitido 1 Footer por tela.", sc.id);
    walk(sc.children, (n) => {
      if (n.type === "If") {
        const tf = (n.then || []).some((x) => x.type === "Footer");
        const ef = (n.else || []).some((x) => x.type === "Footer");
        if (tf !== ef)
          push(
            "err",
            "Footer em apenas um ramo do If",
            'Se houver Footer em "então", também deve haver em "senão" (e vice-versa).',
            sc.id,
          );
        if ((tf || ef) && topFooters)
          push(
            "err",
            "Footer dentro e fora do If",
            "Não misture Footer dentro do If com Footer no nível da tela.",
            sc.id,
          );
        if (!/\$\{(form|data|screen)\./.test(n.props.condition || ""))
          push(
            "warn",
            "Condição sem variável",
            "A condição do If deve conter ${form...} ou ${data...}.",
            sc.id,
          );
      }
      if (n.type === "Switch" && !Object.keys(n.cases || {}).length)
        push("err", "Switch sem casos", "Adicione ao menos um caso.", sc.id);
      ["on-click-action", "on-select-action"].forEach((k) => {
        const a = n.props && n.props[k];
        if (a && a.name === "navigate") {
          if (!a.next) push("warn", "Navegação sem destino", "Defina a tela de destino.", sc.id);
          else if (!idset.has(a.next))
            push("err", "Navega para tela inexistente", 'Destino "' + a.next + '" não existe.', sc.id);
        }
      });
      const def = COMPONENTS[n.type];
      if (def)
        def.fields.forEach((f) => {
          if (
            f.max &&
            typeof n.props[f.key] === "string" &&
            n.props[f.key].length > f.max
          )
            push(
              "warn",
              "Limite de caracteres",
              '"' + f.label + '" em ' + n.type + " passou de " + f.max + ".",
              sc.id,
            );
        });
    });
    const names: Record<string, number> = {};
    walk(sc.children, (n) => {
      if (
        ["TextInput", "TextArea", "CheckboxGroup", "RadioButtonsGroup", "Dropdown", "DatePicker", "CalendarPicker", "OptIn"].includes(
          n.type,
        )
      ) {
        if (!n.props.name)
          push("warn", 'Campo sem "name"', "Componente " + n.type + " precisa de um name.", sc.id);
        else names[n.props.name] = (names[n.props.name] || 0) + 1;
      }
    });
    Object.keys(names).forEach((nm) => {
      if (names[nm] > 1)
        push("err", "Nome duplicado", 'O name "' + nm + '" aparece ' + names[nm] + "x nesta tela.", sc.id);
    });
    if (sc.terminal) {
      let hc = false;
      walk(sc.children, (n) => {
        const a = n.props && n.props["on-click-action"];
        if (a && a.name === "complete") hc = true;
      });
      if (!hc)
        push("warn", 'Tela final sem "complete"', "Adicione um Footer com ação Concluir.", sc.id);
    }
  });
  Object.keys(seenIds).forEach((id) => {
    if (seenIds[id] > 1)
      push("err", "ID de tela duplicado", '"' + id + '" é usado ' + seenIds[id] + "x.", id);
  });
  return out;
}
