// ============================================================
// Criação de nós e fluxo semente
// ============================================================
import type { Flow, FlowNode, NodeProps } from "./types";
import { COMPONENTS } from "./registry";
import { clone, uid } from "./utils";

export function makeNode(type: string): FlowNode {
  const def = COMPONENTS[type];
  const n: FlowNode = { _id: uid(), type, props: clone(def.defaults || {}) };
  if (def.branches) {
    n.then = [];
    n.else = [];
  }
  if (def.isSwitch) {
    n.cases = { caso_1: [] };
  }
  return n;
}

export function mk(type: string, over?: NodeProps): FlowNode {
  const n = makeNode(type);
  Object.assign(n.props, over || {});
  return n;
}

export function buildSeed(): Flow {
  const s1 = {
    _id: uid(),
    id: "BOAS_VINDAS",
    title: "Boas-vindas",
    terminal: false,
    dataText: "",
    children: [
      mk("TextHeading", { text: "Bem-vindo(a) 👋" }),
      mk("TextBody", { text: "Preencha as informações abaixo para começar o seu cadastro." }),
      mk("Dropdown", {
        name: "plano",
        label: "Escolha seu plano",
        "data-source": [
          { id: "basico", title: "Básico" },
          { id: "pro", title: "Pro" },
          { id: "premium", title: "Premium" },
        ],
      }),
      mk("Footer", { label: "Continuar", "on-click-action": { name: "navigate", next: "DADOS", payload: [] } }),
    ],
  };
  const s2 = {
    _id: uid(),
    id: "DADOS",
    title: "Seus dados",
    terminal: false,
    dataText: "",
    children: [
      mk("TextSubheading", { text: "Seus dados" }),
      mk("TextInput", { name: "nome", label: "Nome completo", required: true }),
      mk("TextInput", { name: "email", label: "E-mail", "input-type": "email", required: true }),
      mk("OptIn", { name: "aceite", label: "Aceito receber novidades por e-mail" }),
      mk("Footer", { label: "Revisar", "on-click-action": { name: "navigate", next: "CONFIRMACAO", payload: [] } }),
    ],
  };
  const ifn = makeNode("If");
  ifn.props.condition = "${form.aceite} == true";
  ifn.then = [
    mk("TextBody", { text: "Você receberá nossas novidades. Obrigado! 🎉" }),
    mk("Footer", { label: "Concluir", "on-click-action": { name: "complete", payload: [] } }),
  ];
  ifn.else = [
    mk("TextBody", { text: "Cadastro concluído. Você optou por não receber novidades." }),
    mk("Footer", { label: "Concluir", "on-click-action": { name: "complete", payload: [] } }),
  ];
  const s3 = {
    _id: uid(),
    id: "CONFIRMACAO",
    title: "Confirmação",
    terminal: true,
    dataText: "",
    children: [mk("TextHeading", { text: "Tudo certo!" }), ifn],
  };
  return { version: "7.0", screens: [s1, s2, s3] };
}
