"use client";

import { CopyOutlined } from "@ant-design/icons";
import { Button, Tooltip, message } from "antd";
import { useEffect, useState } from "react";
import {
  FacebookIcon,
  FacebookShareButton,
  LinkedinIcon,
  LinkedinShareButton,
  TelegramIcon,
  TelegramShareButton,
  TwitterIcon,
  TwitterShareButton,
  WhatsappIcon,
  WhatsappShareButton
} from "react-share";

const ICON_SIZE = 36;

export function IssueShareRow({ title, content, language }) {
  const [shareUrl, setShareUrl] = useState("");
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShareUrl(window.location.href);
    }
  }, []);

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
      messageApi.success(content.detail.shareCopied);
    } catch {
      messageApi.error(content.detail.shareCopied);
    }
  };

  if (!shareUrl) {
    return (
      <section className="public-issue-share-row" aria-label={content.detail.shareTitle}>
        <h2>{content.detail.shareTitle}</h2>
        <div className="public-issue-share-buttons" aria-hidden="true" />
      </section>
    );
  }

  return (
    <section className="public-issue-share-row" aria-label={content.detail.shareTitle}>
      {contextHolder}
      <h2>{content.detail.shareTitle}</h2>
      <div className="public-issue-share-buttons">
        <FacebookShareButton url={shareUrl} hashtag="#Shramdan">
          <FacebookIcon size={ICON_SIZE} round />
        </FacebookShareButton>
        <TwitterShareButton url={shareUrl} title={shareText}>
          <TwitterIcon size={ICON_SIZE} round />
        </TwitterShareButton>
        <WhatsappShareButton url={shareUrl} title={shareText} separator=" — ">
          <WhatsappIcon size={ICON_SIZE} round />
        </WhatsappShareButton>
        <TelegramShareButton url={shareUrl} title={shareText}>
          <TelegramIcon size={ICON_SIZE} round />
        </TelegramShareButton>
        <LinkedinShareButton url={shareUrl} title={shareText} source={brand}>
          <LinkedinIcon size={ICON_SIZE} round />
        </LinkedinShareButton>
        <Tooltip title={content.detail.shareCopyLink}>
          <Button
            aria-label={content.detail.shareCopyLink}
            className="public-issue-share-copy"
            icon={<CopyOutlined />}
            onClick={handleCopy}
            shape="circle"
            size="large"
          />
        </Tooltip>
      </div>
    </section>
  );
}
