"use client";

// Roster panel for the event detail page. Shows who's joining grouped
// by role, with filled/needed counts. Each filled member is a small
// avatar chip (initial in a colored circle); each unfilled slot pill is
// a click target that POSTs the viewer into that role directly.
//
// Click semantics on the open-pill:
//   - anon viewer  → redirect to /login?next=/events/{id}
//   - already in   → no-op (parent's <EventJoinPanel> already shows joined state)
//   - logged in    → POST /events/{id}/participants with { role } and toast
//
// Data shape:
//   rolesNeeded: [{
//     role: "WORKER" | "PHOTOGRAPHER" | "LIVESTREAMER" | "MEDIC" |
//           "SAFETY_LEAD" | "COORDINATOR" | "LOGISTICS",
//     count: number,    // total slots
//     filled: number,   // currently filled
//     filledNames: string[]
//   }, ...]

import { CheckCircleFilled } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { postJson } from "@/lib/apiClient";
import { isActiveParticipationStatus } from "@/lib/eventParticipants";
import { getAuthSession, subscribeAuthSession } from "@/lib/authSession";
import { useToast } from "@/lib/toast";

const ROLE_COLORS = {
  WORKER: "#2e7d32",
  PHOTOGRAPHER: "#7b3fa0",
  LIVESTREAMER: "#d2360b",
  MEDIC: "#b42318",
  SAFETY_LEAD: "#b7791f",
  COORDINATOR: "#176b5c",
  LOGISTICS: "#1d4ed8"
};

const MAX_VISIBLE_CHIPS = 3;

const COPY = {
  np: {
    heading: "सहभागीहरू",
    intro: "हरेक श्रमदानमा विभिन्न तरिकाले साथीहरू सहभागी हुन्छन्। तपाईं पनि आफ्नो रुचि अनुसार जोडिनुहोस्।",
    progressLabel: "{filled} / {total} स्थान पूरा",
    progressFullLabel: "सबै {total} स्थान पूरा",
    openSummary: "{n} खाली",
    filledOf: "{filled} / {count}",
    moreFilled: "+{n}",
    openPill: "+{n} खाली",
    fullPill: "पूरा",
    unfilled: "खाली",
    joinAs: "जोडिनुहोस्",
    joining: "जोडिँदै…",
    youreInPill: "जोडिनुभयो",
    waitlistedPill: "प्रतीक्षामा",
    checkedInPill: "चेक-इन",
    lockedHint: "एक पटकमा एउटै भूमिकामा जोडिन सकिन्छ।",
    joinedToast: "तपाईं {role} भूमिकामा जोडिनुभयो।",
    waitlistToast: "भूमिका भरिएको छ — प्रतीक्षा सूचीमा हुनुहुन्छ।",
    alreadyJoinedToast: "तपाईं पहिले अर्को भूमिकामा जोडिनुभएको छ।",
    medicCredentialError: "स्वास्थ्यकर्मी भूमिकाको लागि प्रमाणित मेडिकल क्रेडेन्सियल चाहिन्छ।",
    rejoinBlocked: "अहिले फेरि जोडिन सकिएन — पहिले छाड्नुभएको रेकर्ड सर्भरले पुनः सक्रिय गरेन। कृपया आयोजकलाई सम्पर्क गर्नुहोस्।",
    errorToast: "जोडिन सकिएन। फेरि प्रयास गर्नुहोस्।",
    roles: {
      WORKER: "कामदार",
      PHOTOGRAPHER: "फोटोग्राफर",
      LIVESTREAMER: "लाइभस्ट्रिमर",
      MEDIC: "स्वास्थ्यकर्मी",
      SAFETY_LEAD: "सुरक्षा प्रमुख",
      COORDINATOR: "संयोजक",
      LOGISTICS: "लजिस्टिक्स"
    },
    roleDescriptions: {
      WORKER: "फोहोर सङ्कलन, छँटाइ र भौतिक मेहनतको काम।",
      PHOTOGRAPHER: "अघि–पछिको तस्बिर र सहभागिताको क्षण कैद।",
      LIVESTREAMER: "युट्युब लाइभ सञ्चालन, क्यामेरा र audio सेटअप।",
      MEDIC: "साना चोटपटक, पानी–छाया र प्राथमिक उपचार।",
      SAFETY_LEAD: "सडक–ट्राफिक सुरक्षा र खतरनाक स्थल पहिचान।",
      COORDINATOR: "टोली सञ्चालन, समय व्यवस्था र स्थानीय समन्वय।",
      LOGISTICS: "औजार, पानी, झोला र खाजा व्यवस्था।"
    }
  },
  en: {
    heading: "Participants",
    intro: "Every shramdan welcomes participants in different ways. Pick one that fits you and join.",
    progressLabel: "{filled} of {total} spots filled",
    progressFullLabel: "All {total} spots filled",
    openSummary: "{n} open",
    filledOf: "{filled} / {count}",
    moreFilled: "+{n}",
    openPill: "+{n} open",
    fullPill: "Full",
    unfilled: "open",
    joinAs: "Join",
    joining: "Joining…",
    youreInPill: "You're in",
    waitlistedPill: "Waitlisted",
    checkedInPill: "Checked in",
    lockedHint: "You can only join one role per event.",
    joinedToast: "You're in as {role}.",
    waitlistToast: "Role full — you're on the waitlist.",
    alreadyJoinedToast: "You've already joined this event in a different role.",
    medicCredentialError: "The Medic role requires verified medical credentials.",
    rejoinBlocked: "Couldn't re-join right now — a signup you previously left wasn't reactivated by the server. Please contact an organizer.",
    errorToast: "Could not join. Please try again.",
    roles: {
      WORKER: "Worker",
      PHOTOGRAPHER: "Photographer",
      LIVESTREAMER: "Livestreamer",
      MEDIC: "Medic",
      SAFETY_LEAD: "Safety Lead",
      COORDINATOR: "Coordinator",
      LOGISTICS: "Logistics"
    },
    roleDescriptions: {
      WORKER: "Trash collection, sorting, and physical labour.",
      PHOTOGRAPHER: "Before/after photos, capturing participation moments.",
      LIVESTREAMER: "Run YouTube Live, camera and audio setup.",
      MEDIC: "Minor injuries, hydration, basic first aid.",
      SAFETY_LEAD: "Traffic safety and hazard scouting.",
      COORDINATOR: "Team flow, timing, and local coordination.",
      LOGISTICS: "Tools, water, bags, and refreshments."
    }
  }
};

export function EventRosterPanel({
  rolesNeeded,
  language = "np",
  eventId,
  viewerRole = null,
  viewerStatus = null,
  onJoined
}) {
  const t = COPY[language] || COPY.np;
  const session = useSyncExternalStore(subscribeAuthSession, getAuthSession, () => null);
  const router = useRouter();
  const messageApi = useToast();
  const [pendingRole, setPendingRole] = useState(null);

  // Hooks above run unconditionally; the empty-roster guard comes after them
  // so hook order stays stable (react-hooks/rules-of-hooks).
  if (!Array.isArray(rolesNeeded) || rolesNeeded.length === 0) return null;

  const handleRoleClick = async (role) => {
    // Anon viewer → login redirect, preserving return path.
    if (!session?.user?.id) {
      const next = encodeURIComponent(`/events/${eventId}`);
      router.push(`/login?next=${next}`);
      return;
    }
    // Already participating in some role: no direct re-apply — surface a
    // gentle toast so the user understands why nothing happens.
    if (viewerRole) {
      messageApi.warning(t.alreadyJoinedToast);
      return;
    }
    setPendingRole(role);
    try {
      const response = await postJson(
        `/events/${eventId}/participants`,
        { role },
        { requireAuth: true }
      );
      const data = response?.data ?? response;
      const roleLabel = t.roles[role] || role;
      if (data?.status && !isActiveParticipationStatus(data.status)) {
        // Backend bug: re-join after leaving returns 201 with the stale
        // terminal record (LEFT / NO_SHOW) instead of reactivating it.
        messageApi.error(t.rejoinBlocked);
        onJoined?.({ refetch: true });
      } else {
        if (data?.status === "INVITED") {
          messageApi.info(t.waitlistToast);
        } else {
          messageApi.success(t.joinedToast.replace("{role}", roleLabel));
        }
        onJoined?.({ role, status: data?.status });
      }
    } catch (err) {
      if (err?.status === 403 && /MEDIC/i.test(err?.errorCode || err?.message || "")) {
        messageApi.error(t.medicCredentialError);
      } else if (err?.status === 409) {
        messageApi.warning(t.alreadyJoinedToast);
        onJoined?.({ refetch: true });
      } else {
        messageApi.error(err?.message || t.errorToast);
      }
    } finally {
      setPendingRole(null);
    }
  };

  const totalSlots = rolesNeeded.reduce((sum, row) => sum + (row.count || 0), 0);
  const filledSlots = rolesNeeded.reduce(
    (sum, row) => sum + Math.min(row.filled || 0, row.count || 0),
    0
  );
  const openSlots = Math.max(0, totalSlots - filledSlots);
  const fillPercent = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;
  const isFull = openSlots === 0 && totalSlots > 0;

  const progressLabel = isFull
    ? t.progressFullLabel.replace("{total}", totalSlots)
    : t.progressLabel.replace("{filled}", filledSlots).replace("{total}", totalSlots);

  return (
    <section className="event-roster-panel" aria-labelledby="event-roster-title">
      <header className="event-roster-header">
        <h2 id="event-roster-title">{t.heading}</h2>
        <p>{t.intro}</p>
      </header>

      {totalSlots > 0 ? (
        <div
          className={`event-roster-progress ${isFull ? "is-full" : ""}`}
          role="group"
          aria-label={progressLabel}
        >
          <div className="event-roster-progress-bar" aria-hidden="true">
            <span
              className="event-roster-progress-fill"
              style={{ width: `${fillPercent}%` }}
            />
          </div>
          <div className="event-roster-progress-meta">
            <span className="event-roster-progress-count">{progressLabel}</span>
            {openSlots > 0 ? (
              <span className="event-roster-progress-open">
                {t.openSummary.replace("{n}", openSlots)}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      <ul className="event-roster-list">
        {rolesNeeded.map((row) => {
          const roleColor = ROLE_COLORS[row.role] || "#176b5c";
          const roleLabel = t.roles[row.role] || row.role;
          const filledNames = Array.isArray(row.filledNames) ? row.filledNames : [];
          const visibleNames = filledNames.slice(0, MAX_VISIBLE_CHIPS);
          const hiddenCount = Math.max(0, filledNames.length - visibleNames.length);
          const openCount = Math.max(0, row.count - row.filled);
          const isPending = pendingRole === row.role;
          const isOwnRole = viewerRole === row.role;
          // Already committed to a different role → this row is locked: one
          // person can hold only a single role on an event.
          const lockedByOtherRole = Boolean(viewerRole) && !isOwnRole;
          const joinedLabel =
            viewerStatus === "INVITED"
              ? t.waitlistedPill
              : viewerStatus === "CHECKED_IN"
                ? t.checkedInPill
                : t.youreInPill;
          return (
            <li
              key={row.role}
              className={`event-roster-row${isOwnRole ? " is-own-role" : ""}${
                lockedByOtherRole ? " is-locked" : ""
              }`}
            >
              <span
                className="event-roster-role"
                style={{ "--role-color": roleColor }}
                title={t.roleDescriptions[row.role] || undefined}
              >
                {roleLabel}
              </span>
              <span className="event-roster-count">
                {t.filledOf.replace("{filled}", row.filled).replace("{count}", row.count)}
              </span>
              <span className="event-roster-chips" aria-hidden={filledNames.length === 0}>
                {visibleNames.map((name, i) => (
                  <span
                    key={`${row.role}-${i}`}
                    className="event-roster-chip event-roster-chip-filled"
                    style={{ "--role-color": roleColor }}
                    title={name}
                  >
                    {getInitial(name)}
                  </span>
                ))}
                {hiddenCount > 0 ? (
                  <span
                    className="event-roster-chip event-roster-chip-more"
                    title={filledNames.slice(MAX_VISIBLE_CHIPS).join(", ")}
                  >
                    {t.moreFilled.replace("{n}", hiddenCount)}
                  </span>
                ) : null}
              </span>
              {isOwnRole ? (
                <span className="event-roster-joined-pill">
                  <CheckCircleFilled aria-hidden="true" />
                  {joinedLabel}
                </span>
              ) : openCount > 0 ? (
                <button
                  type="button"
                  className="event-roster-open-pill"
                  onClick={() => handleRoleClick(row.role)}
                  disabled={isPending || lockedByOtherRole}
                  title={lockedByOtherRole ? t.lockedHint : undefined}
                  aria-label={`${t.joinAs} — ${roleLabel}`}
                >
                  {isPending ? t.joining : t.openPill.replace("{n}", openCount)}
                </button>
              ) : (
                <span className="event-roster-full-pill">{t.fullPill}</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function getInitial(name) {
  if (!name) return "?";
  const trimmed = name.trim();
  if (!trimmed) return "?";
  // Devanagari + Latin both: just first character
  return Array.from(trimmed)[0];
}
