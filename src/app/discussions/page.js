"use client";

// Phase 7 v0 — /discussions list. Reads from src/lib/discussionsStub.js
// until the backend ships the discussions endpoints described in
// docs/api-requirements/discussions.md + feature-votes.md.

import { PlusOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { Button } from "antd";
import { SiteShell } from "@/components/SiteShell";
import { DiscussionListCard } from "@/components/DiscussionListCard";
import { usePreferences } from "@/app/providers";
import { copy } from "@/lib/siteContent";
import { listDiscussionTopics } from "@/lib/discussionsStub";

const TAB_TO_KIND = {
  all: undefined,
  general: "GENERAL",
  proposals: "FEATURE_PROPOSAL"
};

export default function DiscussionsPage() {
  const { language } = usePreferences();
  const t = (copy[language] && copy[language].discussions) || copy.np.discussions;
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState("recentActivity");
  const [topics, setTopics] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listDiscussionTopics({ kind: TAB_TO_KIND[tab], sort, limit: 50 });
        if (cancelled) return;
        setTopics(res.items ?? []);
      } catch {
        if (cancelled) return;
        setTopics([]);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, sort]);

  const tabs = [
    { key: "all", label: t.tabs?.all },
    { key: "general", label: t.tabs?.general },
    { key: "proposals", label: t.tabs?.proposals }
  ];

  return (
    <SiteShell pageTitle={t.pageTitle}>
      <section className="page-section discussions-section">
        <div className="section-heading discussions-heading">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </div>

        <div className="discussions-toolbar">
          <div className="discussions-tabs" role="tablist" aria-label={t.filtersAria}>
            {tabs.map((tabItem) => (
              <button
                key={tabItem.key}
                type="button"
                role="tab"
                aria-selected={tab === tabItem.key}
                className={`discussions-tab${tab === tabItem.key ? " is-active" : ""}`}
                onClick={() => setTab(tabItem.key)}
              >
                {tabItem.label}
              </button>
            ))}
          </div>

          <div className="discussions-toolbar-right">
            <label className="discussions-sort">
              <span className="discussions-sort-label">{t.sortLabel}</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="recentActivity">{t.sortRecentActivity}</option>
                <option value="upvotes">{t.sortUpvotes}</option>
                {tab === "proposals" ? (
                  <option value="nearThreshold">{t.sortNearThreshold}</option>
                ) : null}
              </select>
            </label>
            <Button type="primary" icon={<PlusOutlined />} disabled>
              {tab === "proposals" ? t.newProposal : t.newTopic}
            </Button>
          </div>
        </div>

        {loaded && topics.length === 0 ? (
          <div className="discussions-empty" role="status">
            <p>{t.emptyMessage}</p>
          </div>
        ) : (
          <ul className="discussions-list" role="list">
            {topics.map((topic) => (
              <li key={topic.id}>
                <DiscussionListCard topic={topic} language={language} copy={t} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </SiteShell>
  );
}
