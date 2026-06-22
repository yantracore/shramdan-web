"use client";

// /me/applications — list of contribution applications the user has
// submitted via /join. Status-tagged with submitted / reviewing /
// accepted / rejected variants. The member-scoped read endpoint
// (GET /users/me/applications) is not built yet, so this renders the
// empty state until that backend lands — see docs/api-requirements/applications.md.

import { CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, FileSearchOutlined } from "@ant-design/icons";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
function localizeDigits(v, lang) {
  const s = String(v ?? "");
  return lang === "np" ? s.replace(/\d/g, (d) => NP_DIGITS[Number(d)]) : s;
}

const STATUS_META = {
  SUBMITTED: { icon: ClockCircleOutlined, kind: "submitted" },
  REVIEWING: { icon: FileSearchOutlined, kind: "reviewing" },
  ACCEPTED: { icon: CheckCircleOutlined, kind: "accepted" },
  REJECTED: { icon: ClockCircleOutlined, kind: "rejected" }
};

const COPY = {
  np: {
    pageTitle: "आवेदनहरू",
    eyebrow: "मेरो योगदान",
    title: "तपाईंले पठाएका आवेदन",
    intro:
      "/join मार्फत पठाएका योगदान आवेदनहरूको स्थिति यहाँ देखिन्छ।",
    empty: "अहिले कुनै आवेदन छैन।",
    emptyCta: "योगदान सुरु गर्नुहोस्",
    statusLabels: {
      SUBMITTED: "पेस गरियो",
      REVIEWING: "समीक्षाधीन",
      ACCEPTED: "स्वीकृत",
      REJECTED: "अस्वीकृत"
    },
    submittedOn: "पेस मिति",
    decidedOn: "निर्णय मिति"
  },
  en: {
    pageTitle: "Applications",
    eyebrow: "My contributions",
    title: "Applications you've submitted",
    intro: "Status of the contribution applications you've sent via /join.",
    empty: "No applications yet.",
    emptyCta: "Start a contribution",
    statusLabels: {
      SUBMITTED: "Submitted",
      REVIEWING: "Reviewing",
      ACCEPTED: "Accepted",
      REJECTED: "Rejected"
    },
    submittedOn: "Submitted",
    decidedOn: "Decided"
  }
};

function formatDate(iso, language) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const locale = language === "np" ? "ne-NP" : "en-US";
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric"
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

export default function MeApplicationsPage() {
  const { language } = usePreferences();
  const t = COPY[language] || COPY.np;
  // No member-scoped applications read endpoint yet — render empty until it ships.
  const apps = [];

  return (
    <SiteShell pageTitle={t.pageTitle}>
      <section className="page-section applications-section">
        <header className="applications-hero">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </header>

        {apps.length === 0 ? (
          <EmptyState
            kind="no-results"
            title={t.empty}
            cta={{ label: t.emptyCta, href: "/join" }}
          />
        ) : (
          <ul className="applications-list">
            {apps.map((app) => {
              const meta = STATUS_META[app.status] || STATUS_META.SUBMITTED;
              const Icon = meta.icon;
              const roleLabel = app.roleLabel?.[language] || app.roleLabel?.np;
              return (
                <li
                  key={app.id}
                  className={`application-row application-row--${meta.kind}`}
                >
                  <span className="application-row-status" aria-hidden="true">
                    <Icon />
                  </span>
                  <div className="application-row-body">
                    <strong>{roleLabel}</strong>
                    <span className="application-row-status-label">
                      {t.statusLabels[app.status]}
                    </span>
                    {app.note ? (
                      <p className="application-row-note">
                        {app.note[language] || app.note.np}
                      </p>
                    ) : null}
                  </div>
                  <div className="application-row-dates">
                    <span>
                      <CalendarOutlined aria-hidden="true" /> {t.submittedOn}:{" "}
                      {formatDate(app.submittedAt, language)}
                    </span>
                    {app.decidedAt ? (
                      <span>
                        <CheckCircleOutlined aria-hidden="true" /> {t.decidedOn}:{" "}
                        {formatDate(app.decidedAt, language)}
                      </span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </SiteShell>
  );
}
