// ============================================================
// Formatação de JSON e utilidades de área de transferência/download
// ============================================================

export function escMin(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Realce de sintaxe simples para JSON (retorna HTML). */
export function jsonHi(str: string): string {
  return escMin(str).replace(
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?)/g,
    (m, s1, colon, bool, num) => {
      if (s1) return '<span class="' + (colon ? "k" : "s") + '">' + s1 + "</span>" + (colon || "");
      if (bool) return '<span class="b">' + bool + "</span>";
      if (num) return '<span class="n">' + num + "</span>";
      return m;
    },
  );
}

export function fallbackCopy(str: string): boolean {
  try {
    const ta = document.createElement("textarea");
    ta.value = str;
    ta.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    return true;
  } catch {
    return false;
  }
}

export function copyText(str: string, onOk: () => void, onFail: () => void) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(str)
      .then(onOk)
      .catch(() => (fallbackCopy(str) ? onOk() : onFail()));
  } else if (fallbackCopy(str)) onOk();
  else onFail();
}

export function downloadJSON(str: string, name: string): boolean {
  try {
    const b = new Blob([str], { type: "application/json" });
    const u = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = u;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 800);
    return true;
  } catch {
    return false;
  }
}
