"use client";

import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  AimOutlined,
  CompassOutlined,
  EnvironmentOutlined,
  RiseOutlined,
  TeamOutlined,
  ToolOutlined
} from "@ant-design/icons";
import { Button, Empty } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { copy } from "@/lib/siteContent";

export default function EventTypeDetailPage() {
  const params = useParams();
  const id = params?.id;
  const { language } = usePreferences();
  const t = copy[language] ?? copy.np;
  const eventTypes = t.eventTypes;
  const detail = eventTypes.detail;

  const item = eventTypes.items.find((entry) => entry.id === id);

  if (!item) {
    return (
      <SiteShell pageTitle={detail.notFoundTitle}>
        <section className="event-type-detail-notfound">
          <Empty
            description={
              <>
                <strong>{detail.notFoundTitle}</strong>
                <p>{detail.notFoundBody}</p>
              </>
            }
          >
            <Link href="/event-types">
              <Button type="primary" icon={<ArrowLeftOutlined />}>
                {detail.backToList}
              </Button>
            </Link>
          </Empty>
        </section>
      </SiteShell>
    );
  }

  const related = (item.relatedIds || [])
    .map((rid) => eventTypes.items.find((entry) => entry.id === rid))
    .filter(Boolean);

  return (
    <SiteShell pageTitle={`${item.title} | ${eventTypes.page.pageTitle}`}>
      <article className="event-type-detail">
        <header className="event-type-detail-header">
          <Link className="event-type-detail-back" href="/event-types">
            <ArrowLeftOutlined aria-hidden="true" />
            {detail.backToList}
          </Link>
          <span className="eyebrow">{detail.eyebrow}</span>
          <h1>{item.title}</h1>
          {item.tagline ? (
            <p className="event-type-detail-tagline">{item.tagline}</p>
          ) : null}
          <span
            className={`event-type-badge event-type-badge--${item.status} event-type-detail-status-badge`}
          >
            {item.status === "current"
              ? eventTypes.badgeCurrent
              : item.status === "next"
                ? eventTypes.badgeNext
                : eventTypes.badgeFuture}
          </span>
        </header>

        <section
          className={`event-type-detail-hero event-type-detail-hero--${item.status}`}
          aria-labelledby="event-type-detail-overview-title"
        >
          <div className="event-type-detail-hero-image" data-event-type={item.id}>
            <Image
              alt={item.imageAlt}
              fill
              sizes="(max-width: 980px) 100vw, 540px"
              src={item.image}
              priority
            />
          </div>
          <div className="event-type-detail-hero-copy">
            <h2 id="event-type-detail-overview-title">
              <AimOutlined aria-hidden="true" />
              {detail.overviewHeading}
            </h2>
            <p>{item.overview}</p>
          </div>
        </section>

        {item.scope && item.scope.length > 0 ? (
          <section className="event-type-detail-section event-type-detail-scope">
            <h2>
              <ToolOutlined aria-hidden="true" />
              {detail.scopeHeading}
            </h2>
            <ul className="event-type-detail-list event-type-detail-list--two">
              {item.scope.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="event-type-detail-three">
          {item.whoCanHelp && item.whoCanHelp.length > 0 ? (
            <section className="event-type-detail-card">
              <h2>
                <TeamOutlined aria-hidden="true" />
                {detail.whoHeading}
              </h2>
              <ul className="event-type-detail-list">
                {item.whoCanHelp.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {item.whereItHappens && item.whereItHappens.length > 0 ? (
            <section className="event-type-detail-card">
              <h2>
                <EnvironmentOutlined aria-hidden="true" />
                {detail.whereHeading}
              </h2>
              <ul className="event-type-detail-list">
                {item.whereItHappens.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {item.impact && item.impact.length > 0 ? (
            <section className="event-type-detail-card">
              <h2>
                <RiseOutlined aria-hidden="true" />
                {detail.impactHeading}
              </h2>
              <ul className="event-type-detail-list">
                {item.impact.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {item.statusNote ? (
          <section
            className={`event-type-detail-status event-type-detail-status--${item.status}`}
          >
            <div className="event-type-detail-status-copy">
              <span className="eyebrow">
                <CompassOutlined aria-hidden="true" />
                {detail.statusHeading}
              </span>
              <p>{item.statusNote}</p>
            </div>
            {item.ctaLabel && item.ctaHref ? (
              <Button
                type="primary"
                size="large"
                href={item.ctaHref}
                icon={<ArrowRightOutlined />}
              >
                {item.ctaLabel}
              </Button>
            ) : null}
          </section>
        ) : null}

        {related.length > 0 ? (
          <section
            className="event-type-detail-related"
            aria-labelledby="event-type-detail-related-title"
          >
            <h2 id="event-type-detail-related-title">{detail.relatedHeading}</h2>
            <div className="event-types-grid event-types-grid--related">
              {related.map((rel) => (
                <Link
                  className={`event-type-card event-type-card--${rel.status}`}
                  data-event-type={rel.id}
                  href={`/event-types/${rel.id}`}
                  key={rel.id}
                >
                  <div className="event-type-image">
                    <span
                      className={`event-type-badge event-type-badge--${rel.status}`}
                    >
                      {rel.status === "current"
                        ? eventTypes.badgeCurrent
                        : rel.status === "next"
                          ? eventTypes.badgeNext
                          : eventTypes.badgeFuture}
                    </span>
                    <Image
                      alt={rel.imageAlt}
                      fill
                      sizes="(max-width: 620px) calc(100vw - 56px), (max-width: 1180px) 33vw, 320px"
                      src={rel.image}
                    />
                  </div>
                  <div className="event-type-body">
                    <h3>{rel.title}</h3>
                    <p>{rel.body}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <div className="event-type-detail-footer-actions">
          <Link className="event-type-detail-back" href="/event-types">
            <ArrowLeftOutlined aria-hidden="true" />
            {detail.backToList}
          </Link>
        </div>
      </article>
    </SiteShell>
  );
}
