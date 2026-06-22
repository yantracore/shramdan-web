"use client";

// Shared success state used by /join and /feedback after a form submits.
// Replaces the form with a confirmation card carrying:
//   - big check seal
//   - bilingual thank-you copy
//   - share row (Facebook / X / WhatsApp / Telegram / copy link) so the
//     user can invite a friend right away
//   - "Submit another" reset button
//
// shareTitle / shareText feed the share URLs and the Web Share API.

import { CheckCircleFilled, CopyOutlined } from "@ant-design/icons";
import { useState } from "react";
import { FaFacebookF, FaTelegram, FaWhatsapp, FaXTwitter } from "react-icons/fa6";
import { ConfettiBurst } from "@/components/ConfettiBurst";

const COPY = {
  np: {
    badge: "धन्यवाद",
    submitAnother: "अर्को पठाउने",
    shareHeading: "साथीलाई पनि निम्तो दिनुहोस्",
    shareSubtle: "श्रमदान सामूहिक मञ्च हो — जति बढी हात, उति ठूलो काम।",
    copyLink: "लिङ्क प्रतिलिपि गर्ने",
    copied: "प्रतिलिपि भयो"
  },
  en: {
    badge: "Thank you",
    submitAnother: "Submit another",
    shareHeading: "Invite a friend",
    shareSubtle: "Shramdan is collective — more hands, bigger work.",
    copyLink: "Copy link",
    copied: "Copied"
  }
};

function buildShareLinks({ url, text }) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  return [
    { id: "facebook", label: "Share on Facebook", Icon: FaFacebookF, href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { id: "twitter", label: "Share on X", Icon: FaXTwitter, href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
    { id: "whatsapp", label: "Share on WhatsApp", Icon: FaWhatsapp, href: `https://wa.me/?text=${t}%20${u}` },
    { id: "telegram", label: "Share on Telegram", Icon: FaTelegram, href: `https://t.me/share/url?url=${u}&text=${t}` }
  ];
}

export function SubmissionSuccessCard({
  language = "np",
  title,
  body,
  shareUrl,
  shareTitle,
  shareText,
  onReset
}) {
  const t = COPY[language] || COPY.np;
  const [copied, setCopied] = useState(false);
  const shareLinks = buildShareLinks({ url: shareUrl, text: shareText || shareTitle });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore — clipboard may be unavailable
    }
  };

  return (
    <article className="submission-success-card" role="status">
      <ConfettiBurst />
      <div className="submission-success-seal" aria-hidden="true">
        <CheckCircleFilled />
      </div>
      <span className="submission-success-eyebrow">{t.badge}</span>
      <h2 className="submission-success-title">{title}</h2>
      {body ? <p className="submission-success-body">{body}</p> : null}

      <div className="submission-success-share">
        <h3 className="submission-success-share-heading">{t.shareHeading}</h3>
        <p className="submission-success-share-subtle">{t.shareSubtle}</p>
        <div className="submission-success-share-row">
          {shareLinks.map(({ id, label, Icon, href }) => (
            <a
              key={id}
              aria-label={label}
              className="submission-success-share-button"
              href={href}
              rel="noreferrer"
              target="_blank"
            >
              <Icon aria-hidden="true" focusable="false" />
            </a>
          ))}
          <button
            type="button"
            className="submission-success-share-button submission-success-share-copy"
            onClick={handleCopy}
          >
            <CopyOutlined aria-hidden="true" />
            <span>{copied ? t.copied : t.copyLink}</span>
          </button>
        </div>
      </div>

      {onReset ? (
        <button
          type="button"
          className="submission-success-reset"
          onClick={onReset}
        >
          {t.submitAnother}
        </button>
      ) : null}
    </article>
  );
}
