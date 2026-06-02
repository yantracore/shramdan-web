"use client";

// Small button that triggers window.print(). On screen it's a discreet
// outline pill; in @media print the rest of the chrome (header, FAB,
// notifications etc.) is hidden via a print-only CSS rule so what
// actually prints is just the main article. No PDF lib — we rely on
// the browser's Save-as-PDF in the system print dialog.

import { PrinterOutlined } from "@ant-design/icons";
import { useCallback } from "react";

const COPY = {
  np: { label: "PDF/प्रिन्ट" },
  en: { label: "Print / Save PDF" }
};

export function PrintButton({ language = "np", className = "" }) {
  const t = COPY[language] || COPY.np;
  const onClick = useCallback(() => {
    if (typeof window !== "undefined") {
      window.print();
    }
  }, []);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`print-button${className ? ` ${className}` : ""}`}
      aria-label={t.label}
    >
      <PrinterOutlined aria-hidden="true" /> {t.label}
    </button>
  );
}
