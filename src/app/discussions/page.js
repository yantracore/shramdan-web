"use client";

// Phase 7 — /discussions list. Reads from src/lib/discussionsStub.js until
// the backend ships the endpoints in docs/api-requirements/discussions.md
// + feature-votes.md.
//
// 2026-06-16 makeover: stats strip, in-list search, glass modal composer,
// vote-first cards, and a "how promotion works" side rail so the page reads
// as the feature-request board it actually is.

import {
  BulbOutlined,
  CheckCircleFilled,
  CloseOutlined,
  CommentOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  RocketOutlined,
  SearchOutlined
} from "@ant-design/icons";
import { useCallback, useEffect, useMemo, useState } from "react";
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

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

export default function DiscussionsPage() {
  const { language } = usePreferences();
  const np = language === "np";
  const t = (copy[language] && copy[language].discussions) || copy.np.discussions;
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState("recentActivity");
  const [query, setQuery] = useState("");
  const [topics, setTopics] = useState([]);
  const [allTopics, setAllTopics] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // New-topic modal state
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newAnonymous, setNewAnonymous] = useState(false);

  const handleCancelNewTopic = useCallback(() => {
    setShowNewTopic(false);
    setNewTitle("");
    setNewBody("");
    setNewAnonymous(false);
  }, []);

  // Tab/sort-driven list.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoaded(false);
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

  // Unfiltered snapshot for the stats strip (fetched once).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listDiscussionTopics({ limit: 50 });
        if (!cancelled) setAllTopics(res.items ?? []);
      } catch {
        if (!cancelled) setAllTopics([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Escape-to-close for the modal.
  useEffect(() => {
    if (!showNewTopic) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") handleCancelNewTopic();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showNewTopic, handleCancelNewTopic]);

  const stats = useMemo(() => {
    const total = allTopics.length;
    const openProposals = allTopics.filter(
      (r) => r.kind === "FEATURE_PROPOSAL" && r.proposalStatus !== "PROMOTED" && r.proposalStatus !== "DECLINED"
    ).length;
    const promoted = allTopics.filter((r) => r.proposalStatus === "PROMOTED").length;
    return { total, openProposals, promoted };
  }, [allTopics]);

  const visibleTopics = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return topics;
    return topics.filter(
      (r) =>
        (r.title || "").toLowerCase().includes(q) ||
        (r.body || "").toLowerCase().includes(q)
    );
  }, [topics, query]);

  const tabs = [
    { key: "all", label: t.tabs?.all },
    { key: "general", label: t.tabs?.general },
    { key: "proposals", label: t.tabs?.proposals }
  ];

  const statTiles = [
    { value: stats.total, label: np ? "जम्मा छलफल" : "Discussions", icon: <CommentOutlined />, accent: "var(--primary)" },
    { value: stats.openProposals, label: np ? "खुला फिचर अनुरोध" : "Open proposals", icon: <BulbOutlined />, accent: "#2563eb" },
    { value: stats.promoted, label: np ? "रोडम्यापमा सारिएका" : "On the roadmap", icon: <RocketOutlined />, accent: "#16a34a" }
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
      setAllTopics((prev) => [newTopic, ...prev]);
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

  const isProposalTab = tab === "proposals";
  const ctaLabel = isProposalTab ? t.newProposal : t.newTopic;

  return (
    <SiteShell pageTitle={t.pageTitle}>
      <section className="page-section discussions-section">
        <div className="section-heading discussions-heading">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </div>

        <ul className="discussions-stats" aria-label={np ? "छलफलको सारांश" : "Discussion summary"}>
          {statTiles.map((s) => (
            <li className="discussions-stat" key={s.label} style={{ "--stat-accent": s.accent }}>
              <span className="discussions-stat-icon" aria-hidden="true">{s.icon}</span>
              <span className="discussions-stat-text">
                <span className="discussions-stat-value">{localizeDigits(s.value, language)}</span>
                <span className="discussions-stat-label">{s.label}</span>
              </span>
            </li>
          ))}
        </ul>

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
            <div className="discussions-search">
              <SearchOutlined aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={np ? "छलफल खोज्नुहोस्…" : "Search discussions…"}
                aria-label={np ? "छलफल खोज्नुहोस्" : "Search discussions"}
              />
              {query ? (
                <button
                  type="button"
                  className="discussions-search-clear"
                  onClick={() => setQuery("")}
                  aria-label={np ? "खोज खाली गर्नुहोस्" : "Clear search"}
                >
                  <CloseOutlined />
                </button>
              ) : null}
            </div>

            <label className="discussions-sort">
              <span className="discussions-sort-label">{t.sortLabel}</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="recentActivity">{t.sortRecentActivity}</option>
                <option value="upvotes">{t.sortUpvotes}</option>
                {isProposalTab ? (
                  <option value="nearThreshold">{t.sortNearThreshold}</option>
                ) : null}
              </select>
            </label>

            <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowNewTopic(true)}>
              {ctaLabel}
            </Button>
          </div>
        </div>

        <div className="discussions-layout">
          <div className="discussions-main">
            {!loaded ? (
              <ul className="discussions-skeleton" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <li key={i} className="discussion-skel" />
                ))}
              </ul>
            ) : visibleTopics.length === 0 ? (
              <div className="discussions-empty" role="status">
                <span className="discussions-empty-icon" aria-hidden="true">
                  <CommentOutlined />
                </span>
                <p>
                  {query
                    ? (np ? "खोजसँग मिल्ने छलफल भेटिएन।" : "No discussions match your search.")
                    : t.emptyMessage}
                </p>
                {!query ? (
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowNewTopic(true)}>
                    {ctaLabel}
                  </Button>
                ) : null}
              </div>
            ) : (
              <>
                <p className="discussions-result-meta">
                  {localizeDigits(visibleTopics.length, language)}{" "}
                  {np ? "छलफल" : visibleTopics.length === 1 ? "discussion" : "discussions"}
                </p>
                <ul className="discussions-list" role="list">
                  {visibleTopics.map((topic) => (
                    <li key={topic.id}>
                      <DiscussionListCard topic={topic} language={language} copy={t} />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <aside className="discussions-aside" aria-label={np ? "छलफल बारे" : "About discussions"}>
            <div className="discussions-aside-card">
              <h2><InfoCircleOutlined aria-hidden="true" /> {np ? "अनुरोध कसरी अघि बढ्छ" : "How a proposal moves"}</h2>
              <ol className="discussions-howto-steps">
                <li className="discussions-howto-step">
                  <span><strong>{np ? "विषय खोल्नुहोस्" : "Open a topic"}</strong> — {np ? "सामान्य छलफल वा फिचर अनुरोध।" : "a general discussion or a feature ask."}</span>
                </li>
                <li className="discussions-howto-step">
                  <span><strong>{np ? "समर्थन बटुल्नुहोस्" : "Gather support"}</strong> — {np ? `${localizeDigits(20, language)} समर्थन पुगेपछि दहलीजमा पुग्छ।` : "20 votes reaches the threshold."}</span>
                </li>
                <li className="discussions-howto-step">
                  <span><strong>{np ? "रोडम्यापमा" : "Onto the roadmap"}</strong> — {np ? "दहलीज नाघेका अनुरोध टोलीले रोडम्यापमा सार्छ।" : "threshold-passing asks get promoted."}</span>
                </li>
              </ol>
            </div>

            <div className="discussions-aside-card">
              <h2><CheckCircleFilled aria-hidden="true" style={{ color: "#16a34a" }} /> {np ? "ब्याजहरू" : "Badges"}</h2>
              <div className="discussions-legend">
                <span className="discussions-legend-row">
                  <span className="discussion-card-promotion discussion-card-promotion--eligible">{t.promotionEligible}</span>
                  {np ? "दहलीजमा पुग्यो" : "reached the threshold"}
                </span>
                <span className="discussions-legend-row">
                  <span className="discussion-card-promotion discussion-card-promotion--promoted">{t.promotionPromoted}</span>
                  {np ? "रोडम्यापमा सारियो" : "now on the roadmap"}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {showNewTopic ? (
        <div
          className="discussions-modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleCancelNewTopic();
          }}
        >
          <div
            className="discussions-modal"
            role="dialog"
            aria-modal="true"
            aria-label={ctaLabel}
          >
            <div className="discussions-modal-head">
              <h2>{ctaLabel}</h2>
              <p>
                {isProposalTab
                  ? (np
                      ? "श्रमदान एपमा के थपियोस् भन्ने सुझाव — समर्थन पुगे रोडम्यापमा जान्छ।"
                      : "Suggest what Shramdan should build — enough support sends it to the roadmap.")
                  : (np
                      ? "समुदायसँग कुनै विषय, सुझाव वा प्रश्न साझा गर्नुहोस्।"
                      : "Share a topic, suggestion, or question with the community.")}
              </p>
            </div>

            <div className="discussions-modal-field">
              <label htmlFor="new-topic-title">{np ? "शीर्षक" : "Title"}</label>
              <input
                id="new-topic-title"
                type="text"
                className="discussions-modal-input"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                maxLength={200}
                placeholder={np ? "छोटो, स्पष्ट शीर्षक" : "A short, clear title"}
                autoFocus
                required
              />
            </div>

            <div className="discussions-modal-field">
              <label htmlFor="new-topic-body">{np ? "विवरण" : "Details"}</label>
              <textarea
                id="new-topic-body"
                className="discussions-modal-textarea"
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                rows={5}
                placeholder={np ? "तपाईंको विचार विस्तारमा लेख्नुहोस्…" : "Explain your idea in a little detail…"}
                required
              />
            </div>

            <label className="discussions-anon-label">
              <input
                type="checkbox"
                checked={newAnonymous}
                onChange={(e) => setNewAnonymous(e.target.checked)}
              />
              <span>{np ? "अज्ञात रूपमा पोस्ट गर्नुहोस्" : "Post anonymously"}</span>
            </label>

            <div className="discussions-modal-actions">
              <Button onClick={handleCancelNewTopic}>{np ? "रद्द गर्नुहोस्" : "Cancel"}</Button>
              <Button
                type="primary"
                loading={submitting}
                disabled={!newTitle.trim() || !newBody.trim()}
                onClick={handlePostTopic}
              >
                {np ? "पठाउनुहोस्" : "Post"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </SiteShell>
  );
}
