"use client";

// /discussions list — Phase 7 surface, 2026-06-18 app-style makeover.
//
// Reads from src/lib/discussionsStub.js until the backend ships the endpoints
// in docs/api-requirements/discussions.md + feature-votes.md.
//
// Layout: a sticky left CATEGORY rail (the topic taxonomy) + a main column
// with proper accessible KIND tabs, search, sort, and the vote-first card
// list. The old brochure hero band and 3-tile stats strip are gone — the
// page now opens straight on the work, app-not-brochure. Composition is
// split into reusable units under src/components/discussions/.

import { CloseOutlined, CommentOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { Button } from "antd";
import { SiteShell } from "@/components/SiteShell";
import { DiscussionListCard } from "@/components/DiscussionListCard";
import { DiscussionCategoryRail } from "@/components/discussions/DiscussionCategoryRail";
import { DiscussionTabs } from "@/components/discussions/DiscussionTabs";
import { NewTopicModal } from "@/components/discussions/NewTopicModal";
import {
  ALL_CATEGORY,
  DISCUSSION_CATEGORIES,
  localizeDigits,
  topicMatchesCategory
} from "@/components/discussions/discussionFormat";
import { usePreferences } from "@/app/providers";
import { copy } from "@/lib/siteContent";
import { listDiscussionTopics } from "@/lib/discussionsStub";
import { apiPostTopic } from "@/lib/discussionsApi";

const TAB_TO_KIND = {
  all: undefined,
  general: "GENERAL",
  proposals: "FEATURE_PROPOSAL"
};

function matchesTab(topic, tab) {
  const kind = TAB_TO_KIND[tab];
  return !kind || topic.kind === kind;
}

function matchesQuery(topic, q) {
  if (!q) return true;
  return (
    (topic.title || "").toLowerCase().includes(q) ||
    (topic.body || "").toLowerCase().includes(q)
  );
}

function sortTopics(rows, sort) {
  const out = [...rows];
  if (sort === "upvotes") {
    out.sort((a, b) => (b.upvoteCount || 0) - (a.upvoteCount || 0));
  } else if (sort === "nearThreshold") {
    out.sort((a, b) => (a.votesUntilThreshold ?? 99) - (b.votesUntilThreshold ?? 99));
  } else {
    out.sort((a, b) => Date.parse(b.lastActivityAt) - Date.parse(a.lastActivityAt));
  }
  return out;
}

export default function DiscussionsPage() {
  const { language } = usePreferences();
  const np = language === "np";
  const t = (copy[language] && copy[language].discussions) || copy.np.discussions;

  const [category, setCategory] = useState(ALL_CATEGORY);
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState("recentActivity");
  const [query, setQuery] = useState("");
  const [allTopics, setAllTopics] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [showNewTopic, setShowNewTopic] = useState(false);

  // Single fetch of the full corpus; all faceting happens client-side.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoaded(false);
      try {
        const res = await listDiscussionTopics({ limit: 50 });
        if (!cancelled) setAllTopics(res.items ?? []);
      } catch {
        if (!cancelled) setAllTopics([]);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const q = query.trim().toLowerCase();

  // Faceted counts: rail counts reflect the active tab + search; tab counts
  // reflect the active category + search. Every number matches what a click
  // would actually surface.
  const categoryCounts = useMemo(() => {
    const pool = allTopics.filter((r) => matchesTab(r, tab) && matchesQuery(r, q));
    const counts = {};
    for (const cat of DISCUSSION_CATEGORIES) {
      counts[cat.key] = pool.filter((r) => topicMatchesCategory(r, cat.key)).length;
    }
    return counts;
  }, [allTopics, tab, q]);

  const tabCounts = useMemo(() => {
    const pool = allTopics.filter((r) => topicMatchesCategory(r, category) && matchesQuery(r, q));
    return {
      all: pool.length,
      general: pool.filter((r) => r.kind === "GENERAL").length,
      proposals: pool.filter((r) => r.kind === "FEATURE_PROPOSAL").length
    };
  }, [allTopics, category, q]);

  const roadmapTally = useMemo(
    () => allTopics.filter((r) => r.proposalStatus === "PROMOTED").length,
    [allTopics]
  );

  const visibleTopics = useMemo(() => {
    const filtered = allTopics.filter(
      (r) => topicMatchesCategory(r, category) && matchesTab(r, tab) && matchesQuery(r, q)
    );
    return sortTopics(filtered, sort);
  }, [allTopics, category, tab, q, sort]);

  const isProposalTab = tab === "proposals";
  const ctaLabel = isProposalTab ? t.newProposal : t.newTopic;
  // Preselect the composer's category from the active rail filter.
  const composerCategory = category === ALL_CATEGORY ? "OTHER" : category;

  const tabs = [
    { key: "all", label: t.tabs?.all, count: tabCounts.all },
    { key: "general", label: t.tabs?.general, count: tabCounts.general },
    { key: "proposals", label: t.tabs?.proposals, count: tabCounts.proposals }
  ];

  const handlePostTopic = async (payload) => {
    try {
      const newTopic = await apiPostTopic(payload, { isDemoId: true });
      setAllTopics((prev) => [newTopic, ...prev]);
      setShowNewTopic(false);
    } catch {
      // silent — demo mode always works
    }
  };

  return (
    <SiteShell pageTitle={t.pageTitle}>
      <section className="page-section discussions-section">
        <div className="discussions-shell">
          <aside className="discussions-rail-wrap">
            <DiscussionCategoryRail
              active={category}
              onSelect={setCategory}
              counts={categoryCounts}
              labels={t}
              language={language}
              roadmapTally={roadmapTally}
            />
          </aside>

          <div className="discussions-main">
            <div className="discussions-toolbar">
              <DiscussionTabs
                tabs={tabs}
                value={tab}
                onChange={setTab}
                ariaLabel={t.filtersAria}
              />

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
                  {q
                    ? (np ? "खोजसँग मिल्ने छलफल भेटिएन।" : "No discussions match your search.")
                    : t.emptyMessage}
                </p>
                {!q ? (
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
        </div>
      </section>

      <NewTopicModal
        open={showNewTopic}
        kind={isProposalTab ? "FEATURE_PROPOSAL" : "GENERAL"}
        defaultCategory={composerCategory}
        labels={t}
        language={language}
        onClose={() => setShowNewTopic(false)}
        onSubmit={handlePostTopic}
      />
    </SiteShell>
  );
}
