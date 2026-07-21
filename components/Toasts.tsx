"use client";
// ============================================================
// Toasts
// ============================================================
import React from "react";
import { Icon } from "@/lib/icons";
import { useToast } from "@/store/toast";

export default function Toasts() {
  const { toasts } = useToast();
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div
          className="toast"
          key={t.id}
          style={t.leaving ? { opacity: 0, transition: ".3s" } : undefined}
        >
          <span className="ti">
            <Icon name={t.kind === "warn" ? "warn" : "check"} size={15} />
          </span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
