"use client";

// ShareAsContribution — roadmap 5.5.
// A small card that frames the share action as a contribution
// channel. Reuses the social share buttons pattern from
// IssueShareRow but with event-specific framing.
//
// Behaviour: no backend write; the contribution kind is "VISIBILITY"
// in the spec, captured passively (open share dialog = intent).
// Production could log a `share_intent` analytics event.

import { CopyOutlined, ShareAltOutlined } from "@ant-design/icons";
import { Button, message } from "antd";
import { useEffect, useState } from "react";
import {
  FacebookIcon,
  FacebookShareButton,
  TelegramIcon,
  TelegramShareButton,
  TwitterIcon,
  TwitterShareButton,
  WhatsappIcon,
  WhatsappShareButton
} from "react-share";

const ICON_SIZE = 32;

const COPY = {
  np: {
    eyebrow: "बाँड्नु पनि योगदान हो",
    title: "अभियान शेयर गरेर साथीहरूलाई जोड्नुहोस्",
    intro:
      "तपाईंले बाँड्नुभएको हरेक लिङ्कले अरू दुई-चार जना सहभागी ल्याउनसक्छ। यो आफैमा एक योगदान हो।",
    facebook: "Facebook",
    twitter: "X / Twitter",
    whatsapp: "WhatsApp",
    telegram: "Telegram",
    copyCta: "लिङ्क कपी",
    copyDone: "लिङ्क कपी भयो"
  },
  en: {
    eyebrow: "Sharing is contributing",
    title: "Share this campaign and bring people in",
    intro:
      "Every link you share could bring two or three more participants. That counts as contributing.",
    facebook: "Facebook",
    twitter: "X / Twitter",
    whatsapp: "WhatsApp",
    telegram: "Telegram",
    copyCta: "Copy link",
    copyDone: "Link copied"
  }
};

export function ShareAsContribution({ event, language = "np" }) {
  const t = COPY[language] || COPY.np;
  const [shareUrl, setShareUrl] = useState("");
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShareUrl(window.location.href);
    }
  }, []);

  const title = event?.title || event?.linkedIssue?.title || "श्रमदान";
  const brand = language === "np" ? "श्रमदान" : "Shramdan";
  const shareText = `${title} — ${brand}`;

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = shareUrl;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      messageApi.success(t.copyDone);
    } catch {
      messageApi.error(t.copyCta);
    }
  };

  return (
    <section className="share-as-contribution" aria-labelledby="share-as-contribution-title">
      {contextHolder}
      <header className="share-as-contribution-header">
        <span className="eyebrow">
          <ShareAltOutlined aria-hidden="true" /> {t.eyebrow}
        </span>
        <h2 id="share-as-contribution-title">{t.title}</h2>
        <p>{t.intro}</p>
      </header>
      <div className="share-as-contribution-row">
        <FacebookShareButton url={shareUrl} title={shareText} aria-label={t.facebook}>
          <FacebookIcon size={ICON_SIZE} round />
        </FacebookShareButton>
        <TwitterShareButton url={shareUrl} title={shareText} aria-label={t.twitter}>
          <TwitterIcon size={ICON_SIZE} round />
        </TwitterShareButton>
        <WhatsappShareButton url={shareUrl} title={shareText} aria-label={t.whatsapp}>
          <WhatsappIcon size={ICON_SIZE} round />
        </WhatsappShareButton>
        <TelegramShareButton url={shareUrl} title={shareText} aria-label={t.telegram}>
          <TelegramIcon size={ICON_SIZE} round />
        </TelegramShareButton>
        <Button
          icon={<CopyOutlined />}
          onClick={handleCopy}
          className="share-as-contribution-copy"
        >
          {t.copyCta}
        </Button>
      </div>
    </section>
  );
}
