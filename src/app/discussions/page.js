"use client";

// Phase 7 v1 — /discussions list. Reads from src/lib/discussionsStub.js
// until the backend ships the discussions endpoints described in
// docs/api-requirements/discussions.md + feature-votes.md.
// v1 enables the "New topic" button with a gracefully-degrading form.

import { PlusOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { Button } from "antd";
import { SiteShell } from "@/components/SiteShell";
import { DiscussionListCard } from "@/components/DiscussionListCard";
import { usePreferences } from "@/app/providers";
import { copy } from "@/lib/siteContent";
import { listDiscussionTopics } from "@/lib/discussionsStub";
import { apiPostTopic } from "@/lib/discussionsApi";

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

  // New-topic form state
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newAnonymous, setNewAnonymous] = useState(false);

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

  const handlePostTopic = async () => {
    if (!newTitle.trim() || !newBody.trim()) return;
    setSubmitting(true);
    try {
      const kind = tab === "proposals" ? "FEATURE_PROPOSAL" : "GENERAL";
      const newTopic = await apiPostTopic(
        { kind, title: newTitle.trim(), body: newBody.trim(), anonymous: newAnonymous },
        { isDemoId: true }
      );
      setTopics((prev) => [newTopic, ...prev]);
      setShowNewTopic(false);
      setNewTitle("");
      setNewBody("");
      setNewAnonymous(false);
    } catch {
      // silent — demo mode always works
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelNewTopic = () => {
    setShowNewTopic(false);
    setNewTitle("");
    setNewBody("");
    setNewAnonymous(false);
  };

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
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowNewTopic(true)}
            >
              {tab === "proposals" ? t.newProposal : t.newTopic}
            </Button>
          </div>
        </div>

        {showNewTopic ? (
          <div
            className="discussions-new-topic-form"
            role="dialog"
            aria-label={tab === "proposals" ? t.newProposal : t.newTopic}
          >
            <h2>{tab === "proposals" ? t.newProposal : t.newTopic}</h2>
            <div className="discussions-new-topic-field">
              <label htmlFor="new-topic-title">
                {language === "np" ? "शीर्षक" : "Title"}
              </label>
              <input
                id="new-topic-title"
                type="text"
                className="discussions-new-topic-input"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                maxLength={200}
                required
              />
            </div>
            <div className="discussions-new-topic-field">
              <label htmlFor="new-topic-body">
                {language === "np" ? "विवरण" : "Details"}
              </label>
              <textarea
                id="new-topic-body"
                className="discussion-detail-composer-input"
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                rows={4}
                required
              />
            </div>
            <div className="discussions-new-topic-anon">
              <label className="discussions-anon-label">
                <input
                  type="checkbox"
                  checked={newAnonymous}
                  onChange={(e) => setNewAnonymous(e.target.checked)}
                />
                <span>
                  {language === "np"
                    ? "अज्ञात रूपमा पोस्ट गर्नुहोस्"
                    : "Post anonymously"}
                </span>
              </label>
            </div>
            <div className="discussions-new-topic-actions">
              <Button onClick={handleCancelNewTopic}>
                {language === "np" ? "रद्द गर्नुहोस्" : "Cancel"}
              </Button>
              <Button
                type="primary"
                loading={submitting}
                disabled={!newTitle.trim() || !newBody.trim()}
                onClick={handlePostTopic}
              >
                {language === "np" ? "पठाउनुहोस्" : "Post"}
              </Button>
            </div>
          </div>
        ) : null}

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
