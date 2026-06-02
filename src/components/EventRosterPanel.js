"use client";

// Roster panel for the event detail page. Shows who's joining grouped
// by role, with filled/needed counts. Each filled member is a small
// avatar chip (initial in a colored circle); each unfilled slot is a
// dashed-outline "+" inviting click → /join?role=<ROLE>.
//
// Data shape:
//   rolesNeeded: [{
//     role: "WORKER" | "PHOTOGRAPHER" | "LIVESTREAMER" | "MEDIC" |
//           "SAFETY_LEAD" | "COORDINATOR" | "LOGISTICS",
//     count: number,    // total slots
//     filled: number,   // currently filled
//     filledNames: string[]
//   }, ...]

import Link from "next/link";

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
    heading: "कसले-कसले जोडिँदै छन्",
    intro: "हरेक श्रमदानमा फरक-फरक भूमिकामा साथीहरू चाहिन्छन्। तपाईं पनि कुनै भूमिकामा जोडिनुहोस्।",
    filledOf: "{filled} / {count}",
    moreFilled: "+{n}",
    openPill: "+{n} खाली",
    fullPill: "पूरा",
    unfilled: "खाली",
    joinAs: "जोडिनुहोस्",
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
    heading: "Who's joining",
    intro: "Every shramdan needs different roles. Pick one and join.",
    filledOf: "{filled} / {count}",
    moreFilled: "+{n}",
    openPill: "+{n} open",
    fullPill: "Full",
    unfilled: "open",
    joinAs: "Join",
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

export function EventRosterPanel({ rolesNeeded, language = "np", eventId }) {
  if (!Array.isArray(rolesNeeded) || rolesNeeded.length === 0) return null;
  const t = COPY[language] || COPY.np;

  return (
    <section className="event-roster-panel" aria-labelledby="event-roster-title">
      <header className="event-roster-header">
        <h2 id="event-roster-title">{t.heading}</h2>
        <p>{t.intro}</p>
      </header>

      <ul className="event-roster-list">
        {rolesNeeded.map((row) => {
          const roleColor = ROLE_COLORS[row.role] || "#176b5c";
          const roleLabel = t.roles[row.role] || row.role;
          const filledNames = Array.isArray(row.filledNames) ? row.filledNames : [];
          const visibleNames = filledNames.slice(0, MAX_VISIBLE_CHIPS);
          const hiddenCount = Math.max(0, filledNames.length - visibleNames.length);
          const openCount = Math.max(0, row.count - row.filled);
          const joinHref = `/join?role=${encodeURIComponent(row.role)}${eventId ? `&event=${eventId}` : ""}`;
          return (
            <li key={row.role} className="event-roster-row">
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
              {openCount > 0 ? (
                <Link
                  className="event-roster-open-pill"
                  href={joinHref}
                  aria-label={`${t.joinAs} — ${roleLabel}`}
                >
                  {t.openPill.replace("{n}", openCount)}
                </Link>
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
