// ============================================================
// Registro de componentes (somente dados — o preview é React)
// ============================================================
import type { ComponentDef, FieldDef } from "./types";

// ---------- campos reutilizáveis ----------
const F_VIS: FieldDef = {
  key: "visible",
  label: "Visível",
  type: "boolean",
  def: true,
  help: "Exibe o componente na tela",
};
const F_REQ: FieldDef = {
  key: "required",
  label: "Obrigatório",
  type: "boolean",
  def: false,
};
const F_NAME: FieldDef = {
  key: "name",
  label: "Nome (name)",
  type: "text",
  req: true,
  help: "Identificador usado em ${form.name}",
};
const F_HELP: FieldDef = {
  key: "helper-text",
  label: "Texto de ajuda",
  type: "text",
  max: 80,
};

export const COMPONENTS: Record<string, ComponentDef> = {
  TextHeading: {
    label: "Título",
    icon: "heading",
    cat: "text",
    desc: "Título principal",
    fields: [{ key: "text", label: "Texto", type: "text", req: true, max: 80 }, F_VIS],
    defaults: { text: "Título principal", visible: true },
  },
  TextSubheading: {
    label: "Subtítulo",
    icon: "subheading",
    cat: "text",
    desc: "Título secundário",
    fields: [{ key: "text", label: "Texto", type: "text", req: true, max: 80 }, F_VIS],
    defaults: { text: "Subtítulo", visible: true },
  },
  TextBody: {
    label: "Corpo de texto",
    icon: "body",
    cat: "text",
    desc: "Parágrafo padrão",
    fields: [
      { key: "text", label: "Texto", type: "textarea", req: true, max: 4096 },
      {
        key: "font-weight",
        label: "Peso da fonte",
        type: "select",
        opts: ["normal", "bold", "italic", "bold_italic"],
        def: "normal",
      },
      { key: "strikethrough", label: "Tachado", type: "boolean", def: false },
      { key: "markdown", label: "Markdown (v5.1+)", type: "boolean", def: false },
      F_VIS,
    ],
    defaults: {
      text: "Texto do corpo. Descreva aqui as informações para o usuário.",
      "font-weight": "normal",
      strikethrough: false,
      markdown: false,
      visible: true,
    },
  },
  TextCaption: {
    label: "Legenda",
    icon: "caption",
    cat: "text",
    desc: "Texto pequeno/secundário",
    fields: [
      { key: "text", label: "Texto", type: "textarea", req: true, max: 409 },
      {
        key: "font-weight",
        label: "Peso da fonte",
        type: "select",
        opts: ["normal", "bold", "italic", "bold_italic"],
        def: "normal",
      },
      { key: "strikethrough", label: "Tachado", type: "boolean", def: false },
      { key: "markdown", label: "Markdown (v5.1+)", type: "boolean", def: false },
      F_VIS,
    ],
    defaults: {
      text: "Legenda ou observação",
      "font-weight": "normal",
      strikethrough: false,
      markdown: false,
      visible: true,
    },
  },
  RichText: {
    label: "Rich Text",
    icon: "rich",
    cat: "text",
    desc: "Markdown completo (v5.1+)",
    fields: [
      {
        key: "text",
        label: "Conteúdo (markdown, uma linha por parágrafo)",
        type: "lines",
        req: true,
      },
      F_VIS,
    ],
    defaults: {
      text: ["# Título", "Parágrafo com **negrito** e *itálico*.", "- Item 1", "- Item 2"],
      visible: true,
    },
  },

  TextInput: {
    label: "Resposta Curta",
    icon: "input",
    cat: "input",
    desc: "Entrada de uma linha",
    fields: [
      F_NAME,
      { key: "label", label: "Rótulo (label)", type: "text", req: true, max: 20 },
      {
        key: "input-type",
        label: "Tipo de entrada",
        type: "select",
        opts: ["text", "number", "email", "password", "passcode", "phone"],
        def: "text",
      },
      F_REQ,
      F_HELP,
      { key: "min-chars", label: "Mín. caracteres", type: "number" },
      { key: "max-chars", label: "Máx. caracteres", type: "number" },
      {
        key: "pattern",
        label: "Regex (pattern, v6.2+)",
        type: "text",
        help: "Exige helper-text quando usado",
      },
      F_VIS,
    ],
    defaults: {
      name: "campo_texto",
      label: "Digite seu nome",
      "input-type": "text",
      required: false,
      visible: true,
    },
  },
  TextArea: {
    label: "Parágrafo",
    icon: "textarea",
    cat: "input",
    desc: "Texto com várias linhas",
    fields: [
      F_NAME,
      { key: "label", label: "Rótulo (label)", type: "text", req: true, max: 20 },
      F_REQ,
      { key: "max-length", label: "Máx. de caracteres", type: "number" },
      F_HELP,
      { key: "enabled", label: "Habilitado", type: "boolean", def: true },
      F_VIS,
    ],
    defaults: { name: "campo_area", label: "Comentários", required: false, enabled: true, visible: true },
  },
  DatePicker: {
    label: "Seletor de data",
    icon: "date",
    cat: "input",
    desc: "Escolha de data única",
    fields: [
      F_NAME,
      { key: "label", label: "Rótulo (label)", type: "text", req: true, max: 40 },
      F_HELP,
      {
        key: "min-date",
        label: "Data mínima",
        type: "text",
        help: 'Timestamp ms ou "YYYY-MM-DD" (v5.0+)',
      },
      { key: "max-date", label: "Data máxima", type: "text" },
      { key: "enabled", label: "Habilitado", type: "boolean", def: true },
      {
        key: "on-select-action",
        label: "Ação ao selecionar",
        type: "action",
        allowed: ["none", "data_exchange"],
      },
      F_VIS,
    ],
    defaults: { name: "data", label: "Selecione uma data", enabled: true, visible: true },
  },
  CalendarPicker: {
    label: "Calendário",
    icon: "calendar",
    cat: "input",
    desc: "Data única ou intervalo (v6.1+)",
    fields: [
      F_NAME,
      { key: "label", label: "Rótulo (label)", type: "text", req: true, max: 40 },
      { key: "mode", label: "Modo", type: "select", opts: ["single", "range"], def: "single" },
      { key: "title", label: "Título", type: "text", max: 80 },
      { key: "description", label: "Descrição", type: "text", max: 300 },
      F_HELP,
      { key: "min-date", label: "Data mínima (YYYY-MM-DD)", type: "text" },
      { key: "max-date", label: "Data máxima (YYYY-MM-DD)", type: "text" },
      F_VIS,
    ],
    defaults: { name: "calendario", label: "Escolha a data", mode: "single", visible: true },
  },

  CheckboxGroup: {
    label: "Caixas de seleção",
    icon: "checkbox",
    cat: "select",
    desc: "Múltipla escolha",
    fields: [
      F_NAME,
      { key: "label", label: "Rótulo (label)", type: "text", req: true, max: 30 },
      { key: "data-source", label: "Opções", type: "options" },
      F_REQ,
      { key: "min-selected-items", label: "Mín. selecionados", type: "number" },
      { key: "max-selected-items", label: "Máx. selecionados", type: "number" },
      { key: "description", label: "Descrição", type: "text", max: 300 },
      {
        key: "on-select-action",
        label: "Ação ao selecionar",
        type: "action",
        allowed: ["none", "data_exchange"],
      },
      F_VIS,
    ],
    defaults: {
      name: "opcoes",
      label: "Selecione as opções",
      "data-source": [
        { id: "op_1", title: "Opção 1" },
        { id: "op_2", title: "Opção 2" },
        { id: "op_3", title: "Opção 3" },
      ],
      required: false,
      visible: true,
    },
  },
  RadioButtonsGroup: {
    label: "Botões de opção",
    icon: "radio",
    cat: "select",
    desc: "Escolha única",
    fields: [
      F_NAME,
      { key: "label", label: "Rótulo (label)", type: "text", req: true, max: 30 },
      { key: "data-source", label: "Opções", type: "options" },
      F_REQ,
      { key: "description", label: "Descrição", type: "text", max: 300 },
      {
        key: "on-select-action",
        label: "Ação ao selecionar",
        type: "action",
        allowed: ["none", "data_exchange"],
      },
      F_VIS,
    ],
    defaults: {
      name: "escolha",
      label: "Escolha uma opção",
      "data-source": [
        { id: "op_1", title: "Opção 1" },
        { id: "op_2", title: "Opção 2" },
      ],
      required: false,
      visible: true,
    },
  },
  Dropdown: {
    label: "Lista suspensa",
    icon: "dropdown",
    cat: "select",
    desc: "Menu de seleção",
    fields: [
      F_NAME,
      { key: "label", label: "Rótulo (label)", type: "text", req: true, max: 20 },
      { key: "data-source", label: "Opções", type: "options" },
      F_REQ,
      {
        key: "on-select-action",
        label: "Ação ao selecionar",
        type: "action",
        allowed: ["none", "data_exchange"],
      },
      F_VIS,
    ],
    defaults: {
      name: "lista",
      label: "Selecione",
      "data-source": [
        { id: "item_1", title: "Item 1" },
        { id: "item_2", title: "Item 2" },
        { id: "item_3", title: "Item 3" },
      ],
      required: false,
      visible: true,
    },
  },

  Footer: {
    label: "Rodapé (botão)",
    icon: "footer",
    cat: "action",
    desc: "Botão de ação principal",
    fields: [
      { key: "label", label: "Texto do botão", type: "text", req: true, max: 35 },
      { key: "left-caption", label: "Legenda esquerda", type: "text", max: 15 },
      { key: "center-caption", label: "Legenda central", type: "text", max: 15 },
      { key: "right-caption", label: "Legenda direita", type: "text", max: 15 },
      {
        key: "on-click-action",
        label: "Ação ao clicar",
        type: "action",
        req: true,
        allowed: ["complete", "navigate", "data_exchange", "update_data", "open_url"],
      },
    ],
    defaults: { label: "Continuar", "on-click-action": { name: "complete", payload: [] } },
  },
  EmbeddedLink: {
    label: "Link incorporado",
    icon: "link",
    cat: "action",
    desc: "Link clicável no texto",
    fields: [
      { key: "text", label: "Texto do link", type: "text", req: true, max: 25 },
      {
        key: "on-click-action",
        label: "Ação ao clicar",
        type: "action",
        req: true,
        allowed: ["navigate", "data_exchange", "open_url"],
      },
      F_VIS,
    ],
    defaults: { text: "Saiba mais", "on-click-action": { name: "navigate", next: "", payload: [] }, visible: true },
  },
  OptIn: {
    label: "Opt-in (aceite)",
    icon: "optin",
    cat: "action",
    desc: "Checkbox de consentimento",
    fields: [
      F_NAME,
      { key: "label", label: "Texto do aceite", type: "text", req: true, max: 120 },
      F_REQ,
      {
        key: "on-click-action",
        label: 'Ação em "Saiba mais"',
        type: "action",
        allowed: ["none", "navigate", "data_exchange", "open_url"],
      },
      F_VIS,
    ],
    defaults: { name: "aceite", label: "Concordo com os termos e condições", required: false, visible: true },
  },

  Image: {
    label: "Imagem",
    icon: "image",
    cat: "media",
    desc: "Imagem em base64",
    fields: [
      { key: "src", label: "Imagem (base64 / data URI)", type: "image" },
      { key: "alt-text", label: "Texto alternativo", type: "text" },
      { key: "scale-type", label: "Escala", type: "select", opts: ["contain", "cover"], def: "contain" },
      { key: "height", label: "Altura (px)", type: "number" },
      { key: "width", label: "Largura (px)", type: "number" },
      { key: "aspect-ratio", label: "Proporção (aspect-ratio)", type: "number" },
    ],
    defaults: { src: "", "alt-text": "Imagem", "scale-type": "contain", height: 200 },
  },

  If: {
    label: "Condição (If)",
    icon: "iff",
    cat: "logic",
    desc: "Renderiza por condição",
    fields: [{ key: "condition", label: "Condição", type: "condition", req: true }],
    defaults: { condition: "${form.aceite} == true" },
    branches: ["then", "else"],
  },
  Switch: {
    label: "Seletor (Switch)",
    icon: "switch",
    cat: "logic",
    desc: "Renderiza por caso",
    fields: [{ key: "value", label: "Variável avaliada (value)", type: "text", req: true }],
    defaults: { value: "${data.opcao}" },
    isSwitch: true,
  },
};

export const PALETTE = [
  { group: "Texto", items: ["TextHeading", "TextSubheading", "TextBody", "TextCaption", "RichText"] },
  { group: "Entrada", items: ["TextInput", "TextArea", "DatePicker", "CalendarPicker"] },
  { group: "Seleção", items: ["CheckboxGroup", "RadioButtonsGroup", "Dropdown"] },
  { group: "Ações & Links", items: ["Footer", "EmbeddedLink", "OptIn"] },
  { group: "Mídia", items: ["Image"] },
  { group: "Lógica & Navegação", items: ["If", "Switch"] },
];

export const ACT_LABEL: Record<string, string> = {
  navigate: "Navegar para tela",
  complete: "Concluir fluxo (complete)",
  data_exchange: "Trocar dados (data_exchange)",
  update_data: "Atualizar dados",
  open_url: "Abrir URL",
  none: "Sem ação",
};

// Campos "técnicos" ocultados no modo UX (edição simplificada).
export const UX_HIDE = new Set([
  "name",
  "pattern",
  "min-chars",
  "max-chars",
  "max-length",
  "min-selected-items",
  "max-selected-items",
  "min-date",
  "max-date",
  "aspect-ratio",
  "width",
  "markdown",
]);
export const UX_ACTS = ["navigate", "complete", "open_url", "none"];
export const UX_ACT_LABEL: Record<string, string> = {
  navigate: "Ir para outra tela",
  complete: "Finalizar o fluxo",
  open_url: "Abrir um link",
  none: "Não fazer nada",
  data_exchange: "Enviar dados (avançado)",
  update_data: "Atualizar dados (avançado)",
};

/** Resumo textual de uma ação (usado nos previews). */
export function actionSummary(a: any): string {
  if (!a || !a.name || a.name === "none")
    return '<span style="color:var(--wa-mut)">sem ação</span>';
  const esc = (s: string) =>
    String(s == null ? "" : s).replace(
      /[&<>"']/g,
      (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
    );
  if (a.name === "navigate") return "→ " + esc(a.next || "(defina a tela)");
  if (a.name === "complete") return "✓ concluir fluxo";
  if (a.name === "open_url") return "↗ " + esc(a.url || "URL");
  if (a.name === "data_exchange") return "⇄ trocar dados";
  if (a.name === "update_data") return "⟳ atualizar dados";
  return esc(a.name);
}
