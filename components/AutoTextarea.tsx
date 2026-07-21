"use client";
// ============================================================
// Textarea com auto-crescimento vertical (sem corte)
// ============================================================
import React, { useEffect, useRef } from "react";

export function grow(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  const max = parseFloat(getComputedStyle(el).maxHeight) || 1e5;
  const h = Math.min(el.scrollHeight + 2, max);
  el.style.height = h + "px";
  el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
}

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const AutoTextarea = React.forwardRef<HTMLTextAreaElement, Props>(function AutoTextarea(
  props,
  ref,
) {
  const innerRef = useRef<HTMLTextAreaElement | null>(null);
  const setRef = (el: HTMLTextAreaElement | null) => {
    innerRef.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
  };
  useEffect(() => {
    grow(innerRef.current);
  }, [props.value]);
  return (
    <textarea
      {...props}
      ref={setRef}
      onInput={(e) => {
        grow(e.currentTarget);
        props.onInput?.(e);
      }}
    />
  );
});

export default AutoTextarea;
