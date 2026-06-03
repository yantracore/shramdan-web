"use client";

// /app/issues — mobile-first member issue list (roadmap 2.3).
// Mirrors the public /issues list but stacks cards in a single
// column for mobile consumption and includes a quick "report"
// floating action button.

import {
  ArrowRightOutlined,
  EnvironmentOutlined,
  HeartOutlined,
  PlusOutlined
} from "@ant-design/icons";
import { Button, Empty, Select } from "antd";
import Link from "next/link";
import { useMemo, useState } from "react";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { getDemoPublicIssues } from "@/lib/devMockData";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

const STATUS_VALUES = ["OPEN", "PROMOTED", "EVENT_SCHEDULED", "COMPLETED"];

const COPY = {
  np: {
    pageTitle: "मेरा समस्या",
    eyebrow: "समस्याहरू",
    title: "स्थानीय समस्याहरू",
    intro:
      "तपाईंको वा छिमेकका रिपोर्ट गरिएका समस्याहरू एकै ठाउँमा। समस्यामा समर्थन गर्न वा नयाँ रिपोर्ट गर्न मोबाइलबाटै सजिलो।",
    filterStatus: "स्थिति",
    filterAll: "सबै",
    reportCta: "नयाँ समस्या",
    emptyState: "अहिले कुनै समस्या भेटिएन।",
    voteSuffix: "{n} समर्थन",
    openDetail: "विस्तृत",
    statusLabels: {
      OPEN: "खुला",
      PROMOTED: "अभियानमा सरिएको",
      EVENT_SCHEDULED: "अभियान तय",
      COMPLETED: "सम्पन्न"
    }
  },
  en: {
    pageTitle: "My issues",
    eyebrow: "Issues",
    title: "Local issues",
    intro:
      "Issues reported by you or your neighbourhood, in one place. Support an issue or file a new one — mobile-friendly.",
    filterStatus: "Status",
    filterAll: "All",
    reportCta: "Report new",
    emptyState: "No issues found.",
    voteSuffix: "{n} supporting",
    openDetail: "View",
    statusLabels: {
      OPEN: "Open",
      PROMOTED: "Promoted",
      EVENT_SCHEDULED: "Scheduled",
      COMPLETED: "Completed"
    }
  }
};

export default function AppIssuesPage() {
  const { language } = usePreferences();
  const t = COPY[language] || COPY.np;
  const [statusFilter, setStatusFilter] = useState("ALL");

  const issues = useMemo(() => getDemoPublicIssues(), []);
  const filtered = useMemo(() => {
    if (statusFilter === "ALL") return issues;
    return issues.filter((i) => i.status === statusFilter);
  }, [issues, statusFilter]);

  const statusOptions = [
    { value: "ALL", label: t.filterAll },
    ...STATUS_VALUES.map((value) => ({
      value,
      label: t.statusLabels[value] || value
    }))
  ];

  return (
    <SiteShell pageTitle={t.pageTitle}>
      <section className="app-issues page-section">
        <header className="app-issues-hero">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </header>

        <div className="app-issues-toolbar">
          <div className="app-issues-filter">
            <label>{t.filterStatus}</label>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              style={{ minWidth: 160 }}
            />
          </div>
          <Link href="/app/issues/new">
            <Button type="primary" icon={<PlusOutlined />}>
              {t.reportCta}
            </Button>
          </Link>
        </div>

        {filtered.length === 0 ? (
          <Empty description={t.emptyState} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <ul className="app-issues-list">
            {filtered.map((issue) => (
              <li key={issue.id} className="app-issues-card">
                <Link href={`/issues/${issue.id}`} className="app-issues-card-link">
                  <span className="app-issues-card-status">
                    {t.statusLabels[issue.status] || issue.status}
                  </span>
                  <h2 className="app-issues-card-title">{issue.title}</h2>
                  <p className="app-issues-card-meta">
                    <EnvironmentOutlined aria-hidden="true" /> {issue.addressText}
                  </p>
                  <div className="app-issues-card-footer">
                    <span className="app-issues-card-votes">
                      <HeartOutlined aria-hidden="true" />{" "}
                      {t.voteSuffix.replace(
                        "{n}",
                        localizeDigits(issue.voteCount || 0, language)
                      )}
                    </span>
                    <span className="app-issues-card-arrow">
                      {t.openDetail} <ArrowRightOutlined aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </SiteShell>
  );
}
