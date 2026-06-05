"use client";

// /app-development — public, community-driven board for building the
// Shramdan app itself. Backed by the App Development Tasks entity (see
// docs/api-requirements/app-development.md). Frontend ships against a
// curated staging stub for now; backend wires up later. The five-stage
// state machine (proposed → discussion → accepted → in_progress → shipped)
// is reflected in chips and filters.

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  CommentOutlined,
  FireOutlined,
  LikeFilled,
  LikeOutlined,
  PlusOutlined,
  ThunderboltOutlined,
  UserOutlined
} from "@ant-design/icons";
import { Button, Empty, Segmented, Tag, Tooltip } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { copy } from "@/lib/siteContent";
import { getAuthSession, subscribeAuthSession } from "@/lib/authSession";
import { buildLoginHref } from "@/lib/loginRedirect";
import { APP_DEV_TASKS } from "@/lib/appDevStub";

const SORT_OPTIONS = ["top", "new", "discussed"];
const CATEGORY_OPTIONS = [
  "all",
  "frontend",
  "backend",
  "design",
  "content",
  "docs",
  "qa",
  "ops",
  "community"
];

function sortTasks(tasks, sort) {
  const copy = [...tasks];
  if (sort === "new") {
    copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } else if (sort === "discussed") {
    copy.sort((a, b) => b.commentCount - a.commentCount);
  } else {
    copy.sort((a, b) => b.voteCount - a.voteCount);
  }
  return copy;
}

export default function AppDevelopmentPage() {
  const { language } = usePreferences();
  const t = copy[language].appDev;
  const router = useRouter();
  const session = useSyncExternalStore(subscribeAuthSession, getAuthSession, () => null);
  const isAuthenticated = Boolean(session?.user);

  const [sort, setSort] = useState("top");
  const [category, setCategory] = useState("all");
  const [voted, setVoted] = useState(() => new Set());

  const tasks = useMemo(() => {
    const filtered =
      category === "all"
        ? APP_DEV_TASKS
        : APP_DEV_TASKS.filter((task) => task.category === category);
    return sortTasks(filtered, sort);
  }, [category, sort]);

  const handleVote = (taskId) => {
    if (!isAuthenticated) {
      router.push(buildLoginHref("/app-development"));
      return;
    }
    setVoted((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  return (
    <SiteShell pageTitle={t.pageTitle}>
      <section className="page-section app-dev-section">
        <header className="app-dev-hero">
          <div className="app-dev-hero__copy">
            <span className="eyebrow">{t.eyebrow}</span>
            <h1>{t.title}</h1>
            <p>{t.intro}</p>
          </div>
          <aside className="app-dev-hero__live" aria-label={t.live.badge}>
            <span className="app-dev-hero__live-badge">
              <FireOutlined aria-hidden="true" />
              {t.live.badge}
            </span>
            <p>{t.live.body}</p>
          </aside>
        </header>

        <div className="app-dev-toolbar" role="toolbar" aria-label={t.eyebrow}>
          <Segmented
            value={sort}
            onChange={setSort}
            options={SORT_OPTIONS.map((value) => ({
              value,
              label: t.sortLabels[value]
            }))}
          />
          <div className="app-dev-toolbar__filters">
            <span className="app-dev-toolbar__filters-label">{t.filters.category}</span>
            <div className="app-dev-chip-row">
              {CATEGORY_OPTIONS.map((value) => {
                const label = value === "all" ? t.filters.all : t.categories[value];
                const active = value === category;
                return (
                  <button
                    key={value}
                    type="button"
                    className={`app-dev-chip${active ? " is-active" : ""}`}
                    onClick={() => setCategory(value)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <Tooltip title={isAuthenticated ? null : t.loginPrompt.body}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                if (!isAuthenticated) {
                  router.push(buildLoginHref("/app-development"));
                  return;
                }
                router.push("/app-development/new");
              }}
            >
              {t.actions.propose}
            </Button>
          </Tooltip>
        </div>

        {tasks.length === 0 ? (
          <Empty
            className="app-dev-empty"
            description={
              <div>
                <strong>{t.empty.title}</strong>
                <p>{t.empty.body}</p>
              </div>
            }
          />
        ) : (
          <ul className="app-dev-list" aria-label={t.title}>
            {tasks.map((task) => {
              const hasVoted = voted.has(task.id);
              const voteCount = task.voteCount + (hasVoted ? 1 : 0);
              const localized = task.locales?.[language] || task.locales?.np;
              return (
                <li key={task.id} className="app-dev-card">
                  <div className="app-dev-card__media">
                    <Image
                      src={task.representativeImageUrl}
                      alt=""
                      width={480}
                      height={320}
                      className="app-dev-card__img"
                    />
                    <span className={`app-dev-status app-dev-status--${task.status}`}>
                      {t.status[task.status]}
                    </span>
                  </div>
                  <div className="app-dev-card__body">
                    <div className="app-dev-card__meta">
                      <Tag color="blue" bordered={false}>
                        {t.categories[task.category]}
                      </Tag>
                      {task.difficulty ? (
                        <Tag color="purple" bordered={false}>
                          {t.difficulty[task.difficulty]}
                        </Tag>
                      ) : null}
                      {task.branches?.slice(0, 2).map((branch) => (
                        <span key={branch} className="app-dev-branch">
                          {branch}
                        </span>
                      ))}
                    </div>

                    <h2 className="app-dev-card__title">
                      <Link href={`/app-development/${task.slug}`}>
                        {localized.title}
                      </Link>
                    </h2>
                    <p className="app-dev-card__summary">{localized.summary}</p>

                    {task.skillTags?.length ? (
                      <div className="app-dev-card__skills" aria-label={t.labels.skills}>
                        <span className="app-dev-card__skills-label">
                          {t.labels.skills}:
                        </span>
                        {task.skillTags.map((skill) => (
                          <span key={skill} className="app-dev-skill">
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="app-dev-card__footer">
                      <div className="app-dev-card__leader">
                        <UserOutlined aria-hidden="true" />
                        <span>
                          {task.leader ? (
                            <>
                              <strong>{t.labels.leader}:</strong> {task.leader.name}
                            </>
                          ) : (
                            t.labels.unassigned
                          )}
                        </span>
                      </div>
                      <div className="app-dev-card__actions">
                        <button
                          type="button"
                          className={`app-dev-vote${hasVoted ? " is-voted" : ""}`}
                          onClick={() => handleVote(task.id)}
                          aria-pressed={hasVoted}
                          aria-label={`${t.actions.vote} (${voteCount})`}
                        >
                          {hasVoted ? <LikeFilled /> : <LikeOutlined />}
                          <span>{voteCount}</span>
                          <span className="app-dev-vote__label">
                            {hasVoted ? t.actions.voted : t.actions.vote}
                          </span>
                        </button>
                        <Link
                          href={`/app-development/${task.slug}#comments`}
                          className="app-dev-comment"
                        >
                          <CommentOutlined />
                          <span>{task.commentCount}</span>
                          <span className="app-dev-comment__label">
                            {t.labels.comments}
                          </span>
                        </Link>
                        {task.status === "proposed" || task.status === "discussion" ? (
                          <Button
                            size="small"
                            type="primary"
                            ghost
                            icon={<ThunderboltOutlined />}
                            onClick={() => {
                              if (!isAuthenticated) {
                                router.push(buildLoginHref("/app-development"));
                                return;
                              }
                              router.push(`/app-development/${task.slug}#take-lead`);
                            }}
                          >
                            {t.actions.takeLead}
                          </Button>
                        ) : null}
                      </div>
                    </div>
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
