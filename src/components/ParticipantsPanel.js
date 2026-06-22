"use client";

// ParticipantsPanel — the ONE participation surface shared by both the issue
// detail page and the event detail page. An issue is just a not-yet-scheduled
// event, so "who's pitching in, in which role" is the same view at every
// lifecycle stage. Only the *data source* and the *join/leave action* differ
// between the two, and those are injected by the page:
//
//   • issue  → roster from GET /issues/{id}/participants + eventRoleCounts;
//              join = POST /issues/{id}/vote {GOING, eventRole}; leave = retract
//   • event  → roster from rolePlan/participants; join = POST
//              /events/{id}/participants {role}; leave = DELETE participant
//
// The page passes normalized `roles`, the viewer's own participation, an
// optional progress bar spec, which roles accept a join right now, and async
// `onJoin(role)` / `onLeave()` handlers. This component owns ONLY presentation
// + the join/leave pending state — no API calls, no issue-vs-event branching.
//
// Props
//   roles          [{ role, count, target?, names: string[] }]  display order
//   viewer         { role, status, name } | null   the caller's own row
//   progress       { current, target, variant: "conversion" | "fill" } | null
//   joinableRoles  string[] | null   roles that accept a join now (null = all)
//   canLeave       boolean           whether the viewer may withdraw right now
//   onJoin         async (role) => void
//   onLeave        async () => void

import { useState } from "react";
import {
  CameraOutlined,
  CheckCircleFilled,
  CloseOutlined,
  InboxOutlined,
  MedicineBoxOutlined,
  SafetyOutlined,
  TeamOutlined,
  ToolOutlined,
  VideoCameraOutlined
} from "@ant-design/icons";
import { Popconfirm } from "antd";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

function getInitial(name) {
  const trimmed = String(name || "").trim();
  return trimmed ? Array.from(trimmed)[0] : "?";
}

const ROLE_COLORS = {
  WORKER: "#2e7d32",
  PHOTOGRAPHER: "#7b3fa0",
  LIVESTREAMER: "#d2360b",
  MEDIC: "#b42318",
  SAFETY_LEAD: "#b7791f",
  COORDINATOR: "#176b5c",
  LOGISTICS: "#1d4ed8"
};

// Each role gets a glanceable icon so the menu reads at a scan, not a wall of
// text. Kept in one place so issue + event always show the same mark per role.
const ROLE_ICONS = {
  WORKER: ToolOutlined,
  PHOTOGRAPHER: CameraOutlined,
  LIVESTREAMER: VideoCameraOutlined,
  MEDIC: MedicineBoxOutlined,
  SAFETY_LEAD: SafetyOutlined,
  COORDINATOR: TeamOutlined,
  LOGISTICS: InboxOutlined
};

const MAX_VISIBLE_CHIPS = 3;

const COPY = {
  np: {
    heading: "सहभागीहरू",
    intro: "तपाईंलाई सुहाउने भूमिकामा जोडिनुहोस् — हरेक भूमिकाले श्रमदान चलाउँछ।",
    roleCount: "{n} जना",
    filledOf: "{filled} / {total}",
    join: "जोडिनुहोस्",
    joining: "जोडिँदै…",
    openPill: "{n} खाली",
    fullPill: "पूरा",
    youreIn: "जोडिनुभयो",
    waitlisted: "प्रतीक्षामा",
    checkedIn: "चेक-इन",
    countLabel: "{n} सहभागी",
    you: "तपाईं",
    leave: "हट्ने",
    leaving: "हट्दै…",
    leaveConfirmTitle: "सहभागिता फिर्ता गर्ने?",
    leaveConfirmDesc: "तपाईंको नाम सहभागी सूचीबाट हट्नेछ। मन लागे फेरि जोडिन सकिन्छ।",
    leaveOk: "फिर्ता गर्नुहोस्",
    leaveCancel: "रहन्छु",
    moreFilled: "+{n}",
    progressFillLabel: "{filled} / {total} स्थान पूरा",
    progressFillFull: "सबै {total} स्थान पूरा",
    progressOpen: "{n} खाली",
    conversionEyebrow: "अभियानतर्फको यात्रा",
    conversionTitle: "कति जना सामेल भए, यो सफाइ अभियान बन्छ",
    conversionGoingOne: "{n} जना सामेल हुने भए",
    conversionGoingMany: "{n} जना सामेल हुने भए",
    conversionGoingNone: "अहिलेसम्म कोही सामेल भएका छैनन् — पहिलो बन्नुहोस्!",
    conversionRemaining: "अभियान तय हुन अझै {n} जना चाहिन्छ",
    conversionReady: "पर्याप्त समर्थन जुट्यो — अभियान तय हुँदैछ!",
    roles: {
      WORKER: "कामदार",
      PHOTOGRAPHER: "फोटोग्राफर",
      LIVESTREAMER: "लाइभस्ट्रिमर",
      MEDIC: "स्वास्थ्यकर्मी",
      SAFETY_LEAD: "सुरक्षा प्रमुख",
      COORDINATOR: "संयोजक",
      LOGISTICS: "लजिस्टिक्स"
    }
  },
  en: {
    heading: "Participants",
    intro: "Join in the role that fits you — every role keeps the cleanup running.",
    roleCount: "{n}",
    filledOf: "{filled} / {total}",
    join: "Join",
    joining: "Joining…",
    openPill: "{n} open",
    fullPill: "Full",
    youreIn: "You Joined",
    waitlisted: "Waitlisted",
    checkedIn: "Checked in",
    countLabel: "{n} participants",
    you: "you",
    leave: "Leave",
    leaving: "Leaving…",
    leaveConfirmTitle: "Withdraw your spot?",
    leaveConfirmDesc: "Your name comes off the participant list. You can join again anytime.",
    leaveOk: "Withdraw",
    leaveCancel: "Stay",
    moreFilled: "+{n}",
    progressFillLabel: "{filled} of {total} spots filled",
    progressFillFull: "All {total} spots filled",
    progressOpen: "{n} open",
    conversionEyebrow: "Toward a campaign",
    conversionTitle: "When enough people commit, this becomes a real cleanup",
    conversionGoingOne: "{n} person committed to join",
    conversionGoingMany: "{n} people committed to join",
    conversionGoingNone: "No one's committed yet — be the first!",
    conversionRemaining: "{n} more needed to schedule the campaign",
    conversionReady: "Enough support — the campaign is being scheduled!",
    roles: {
      WORKER: "Worker",
      PHOTOGRAPHER: "Photographer",
      LIVESTREAMER: "Livestreamer",
      MEDIC: "Medic",
      SAFETY_LEAD: "Safety Lead",
      COORDINATOR: "Coordinator",
      LOGISTICS: "Logistics"
    }
  }
};

function ConversionProgress({ t, language, current, target }) {
  const hasTarget = Number.isFinite(target) && target > 0;
  const fillPercent = hasTarget ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const remaining = hasTarget ? Math.max(0, target - current) : 0;
  const isReady = hasTarget && current >= target;
  const goingLine =
    current === 0
      ? t.conversionGoingNone
      : (current === 1 ? t.conversionGoingOne : t.conversionGoingMany).replace(
          "{n}",
          localizeDigits(current, language)
        );
  return (
    <div
      className={`event-roster-progress participants-progress participants-progress--conversion ${
        isReady ? "is-full" : ""
      }`}
      role="group"
      aria-label={goingLine}
    >
      <header className="participants-progress-head">
        <span className="event-detail-zone-eyebrow">{t.conversionEyebrow}</span>
        <h3 className="participants-progress-title">{t.conversionTitle}</h3>
      </header>
      <div className="event-roster-progress-bar" aria-hidden="true">
        <span className="event-roster-progress-fill" style={{ width: `${fillPercent}%` }} />
      </div>
      <div className="event-roster-progress-meta">
        <span className="event-roster-progress-count">{goingLine}</span>
        {isReady ? (
          <span className="event-roster-progress-open">{t.conversionReady}</span>
        ) : remaining > 0 ? (
          <span className="event-roster-progress-open">
            {t.conversionRemaining.replace("{n}", localizeDigits(remaining, language))}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function FillProgress({ t, language, current, target }) {
  const hasTarget = Number.isFinite(target) && target > 0;
  if (!hasTarget) return null;
  const filled = Math.min(current, target);
  const open = Math.max(0, target - filled);
  const fillPercent = Math.round((filled / target) * 100);
  const isFull = open === 0;
  const label = isFull
    ? t.progressFillFull.replace("{total}", localizeDigits(target, language))
    : t.progressFillLabel
        .replace("{filled}", localizeDigits(filled, language))
        .replace("{total}", localizeDigits(target, language));
  return (
    <div
      className={`event-roster-progress participants-progress ${isFull ? "is-full" : ""}`}
      role="group"
      aria-label={label}
    >
      <div className="event-roster-progress-bar" aria-hidden="true">
        <span className="event-roster-progress-fill" style={{ width: `${fillPercent}%` }} />
      </div>
      <div className="event-roster-progress-meta">
        <span className="event-roster-progress-count">{label}</span>
        {open > 0 ? (
          <span className="event-roster-progress-open">
            {t.progressOpen.replace("{n}", localizeDigits(open, language))}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function ParticipantsPanel({
  roles = [],
  viewer = null,
  progress = null,
  joinableRoles = null,
  canLeave = false,
  onJoin,
  onLeave,
  language = "np"
}) {
  const t = COPY[language] || COPY.np;
  const [pendingRole, setPendingRole] = useState(null);
  const [leaving, setLeaving] = useState(false);

  const viewerRole = viewer?.role || null;
  const roleJoinable = (role) =>
    !viewerRole && (joinableRoles === null || (Array.isArray(joinableRoles) && joinableRoles.includes(role)));

  // Nothing to show → render nothing (a brand-new issue with no roster and a
  // viewer who hasn't joined, and no progress to nudge).
  const anyFilled = roles.some((r) => (r.count || 0) > 0 || (r.names || []).length > 0);
  const anyJoinable = roles.some((r) => roleJoinable(r.role));
  if (!viewerRole && !anyFilled && !anyJoinable && !progress) return null;

  const handleJoin = async (role) => {
    if (!onJoin || pendingRole) return;
    setPendingRole(role);
    try {
      await onJoin(role);
    } catch {
      // The page surfaces its own error toast; just clear the spinner.
    } finally {
      setPendingRole(null);
    }
  };

  const handleLeave = async () => {
    if (!onLeave || leaving) return;
    setLeaving(true);
    try {
      await onLeave();
    } catch {
      /* page handles messaging */
    } finally {
      setLeaving(false);
    }
  };

  const viewerStatusPill =
    viewer?.status === "INVITED"
      ? t.waitlisted
      : viewer?.status === "CHECKED_IN"
        ? t.checkedIn
        : t.youreIn;

  // Total people committed across all roles — surfaced as a count badge by the
  // heading so the panel answers "how many are in?" at a glance.
  const totalCount = roles.reduce((sum, r) => sum + (Number(r.count) || 0), 0);

  return (
    <section className="participants-panel event-roster-panel" aria-labelledby="participants-title">
      <header className="event-roster-header participants-header">
        <h2 id="participants-title">
          {t.heading}
          {totalCount > 0 ? (
            <span
              className="participants-count-badge"
              aria-label={t.countLabel.replace("{n}", localizeDigits(totalCount, language))}
            >
              {localizeDigits(totalCount, language)}
            </span>
          ) : null}
        </h2>
        <p>{t.intro}</p>
      </header>

      <ul className="event-roster-list">
        {roles.map((row) => {
          const role = row.role;
          const roleColor = ROLE_COLORS[role] || "#176b5c";
          const Icon = ROLE_ICONS[role] || TeamOutlined;
          const roleLabel = t.roles[role] || role;
          const count = Number(row.count) || 0;
          const target = Number.isFinite(Number(row.target)) ? Number(row.target) : null;
          const names = Array.isArray(row.names) ? row.names : [];
          const isOwnRole = viewerRole === role;

          // The viewer's own chip leads the row (highlighted); other names
          // follow. Their name is also spelled out in the status pill so a
          // shared first name is never ambiguous.
          const otherNames = isOwnRole && viewer?.name
            ? names.filter((n) => n !== viewer.name)
            : names;
          const visibleOthers = otherNames.slice(0, isOwnRole ? MAX_VISIBLE_CHIPS - 1 : MAX_VISIBLE_CHIPS);
          const shownCount = visibleOthers.length + (isOwnRole ? 1 : 0);
          const hiddenCount = Math.max(0, count - shownCount);

          const openCount = target !== null ? Math.max(0, target - count) : null;
          const canJoinThis = roleJoinable(role);
          const isFullTargetRow = target !== null && openCount === 0;
          // A row locks (dims) when the viewer is already committed elsewhere.
          const lockedByOther = Boolean(viewerRole) && !isOwnRole;
          const isPending = pendingRole === role;

          return (
            <li
              key={role}
              className={`event-roster-row${isOwnRole ? " is-own-role" : ""}${
                lockedByOther ? " is-locked" : ""
              }`}
            >
              <span
                className="event-roster-role has-icon"
                style={{ "--role-color": roleColor }}
              >
                <Icon className="participants-role-icon" aria-hidden="true" />
                {roleLabel}
              </span>

              <span className="event-roster-count">
                {target !== null
                  ? t.filledOf
                      .replace("{filled}", localizeDigits(count, language))
                      .replace("{total}", localizeDigits(target, language))
                  : count > 0
                    ? t.roleCount.replace("{n}", localizeDigits(count, language))
                    : ""}
              </span>

              <span className="event-roster-chips" aria-hidden={shownCount === 0}>
                {isOwnRole ? (
                  <span
                    className="event-roster-chip event-roster-chip-filled participants-chip-you"
                    style={{ "--role-color": roleColor }}
                    title={viewer?.name || t.you}
                  >
                    {getInitial(viewer?.name)}
                  </span>
                ) : null}
                {visibleOthers.map((name, i) => (
                  <span
                    key={`${role}-${i}`}
                    className="event-roster-chip event-roster-chip-filled"
                    style={{ "--role-color": roleColor }}
                    title={name}
                  >
                    {getInitial(name)}
                  </span>
                ))}
                {hiddenCount > 0 ? (
                  <span className="event-roster-chip event-roster-chip-more">
                    {t.moreFilled.replace("{n}", localizeDigits(hiddenCount, language))}
                  </span>
                ) : null}
              </span>

              {isOwnRole ? (
                canLeave ? (
                  // Single in-place pill: "You Joined" by default, swapping to
                  // "Leave" on hover/focus (desktop) — same slot, no second row,
                  // no height bump. On touch the tap opens the confirm directly.
                  <Popconfirm
                    title={t.leaveConfirmTitle}
                    description={t.leaveConfirmDesc}
                    okText={t.leaveOk}
                    cancelText={t.leaveCancel}
                    okButtonProps={{ danger: true, loading: leaving }}
                    onConfirm={handleLeave}
                    overlayClassName="vote-withdraw-popconfirm"
                  >
                    <button
                      type="button"
                      className="participants-joined-toggle"
                      disabled={leaving}
                      aria-label={`${viewerStatusPill} — ${t.leave}`}
                    >
                      <span className="participants-joined-face participants-joined-face--default">
                        <CheckCircleFilled aria-hidden="true" />
                        {viewerStatusPill}
                      </span>
                      <span className="participants-joined-face participants-joined-face--leave">
                        <CloseOutlined aria-hidden="true" />
                        {leaving ? t.leaving : t.leave}
                      </span>
                    </button>
                  </Popconfirm>
                ) : (
                  <span className="event-roster-joined-pill">
                    <CheckCircleFilled aria-hidden="true" />
                    {viewerStatusPill}
                  </span>
                )
              ) : canJoinThis && !isFullTargetRow ? (
                <button
                  type="button"
                  className="event-roster-open-pill"
                  onClick={() => handleJoin(role)}
                  disabled={isPending || lockedByOther}
                  aria-label={`${t.join} — ${roleLabel}`}
                >
                  {isPending
                    ? t.joining
                    : openCount !== null
                      ? t.openPill.replace("{n}", localizeDigits(openCount, language))
                      : t.join}
                </button>
              ) : isFullTargetRow ? (
                <span className="event-roster-full-pill">{t.fullPill}</span>
              ) : null}
            </li>
          );
        })}
      </ul>

      {progress?.variant === "conversion" ? (
        <ConversionProgress
          t={t}
          language={language}
          current={Number(progress.current) || 0}
          target={Number(progress.target)}
        />
      ) : progress?.variant === "fill" ? (
        <FillProgress
          t={t}
          language={language}
          current={Number(progress.current) || 0}
          target={Number(progress.target)}
        />
      ) : null}
    </section>
  );
}
