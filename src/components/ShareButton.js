"use client";

// Generic share button used on issue + event detail pages.
//
//   • Uses navigator.share when available (mobile + most modern desktop)
//     so the OS-native share sheet handles the routing.
//   • Falls back to copying the URL to the clipboard with a "copied"
//     toast / button-state swap.
//   • Tap-out hides the "Link copied" confirmation after 1.8s.
//
// Pass `url`, `title`, `text` props to override the auto-derived values
// (defaults: current window.location.href, document.title, "").

import { CheckOutlined, ShareAltOutlined } from "@ant-design/icons";
import { Button, message } from "antd";
import { useState } from "react";

const COPY = {
  np: {
    share: "साझा गर्नुहोस्",
    copied: "लिङ्क प्रतिलिपि भयो",
    copiedToast: "लिङ्क क्लिपबोर्डमा सारियो",
    copyFailed: "साझा गर्न सकिएन",
    aria: "यो पृष्ठ साझा गर्नुहोस्"
  },
  en: {
    share: "Share",
    copied: "Link copied",
    copiedToast: "Link copied to clipboard",
    copyFailed: "Couldn't share",
    aria: "Share this page"
  }
};

export function ShareButton({
  url,
  title,
  text,
  language = "np",
  size = "middle",
  className = "",
  type = "default"
}) {
  const t = COPY[language] || COPY.np;
  const [messageApi, contextHolder] = message.useMessage();
  const [copied, setCopied] = useState(false);

  const resolvedUrl =
    url ||
    (typeof window !== "undefined" ? window.location.href : "");
  const resolvedTitle =
    title ||
    (typeof document !== "undefined" ? document.title : "");

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(resolvedUrl);
      setCopied(true);
      messageApi.success(t.copiedToast);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      messageApi.error(t.copyFailed);
    }
  };

  const handleClick = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: resolvedTitle,
          text: text || resolvedTitle,
          url: resolvedUrl
        });
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
    }
    copyToClipboard();
  };

  return (
    <>
      {contextHolder}
      <Button
        type={type}
        size={size}
        icon={copied ? <CheckOutlined /> : <ShareAltOutlined />}
        onClick={handleClick}
        aria-label={t.aria}
        className={`share-button${copied ? " is-copied" : ""}${className ? ` ${className}` : ""}`}
      >
        {copied ? t.copied : t.share}
      </Button>
    </>
  );
}
