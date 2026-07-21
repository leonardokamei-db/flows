// ============================================================
// Ícones (SVG inline, currentColor) — portados do app original
// ============================================================
import React from "react";

export const IP: Record<string, string> = {
  logo: '<path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3z" fill="rgba(255,255,255,.18)" stroke="none"/><circle cx="8.5" cy="12" r="1.3" fill="#fff" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="#fff" stroke="none"/><circle cx="15.5" cy="12" r="1.3" fill="#fff" stroke="none"/>',
  heading: '<path d="M5 5v14M15 5v14M5 12h10"/><path d="M18 8h1.5v6"/>',
  subheading: '<path d="M5 6v12M13 6v12M5 12h8"/><path d="M17 10h2v5"/>',
  body: '<path d="M4 6h16M4 11h16M4 16h11"/>',
  caption: '<path d="M5 8h14M5 12h14M5 16h8"/>',
  rich: '<path d="M4 5h16M4 10h9M4 15h16M4 20h6"/><path d="M15 9l2 2 3-4"/>',
  input: '<rect x="3" y="8" width="18" height="8" rx="2.2"/><path d="M7 12h1.5"/>',
  textarea:
    '<rect x="3" y="5" width="18" height="14" rx="2.2"/><path d="M7 9.5h10M7 13h6"/>',
  date: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.4"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
  calendar:
    '<rect x="3.5" y="5" width="17" height="15.5" rx="2.4"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><circle cx="8.5" cy="14" r="1.2" fill="currentColor" stroke="none"/><circle cx="12.5" cy="14" r="1.2" fill="currentColor" stroke="none"/>',
  checkbox:
    '<rect x="3" y="4.5" width="7.5" height="7.5" rx="1.8"/><path d="m4.6 8.2 1.4 1.4 2.4-3"/><path d="M14 6.2h6M14 10h4"/><rect x="3" y="14.5" width="7.5" height="7.5" rx="1.8"/><path d="M14 16.2h6M14 20h4"/>',
  radio:
    '<circle cx="6.7" cy="7.5" r="3.4"/><circle cx="6.7" cy="7.5" r="1.1" fill="currentColor" stroke="none"/><path d="M13.5 6.2h6.5M13.5 9.8h4.5"/><circle cx="6.7" cy="16.5" r="3.4"/><path d="M13.5 15.2h6.5M13.5 18.8h4.5"/>',
  dropdown:
    '<rect x="3" y="6.5" width="18" height="11" rx="2.4"/><path d="m14 10.5 2 2 2-2"/><path d="M7 12h4"/>',
  footer:
    '<rect x="3" y="9" width="18" height="6.5" rx="3.25"/><path d="M9.5 12.2h5"/>',
  link: '<path d="M10.5 13.5a4 4 0 0 0 5.7 0l2.3-2.3a4 4 0 0 0-5.7-5.7l-1.2 1.2"/><path d="M13.5 10.5a4 4 0 0 0-5.7 0l-2.3 2.3a4 4 0 0 0 5.7 5.7l1.2-1.2"/>',
  optin:
    '<rect x="3.5" y="6" width="7" height="7" rx="1.8"/><path d="m5 9.5 1.3 1.3L9 8"/><path d="M14 7.5h6.5M14 11.5h4.5"/>',
  image:
    '<rect x="3" y="4.5" width="18" height="15" rx="2.4"/><circle cx="8.5" cy="9.5" r="1.9"/><path d="m4 17 5-4.5 4 3 3.2-2.3L21 16"/>',
  iff: '<circle cx="6" cy="5.5" r="2.2"/><path d="M6 7.7v4.3c0 2 1.2 3.2 3.4 3.2H16"/><path d="m13.5 12.2 3 3-3 3"/><path d="M6 12v0"/>',
  switch:
    '<circle cx="5.5" cy="12" r="2.2"/><path d="M7.7 12h3.8l2.5-4H20M11.5 12l2.5 4H20"/><path d="m17.5 5.5 2.5 2.5-2.5 2.5M17.5 13.5l2.5 2.5-2.5 2.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash:
    '<path d="M4 7h16M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7M6.5 7l.8 12.2A1.5 1.5 0 0 0 8.8 20.6h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2.2"/><path d="M5.5 15.5H5a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 5 3.5h9A1.5 1.5 0 0 1 15.5 5v.5"/>',
  grip: '<circle cx="9" cy="6" r="1.35" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.35" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.35" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.35" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.35" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.35" fill="currentColor" stroke="none"/>',
  export: '<path d="M12 3v13M8 11l4 4 4-4M4.5 20.5h15"/>',
  import: '<path d="M12 16V3M8 8l4-4 4 4M4.5 20.5h15"/>',
  map: '<path d="M9 4 3.5 6v13.5L9 17.5l6 2 5.5-2V4l-5.5 2-6-2z"/><path d="M9 4v13.5M15 6v13.5"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  warn: '<path d="M12 3.5 2.5 20h19L12 3.5z"/><path d="M12 9.5v5M12 17.5h.01"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 7.7h.01"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  undo: '<path d="M9 7 4 12l5 5M4.5 12H15a5 5 0 0 1 0 10h-2"/>',
  redo: '<path d="m15 7 5 5-5 5M19.5 12H9a5 5 0 0 0 0 10h2"/>',
  back: '<path d="M15 5 8 12l7 7"/>',
  dots: '<circle cx="5.5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.5 4.5l1.8 1.8M17.7 17.7l1.8 1.8M19.5 4.5l-1.8 1.8M6.3 17.7l-1.8 1.8"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 13a1.5 1.5 0 0 0 .3 1.7l.1.1a1.8 1.8 0 1 1-2.5 2.5l-.1-.1a1.5 1.5 0 0 0-2.6 1v.1a1.8 1.8 0 0 1-3.6 0V19a1.5 1.5 0 0 0-2.6-1l-.1.1a1.8 1.8 0 1 1-2.5-2.5l.1-.1a1.5 1.5 0 0 0-1-2.6H4a1.8 1.8 0 0 1 0-3.6h.1a1.5 1.5 0 0 0 1-2.6L5 4.9a1.8 1.8 0 1 1 2.5-2.5l.1.1a1.5 1.5 0 0 0 1.7.3H9.4a1.5 1.5 0 0 0 .9-1.4V1a1.8 1.8 0 0 1 3.6 0v.1a1.5 1.5 0 0 0 2.6 1l.1-.1a1.8 1.8 0 1 1 2.5 2.5l-.1.1a1.5 1.5 0 0 0-.3 1.7V6.6a1.5 1.5 0 0 0 1.4.9H23a1.8 1.8 0 0 1 0 3.6h-.1a1.5 1.5 0 0 0-1.4.9z"/>',
  flag: '<path d="M5 21V4M5 4l9 .5 5 3-5 3-9-.5"/>',
};

export function Icon({
  name,
  size = 19,
  className = "ic",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: IP[name] || "" }}
    />
  );
}
