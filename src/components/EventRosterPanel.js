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

const COPY = {
  np: {
    heading: "कसले-कसले जोडिँदै छन्",
    intro: "हरेक श्रमदानमा फरक-फरक भूमिकामा साथीहरू चाहिन्छन्। तपाईं पनि कुनै भूमिकामा जोडिनुहोस्।",
    filledOf: "{filled} / {count} जना",
    unfilled: "खाली",
    joinAs: "जोडिनुहोस्",
    roles: {
      WORKER: "Worker Shramdan",
      PHOTOGRAPHER: "Photographer Shramdan",
      LIVESTREAMER: "Livestreamer Shramdan",
      MEDIC: "Medic Shramdan",
      SAFETY_LEAD: "Safety Lead Shramdan",
      COORDINATOR: "Coordinator Shramdan",
      LOGISTICS: "Logistics Shramdan"
    }
  },
  en: {
    heading: "Who's joining",
    intro: "Every shramdan needs different roles. Pick one and join.",
    filledOf: "{filled} / {count} filled",
    unfilled: "open",
    joinAs: "Join",
    roles: {
      WORKER: "Worker Shramdan",
      PHOTOGRAPHER: "Photographer Shramdan",
      LIVESTREAMER: "Livestreamer Shramdan",
      MEDIC: "Medic Shramdan",
      SAFETY_LEAD: "Safety Lead Shramdan",
      COORDINATOR: "Coordinator Shramdan",
      LOGISTICS: "Logistics Shramdan"
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
        {rolesNeeded.map((row) => (
          <li key={row.role} className="event-roster-row">
            <div className="event-roster-row-meta">
              <span
                className="event-roster-role"
                style={{ "--role-color": ROLE_COLORS[row.role] || "#176b5c" }}
              >
                {t.roles[row.role] || row.role}
              </span>
              <span className="event-roster-count">
                {t.filledOf.replace("{filled}", row.filled).replace("{count}", row.count)}
              </span>
            </div>
            <div className="event-roster-chips">
              {row.filledNames?.map((name, i) => (
                <span
                  key={`${row.role}-${i}`}
                  className="event-roster-chip event-roster-chip-filled"
                  style={{ "--role-color": ROLE_COLORS[row.role] || "#176b5c" }}
                  title={name}
                >
                  {getInitial(name)}
                </span>
              ))}
              {Array.from({ length: Math.max(0, row.count - row.filled) }).map((_, i) => (
                <Link
                  key={`${row.role}-empty-${i}`}
                  className="event-roster-chip event-roster-chip-empty"
                  href={`/join?role=${encodeURIComponent(row.role)}${eventId ? `&event=${eventId}` : ""}`}
                  aria-label={`${t.joinAs} — ${t.roles[row.role] || row.role}`}
                >
                  +
                </Link>
              ))}
            </div>
          </li>
        ))}
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
