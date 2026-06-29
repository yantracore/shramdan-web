"use client";

// CampaignParticipationModal — the ONE modal for joining/supporting a campaign
// at every lifecycle stage and from every entry point (issue support, event
// join, promoted-issue join). It frames the shared ParticipantsPanel with the
// campaign's identity (cover + title + status + when/where) so a user who steps
// away and returns always knows what they're committing to, and is vertically
// centred with a scrollable role list so it never drifts by content height. The
// "I'm interested" shortcut shows only when onInterested is provided (OPEN
// issues). Purely presentational — all data + handlers come from the caller.

import { useState } from "react";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleFilled,
  EnvironmentOutlined,
  HeartOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { Modal } from "antd";
import { ParticipantsPanel } from "@/components/ParticipantsPanel";
import { formatCampaignDateTime } from "@/lib/nepaliDate";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
function localizeDigits(value, language) {
  const s = String(value ?? "");
  return language === "np" ? s.replace(/\d/g, (d) => NP_DIGITS[Number(d)]) : s;
}

const COPY = {
  np: {
    interested: "मलाई रुचि छ",
    interestedHint: "अहिले भूमिका नछानी, समर्थन मात्र दर्ता गर्नुहोस्",
    interestedSaving: "दर्ता हुँदै…",
    interestedActive: "समर्थन गरियो",
    interestedWithdrawHint: "हटाउन क्लिक गर्नुहोस्",
    interestedWithdrawing: "हट्दै…",
    orJoin: "वा कुनै भूमिकामा जोडिनुहोस्",
    fallbackTitle: "अभियान",
    durationMin: "{n} मिनेट",
    planningHint: "तालिका तय हुँदै"
  },
  en: {
    interested: "I'm interested",
    interestedHint: "Just register your support, no role yet",
    interestedSaving: "Registering…",
    interestedActive: "Supported",
    interestedWithdrawHint: "Click to withdraw",
    interestedWithdrawing: "Withdrawing…",
    orJoin: "Or join in a role",
    fallbackTitle: "Campaign",
    durationMin: "{n} min",
    planningHint: "Schedule being set"
  }
};

// Pinned header: small cover strip + title + status chip + a status-aware
// context line. Rendered as the Modal's `title` node so it stays fixed while the
// roster body scrolls. Conversion/fill progress is NOT shown here — the panel
// already shows it next to its "Participants" heading.
function CampaignModalHeader({ campaign, language, t }) {
  if (!campaign) return null;
  const { title, coverUrl, status, statusLabel, location, scheduledAt, durationMinutes } = campaign;

  let context = null;
  if (scheduledAt) {
    context = (
      <>
        <span>
          <CalendarOutlined aria-hidden="true" /> {formatCampaignDateTime(scheduledAt, language)}
        </span>
        {durationMinutes ? (
          <span>
            <ClockCircleOutlined aria-hidden="true" />{" "}
            {t.durationMin.replace("{n}", localizeDigits(durationMinutes, language))}
          </span>
        ) : null}
        {location ? (
          <span>
            <EnvironmentOutlined aria-hidden="true" /> {location}
          </span>
        ) : null}
      </>
    );
  } else if (status === "draft") {
    context = (
      <>
        <span>{t.planningHint}</span>
        {location ? (
          <span>
            <EnvironmentOutlined aria-hidden="true" /> {location}
          </span>
        ) : null}
      </>
    );
  } else if (location) {
    context = (
      <span>
        <EnvironmentOutlined aria-hidden="true" /> {location}
      </span>
    );
  }

  return (
    <div className="campaign-modal-header">
      <div
        className={`campaign-modal-cover${coverUrl ? "" : " campaign-modal-cover--fallback"}`}
        style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
        aria-hidden="true"
      >
        {coverUrl ? null : <TeamOutlined />}
      </div>
      <div className="campaign-modal-headmeta">
        <span className="campaign-modal-title">{title || t.fallbackTitle}</span>
        {statusLabel ? (
          <span className="campaign-modal-statusline">
            <span className="campaign-modal-status-chip" data-status={status}>
              {statusLabel}
            </span>
          </span>
        ) : null}
        {context ? <span className="campaign-modal-context">{context}</span> : null}
      </div>
    </div>
  );
}

export function CampaignParticipationModal({
  open,
  onClose,
  language = "np",
  campaign = null,
  onInterested,
  // OPEN issues only: when the viewer already holds a plain INTERESTED vote (no
  // role, so there's no roster row to withdraw from), the interested block turns
  // into a one-click withdraw via onWithdraw. Absent for events.
  interestedActive = false,
  onWithdraw,
  panelProps
}) {
  const t = COPY[language] || COPY.np;
  const [interestedPending, setInterestedPending] = useState(false);
  const [withdrawPending, setWithdrawPending] = useState(false);

  // A successful join/lead dismisses the modal; a thrown error keeps it open
  // (the page handler re-throws only on real failures).
  const closeAfter = (fn) =>
    fn
      ? async (...args) => {
          await fn(...args);
          onClose?.();
        }
      : fn;

  const wrappedPanelProps = {
    ...panelProps,
    onJoin: closeAfter(panelProps?.onJoin),
    onLead: closeAfter(panelProps?.onLead)
  };

  const handleInterested = async () => {
    if (interestedPending || !onInterested) return;
    setInterestedPending(true);
    try {
      await onInterested();
      onClose?.();
    } catch {
      /* page surfaces its own error toast; the modal stays open */
    } finally {
      setInterestedPending(false);
    }
  };

  const handleWithdraw = async () => {
    if (withdrawPending || !onWithdraw) return;
    setWithdrawPending(true);
    try {
      await onWithdraw();
      onClose?.();
    } catch {
      /* page surfaces its own error toast; the modal stays open */
    } finally {
      setWithdrawPending(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={680}
      centered
      title={<CampaignModalHeader campaign={campaign} language={language} t={t} />}
      destroyOnHidden
      className="support-roles-modal campaign-participation-modal"
      styles={{ body: { maxHeight: "62vh", overflowY: "auto" } }}
    >
      {onInterested ? (
        <>
          {interestedActive ? (
            <button
              type="button"
              className="support-modal-interested is-active"
              onClick={handleWithdraw}
              disabled={withdrawPending}
              aria-label={`${t.interestedActive} — ${t.interestedWithdrawHint}`}
            >
              <span className="support-modal-interested-icon">
                <CheckCircleFilled aria-hidden="true" />
              </span>
              <span className="support-modal-interested-text">
                <strong>{withdrawPending ? t.interestedWithdrawing : t.interestedActive}</strong>
                <span>{t.interestedWithdrawHint}</span>
              </span>
            </button>
          ) : (
            <button
              type="button"
              className="support-modal-interested"
              onClick={handleInterested}
              disabled={interestedPending}
            >
              <span className="support-modal-interested-icon">
                <HeartOutlined aria-hidden="true" />
              </span>
              <span className="support-modal-interested-text">
                <strong>{interestedPending ? t.interestedSaving : t.interested}</strong>
                <span>{t.interestedHint}</span>
              </span>
            </button>
          )}
          <div className="support-modal-divider">
            <span>{t.orJoin}</span>
          </div>
        </>
      ) : null}

      <ParticipantsPanel {...wrappedPanelProps} embedded language={language} />
    </Modal>
  );
}
