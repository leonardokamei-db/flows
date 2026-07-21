// ============================================================
// Markdown mínimo para preview (retorna HTML string)
// ============================================================
import { esc } from "./utils";

export function mdInline(t: string): string {
  t = esc(t);
  t = t.replace(/~~\*\*\*(.+?)\*\*\*~~/g, "<del><strong><em>$1</em></strong></del>");
  t = t.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/~~(.+?)~~/g, "<del>$1</del>");
  t = t.replace(/\*(.+?)\*/g, "<em>$1</em>");
  t = t.replace(/\[(.+?)\]\((.+?)\)/g, "<a>$1</a>");
  return t;
}

export function renderRich(lines: string[] | string): string {
  const arr = Array.isArray(lines) ? lines : String(lines || "").split(/\n/);
  let html = "";
  let list: string | null = null;
  const closeList = () => {
    if (list) {
      html += "</" + list + ">";
      list = null;
    }
  };
  for (const raw of arr) {
    const l = (raw || "").trim();
    if (!l) {
      closeList();
      continue;
    }
    if (/^#\s+/.test(l)) {
      closeList();
      html += "<h1>" + mdInline(l.replace(/^#\s+/, "")) + "</h1>";
    } else if (/^##\s+/.test(l)) {
      closeList();
      html += "<h2>" + mdInline(l.replace(/^##\s+/, "")) + "</h2>";
    } else if (/^#{3,}\s+/.test(l)) {
      closeList();
      html += "<p>" + mdInline(l.replace(/^#{3,}\s+/, "")) + "</p>";
    } else if (/^[-+*]\s+/.test(l)) {
      if (list !== "ul") {
        closeList();
        list = "ul";
        html += "<ul>";
      }
      html += "<li>" + mdInline(l.replace(/^[-+*]\s+/, "")) + "</li>";
    } else if (/^\d+\.\s+/.test(l)) {
      if (list !== "ol") {
        closeList();
        list = "ol";
        html += "<ol>";
      }
      html += "<li>" + mdInline(l.replace(/^\d+\.\s+/, "")) + "</li>";
    } else {
      closeList();
      html += "<p>" + mdInline(l) + "</p>";
    }
  }
  closeList();
  return html || '<p style="color:var(--wa-mut)">Texto formatado…</p>';
}
