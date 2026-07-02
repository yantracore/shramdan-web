"use client";

// Wraps the shared <TertiaryButton> with print-specific behavior:
// click → window.print(). The browser's print dialog has a built-in
// Save-as-PDF option, so we don't ship a PDF library.

import { PrinterOutlined } from "@ant-design/icons";
import { useCallback } from "react";
import { TertiaryButton } from "@/components/TertiaryButton";

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
    <TertiaryButton
      onClick={onClick}
      className={className}
      icon={<PrinterOutlined />}
      aria-label={t.label}
    >
      {t.label}
    </TertiaryButton>
  );
}
