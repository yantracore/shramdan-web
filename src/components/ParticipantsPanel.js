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
  ClearOutlined,
  CloseOutlined,
  CrownOutlined,
  HeartOutlined,
  InboxOutlined,
  MedicineBoxOutlined,
  SafetyOutlined,
  TeamOutlined,
  VideoCameraOutlined
} from "@ant-design/icons";
import { Popconfirm } from "antd";

// The leadership ("Coordinator") slot reads in gold — set apart from the
// participation roles, which it sits below.
export const LEAD_COLOR = "#b7791f";

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

export const ROLE_COLORS = {
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
// WORKER's icon is event-type-specific like its label — cleanup → a broom
// (ClearOutlined); a future event type would remap it alongside the label.
const ROLE_ICONS = {
  WORKER: ClearOutlined,
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
    interested: "मलाई रुचि छ",
    interestedHint: "अहिले भूमिका नछानी, समर्थन मात्र दर्ता गर्नुहोस्",
    interestedSaving: "दर्ता हुँदै…",
    interestedActiveLabel: "समर्थन गरियो",
    interestedWithdrawHint: "हटाउन क्लिक गर्नुहोस्",
    interestedWithdrawing: "हट्दै…",
    orJoinInRole: "वा कुनै भूमिकामा जोडिनुहोस्",
    coreGroupLabel: "मुख्य भूमिका",
    additionalGroupLabel: "थप भूमिका",
    coreGroupNote: "यी दुई बिना सफाइ नै हुँदैन — श्रम गर्ने हातहरू, र नेतृत्व गर्ने संयोजक।",
    additionalGroupNote: "ठूला सफाइका लागि थप सहयोग — हुँदा राम्रो, तर सुरु गर्न अनिवार्य होइन।",
    roleCount: "{n} जना",
    filledOf: "{filled} / {total}",
    join: "जोडिने",
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
    leaveOk: "फिर्ता गर्ने",
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
    compactCommitted: "सामेल",
    compactRemaining: "अझै {n} चाहिन्छ",
    compactReady: "पुग्यो — तय हुँदै!",
    compactSpots: "स्थान",
    compactSpotsEyebrow: "स्थान भरियो",
    compactOpen: "{n} खाली",
    compactFull: "सबै भरियो",
    leaderEyebrow: "नेतृत्व",
    leaderDesc: "टोली जुटाउने र अभियानको दिन नेतृत्व",
    wantToLead: "संयोजक बन्छु",
    leading: "तपाईं संयोजक",
    ledBy: "{name} संयोजक",
    leadOpen: "संयोजक खुला",
    leaveLeadConfirmTitle: "संयोजक पद छोड्ने?",
    leaveLeadConfirmDesc: "तपाईं यो अभियानको संयोजक पदबाट हट्नुहुनेछ। मन लागे फेरि प्रस्ताव गर्न सकिन्छ।",
    roles: {
      // Role labels are event-type-specific. Every event is a "cleanup" today,
      // so WORKER reads "सफाइकर्मी" (cleaner); a future event type would remap it.
      WORKER: "सफाइकर्मी",
      PHOTOGRAPHER: "फोटोग्राफर",
      LIVESTREAMER: "लाइभस्ट्रिमर",
      MEDIC: "स्वास्थ्यकर्मी",
      SAFETY_LEAD: "सुरक्षा प्रमुख",
      COORDINATOR: "संयोजक",
      LOGISTICS: "लजिस्टिक्स"
    },
    // One-line "what this role does" shown under each role title.
    roleDescriptions: {
      WORKER: "फोहोर सङ्कलन र सफाइ",
      PHOTOGRAPHER: "अघि–पछिको तस्बिर",
      LIVESTREAMER: "लाइभ प्रसारण",
      MEDIC: "प्राथमिक उपचार",
      SAFETY_LEAD: "ट्राफिक र सुरक्षा",
      COORDINATOR: "टोली समन्वय र समय",
      LOGISTICS: "औजार, पानी र सामान"
    }
  },
  en: {
    heading: "Participants",
    intro: "Join in the role that fits you — every role keeps the cleanup running.",
    interested: "I'm interested",
    interestedHint: "Just register your support, no role yet",
    interestedSaving: "Registering…",
    interestedActiveLabel: "Supported",
    interestedWithdrawHint: "Click to withdraw",
    interestedWithdrawing: "Withdrawing…",
    orJoinInRole: "Or join in a role",
    coreGroupLabel: "Core roles",
    additionalGroupLabel: "Additional roles",
    coreGroupNote: "No cleanup happens without these: the hands doing the work and the coordinator leading it.",
    additionalGroupNote: "Nice-to-have support for bigger cleanups — helpful, but not needed to get started.",
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
    compactCommitted: "joined",
    compactRemaining: "{n} more to schedule",
    compactReady: "Ready to schedule!",
    compactSpots: "spots",
    compactSpotsEyebrow: "Roles filled",
    compactOpen: "{n} open",
    compactFull: "All filled",
    leaderEyebrow: "Leadership",
    leaderDesc: "Rallies the team & leads on the day",
    wantToLead: "Be the coordinator",
    leading: "You're coordinating",
    ledBy: "Coordinated by {name}",
    leadOpen: "Coordinator open",
    leaveLeadConfirmTitle: "Step down as coordinator?",
    leaveLeadConfirmDesc: "You'll no longer be the coordinator for this campaign. You can offer again anytime.",
    roles: {
      // Event-type-specific (see np note): cleanup → "Cleaner".
      WORKER: "Cleaner",
      PHOTOGRAPHER: "Photographer",
      LIVESTREAMER: "Livestreamer",
      MEDIC: "Medic",
      SAFETY_LEAD: "Safety Lead",
      COORDINATOR: "Coordinator",
      LOGISTICS: "Logistics"
    },
    // One-line "what this role does" shown under each role title.
    roleDescriptions: {
      WORKER: "Collect & clear waste",
      PHOTOGRAPHER: "Capture before & after",
      LIVESTREAMER: "Run the live stream",
      MEDIC: "First aid & hydration",
      SAFETY_LEAD: "Traffic & hazard safety",
      COORDINATOR: "Team flow & timing",
      LOGISTICS: "Tools, water & supplies"
    }
  }
};

// Compact progress that lives to the RIGHT of the heading (there's room), not
// as a full-width row below the roster. The denominator is the TOTAL needed —
// conversion: attendingCount / conversionThreshold ("how many votes to become a
// campaign"); fill: filled / planned spots. One small bar + a one-line caption.
function CompactProgress({ t, language, progress }) {
  const current = Number(progress?.current) || 0;
  const target = Number(progress?.target);
  if (!Number.isFinite(target) || target <= 0) return null;

  const isConversion = progress.variant === "conversion";
  const remaining = Math.max(0, target - current);
  const isComplete = current >= target;
  const fillPercent = Math.min(100, Math.round((current / target) * 100));

  const eyebrow = isConversion ? t.conversionEyebrow : t.compactSpotsEyebrow;
  const unit = isConversion ? t.compactCommitted : t.compactSpots;
  const tail = isComplete
    ? isConversion
      ? t.compactReady
      : t.compactFull
    : (isConversion ? t.compactRemaining : t.compactOpen).replace(
        "{n}",
        localizeDigits(remaining, language)
      );

  return (
    <div
      className={`participants-progress-compact ${isComplete ? "is-full" : ""}`}
      role="group"
      aria-label={`${eyebrow}: ${localizeDigits(current, language)}/${localizeDigits(target, language)}`}
    >
      <span className="participants-progress-compact-eyebrow">{eyebrow}</span>
      <div className="event-roster-progress-bar" aria-hidden="true">
        <span className="event-roster-progress-fill" style={{ width: `${fillPercent}%` }} />
      </div>
      <span className="participants-progress-compact-meta">
        <strong>
          {localizeDigits(current, language)}/{localizeDigits(target, language)}
        </strong>{" "}
        {unit} · {tail}
      </span>
    </div>
  );
}

// Standalone export of the compact progress bar so other surfaces — e.g. the
// issue detail topline above the description — can show the very same bar the
// panel shows next to its heading. Builds its own copy from `language`; pass
// the same `{ current, target, variant }` progress spec the panel takes.
export function CompactConversionProgress({ language = "np", progress }) {
  const t = COPY[language] || COPY.np;
  return <CompactProgress t={t} language={language} progress={progress} />;
}

export function ParticipantsPanel({
  roles = [],
  viewer = null,
  progress = null,
  joinableRoles = null,
  canLeave = false,
  onJoin,
  onLeave,
  // The leadership ("Coordinator") slot, rendered separately at the bottom.
  //   { viewerIsLeader, name, count, canLead }
  // Leadership is its own commitment — on issues a WANT_TO_LEAD vote, on events
  // the resolved event leader — so it's NOT one of the `roles` above.
  leaderSlot = null,
  onLead,
  onLeaveLead,
  canLeaveLead = false,
  // Optional authoritative "how many are in" total for the heading badge. When
  // the page already holds a server-computed total (issues: `attendingCount`,
  // the GOING tally the conversion bar also reads), pass it here so the badge
  // and that bar agree by construction — the per-role rows are only a breakdown,
  // and some committed voters (role-less GOING, COORDINATOR) never land in a
  // visible row, so summing the rows would undercount. Omit to fall back to the
  // derived row sum (events, where the roster IS the full picture).
  totalOverride = null,
  // When the panel is rendered INSIDE another surface (the Support modal), drop
  // its own section chrome (top divider/margin). Content stays identical.
  embedded = false,
  language = "np",
  // OPEN-issue support shortcut. When provided, the panel renders the "I'm
  // interested" block (and, when interestedActive, a one-click withdraw toggle)
  // so the modal and the detail body show it identically. Absent for events.
  onInterested,
  interestedActive = false,
  onWithdraw
}) {
  const t = COPY[language] || COPY.np;
  const [pendingRole, setPendingRole] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const [leadPending, setLeadPending] = useState(false);
  const [leadLeaving, setLeadLeaving] = useState(false);
  const [interestedPending, setInterestedPending] = useState(false);
  const [withdrawPending, setWithdrawPending] = useState(false);

  const viewerRole = viewer?.role || null;
  // The viewer is "committed" if they hold a role OR they're leading — either
  // locks the other join actions (one commitment per issue).
  const viewerCommitted = Boolean(viewerRole) || Boolean(leaderSlot?.viewerIsLeader);
  const roleJoinable = (role) =>
    !viewerCommitted && (joinableRoles === null || (Array.isArray(joinableRoles) && joinableRoles.includes(role)));

  // Nothing to show → render nothing (a brand-new issue with no roster and a
  // viewer who hasn't joined, and no progress to nudge).
  const anyFilled = roles.some((r) => (r.count || 0) > 0 || (r.names || []).length > 0);
  const anyJoinable = roles.some((r) => roleJoinable(r.role));
  if (!viewerCommitted && !anyFilled && !anyJoinable && !progress && !leaderSlot) return null;

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

  const handleLead = async () => {
    if (!onLead || leadPending) return;
    setLeadPending(true);
    try {
      await onLead();
    } catch {
      /* page handles messaging */
    } finally {
      setLeadPending(false);
    }
  };

  const handleLeaveLead = async () => {
    if (!onLeaveLead || leadLeaving) return;
    setLeadLeaving(true);
    try {
      await onLeaveLead();
    } catch {
      /* page handles messaging */
    } finally {
      setLeadLeaving(false);
    }
  };

  const handleInterested = async () => {
    if (interestedPending || !onInterested) return;
    setInterestedPending(true);
    try {
      await onInterested();
    } catch {
      /* caller surfaces its own error toast */
    } finally {
      setInterestedPending(false);
    }
  };

  const handleWithdraw = async () => {
    if (withdrawPending || !onWithdraw) return;
    setWithdrawPending(true);
    try {
      await onWithdraw();
    } catch {
      /* caller surfaces its own error toast */
    } finally {
      setWithdrawPending(false);
    }
  };

  const viewerStatusPill =
    viewer?.status === "INVITED"
      ? t.waitlisted
      : viewer?.status === "CHECKED_IN"
        ? t.checkedIn
        : t.youreIn;

  // Total people committed across all roles (+ the leader) — surfaced as a
  // count badge by the heading so the panel answers "how many are in?". An
  // authoritative `totalOverride` (e.g. the issue's GOING `attendingCount`, the
  // same number the conversion bar shows) wins over the derived row sum so the
  // badge can never drift from the headline progress.
  const derivedTotal =
    roles.reduce((sum, r) => sum + (Number(r.count) || 0), 0) + (Number(leaderSlot?.count) || 0);
  const totalCount =
    totalOverride === null || totalOverride === undefined
      ? derivedTotal
      : Number(totalOverride) || 0;

  // Layout: the Cleaner (WORKER) leads as a FULL-WIDTH row — there can be many
  // cleaners, so they need the room for chips. The Coordinator/leader slot is
  // the next (half-column) item, then the rest of the roles follow as halves.
  const workerRow = roles.find((r) => r.role === "WORKER") || null;
  const otherRows = roles.filter((r) => r.role !== "WORKER");

  const renderRoleRow = (row, full = false) => {
    const role = row.role;
    const roleColor = ROLE_COLORS[role] || "#176b5c";
    const Icon = ROLE_ICONS[role] || TeamOutlined;
    const roleLabel = t.roles[role] || role;
    const count = Number(row.count) || 0;
    const target = Number.isFinite(Number(row.target)) ? Number(row.target) : null;
    const names = Array.isArray(row.names) ? row.names : [];
    const isOwnRole = viewerRole === role;
    const otherNames =
      isOwnRole && viewer?.name ? names.filter((n) => n !== viewer.name) : names;
    const visibleOthers = otherNames.slice(0, isOwnRole ? MAX_VISIBLE_CHIPS - 1 : MAX_VISIBLE_CHIPS);
    const shownCount = visibleOthers.length + (isOwnRole ? 1 : 0);
    const hiddenCount = Math.max(0, count - shownCount);
    const openCount = target !== null ? Math.max(0, target - count) : null;
    const canJoinThis = roleJoinable(role);
    const isFullTargetRow = target !== null && openCount === 0;
    const lockedByOther = viewerCommitted && !isOwnRole;
    const isPending = pendingRole === role;
    const countText =
      target !== null
        ? t.filledOf
            .replace("{filled}", localizeDigits(count, language))
            .replace("{total}", localizeDigits(target, language))
        : count > 0
          ? t.roleCount.replace("{n}", localizeDigits(count, language))
          : "";
    const roleDesc = t.roleDescriptions?.[role] || "";
    return (
      <li
        key={role}
        className={`event-roster-row${full ? " event-roster-row--full" : ""}${
          isOwnRole ? " is-own-role" : ""
        }${lockedByOther ? " is-locked" : ""}`}
      >
        <span
          className="event-roster-role has-icon participants-role"
          style={{ "--role-color": roleColor }}
        >
          <Icon className="participants-role-icon" aria-hidden="true" />
          <span className="participants-role-text">
            <span className="participants-role-head">
              <span className="participants-role-name">{roleLabel}</span>
              {countText ? <span className="event-roster-count">{countText}</span> : null}
            </span>
            {roleDesc ? <span className="participants-role-desc">{roleDesc}</span> : null}
          </span>
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
  };

  const renderLeaderRow = () => {
    if (!leaderSlot) return null;
    return (
      <li
        key="__leader"
        className={`event-roster-row event-roster-row--full participants-leader-row${
          leaderSlot.viewerIsLeader ? " is-own-role" : ""
        }`}
        style={{ "--role-color": LEAD_COLOR }}
      >
        <span className="event-roster-role has-icon participants-role">
          <CrownOutlined className="participants-role-icon" aria-hidden="true" />
          <span className="participants-role-text">
            <span className="participants-role-head">
              <span className="participants-role-name">
                {leaderSlot.title || t.roles.COORDINATOR}
              </span>
              {Number(leaderSlot.count) > 0 ? (
                <span className="event-roster-count">
                  {t.roleCount.replace("{n}", localizeDigits(leaderSlot.count, language))}
                </span>
              ) : null}
            </span>
            <span className="participants-role-desc">{t.leaderDesc}</span>
          </span>
        </span>

        <span className="event-roster-chips" aria-hidden={!leaderSlot.name}>
          {leaderSlot.name ? (
            <span
              className={`event-roster-chip event-roster-chip-filled${
                leaderSlot.viewerIsLeader ? " participants-chip-you" : ""
              }`}
              style={{ "--role-color": LEAD_COLOR }}
              title={leaderSlot.name}
            >
              {getInitial(leaderSlot.name)}
            </span>
          ) : null}
        </span>

        {leaderSlot.viewerIsLeader ? (
          canLeaveLead ? (
            <Popconfirm
              title={t.leaveLeadConfirmTitle}
              description={t.leaveLeadConfirmDesc}
              okText={t.leaveOk}
              cancelText={t.leaveCancel}
              okButtonProps={{ danger: true, loading: leadLeaving }}
              onConfirm={handleLeaveLead}
              overlayClassName="vote-withdraw-popconfirm"
            >
              <button
                type="button"
                className="participants-joined-toggle participants-lead-toggle"
                disabled={leadLeaving}
                aria-label={`${t.leading} — ${t.leave}`}
              >
                <span className="participants-joined-face participants-joined-face--default">
                  <CrownOutlined aria-hidden="true" />
                  {t.leading}
                </span>
                <span className="participants-joined-face participants-joined-face--leave">
                  <CloseOutlined aria-hidden="true" />
                  {leadLeaving ? t.leaving : t.leave}
                </span>
              </button>
            </Popconfirm>
          ) : (
            <span className="event-roster-joined-pill participants-lead-pill">
              <CrownOutlined aria-hidden="true" />
              {t.leading}
            </span>
          )
        ) : leaderSlot.name ? (
          <span className="participants-lead-by">{t.ledBy.replace("{name}", leaderSlot.name)}</span>
        ) : leaderSlot.canLead ? (
          <button
            type="button"
            className="event-roster-open-pill participants-lead-cta"
            onClick={handleLead}
            disabled={leadPending}
            aria-label={t.wantToLead}
          >
            {leadPending ? t.joining : t.wantToLead}
          </button>
        ) : (
          <span className="event-roster-full-pill">{t.leadOpen}</span>
        )}
      </li>
    );
  };

  return (
    <section
      className={`participants-panel event-roster-panel${
        embedded ? " participants-panel--embedded" : ""
      }`}
      aria-labelledby="participants-title"
    >
      <header className="event-roster-header participants-header">
        <div className="participants-header-top">
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
          {progress ? (
            <CompactProgress t={t} language={language} progress={progress} />
          ) : null}
        </div>
        <p className="participants-intro">{t.intro}</p>
      </header>

      {onInterested ? (
        <div className="participants-interested">
          {interestedActive ? (
            <button
              type="button"
              className="support-modal-interested is-active"
              onClick={handleWithdraw}
              disabled={withdrawPending}
              aria-label={`${t.interestedActiveLabel} — ${t.interestedWithdrawHint}`}
            >
              <span className="support-modal-interested-icon">
                <CheckCircleFilled aria-hidden="true" />
              </span>
              <span className="support-modal-interested-text">
                <strong>{withdrawPending ? t.interestedWithdrawing : t.interestedActiveLabel}</strong>
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
            <span>{t.orJoinInRole}</span>
          </div>
        </div>
      ) : null}

      <div className="participants-groups">
        {/* Core — the two must-fill roles: the Cleaner (the work itself) and
            the Coordinator/leader (who runs it). These anchor every event. */}
        <div className="participants-group participants-group--core">
          <p className="participants-group-label">{t.coreGroupLabel}</p>
          <p className="participants-group-note">{t.coreGroupNote}</p>
          <ul className="event-roster-list">
            {workerRow ? renderRoleRow(workerRow, true) : null}
            {renderLeaderRow()}
          </ul>
        </div>

        {/* Additional — optional specialist roles. If unfilled, the coordinator
            covers them (especially early), so they read as secondary. */}
        {otherRows.length ? (
          <div className="participants-group participants-group--additional">
            <p className="participants-group-label">{t.additionalGroupLabel}</p>
            <p className="participants-group-note">{t.additionalGroupNote}</p>
            <ul className="event-roster-list">
              {otherRows.map((row) => renderRoleRow(row))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
