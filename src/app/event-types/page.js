"use client";

import { ArrowLeftOutlined, ArrowRightOutlined, MessageOutlined } from "@ant-design/icons";
import { Button } from "antd";
import Image from "next/image";
import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { TertiaryButton } from "@/components/TertiaryButton";
import { usePreferences } from "@/app/providers";
import { copy } from "@/lib/siteContent";

export default function EventTypesPage() {
  const { language } = usePreferences();
  const t = copy[language] ?? copy.np;
  const eventTypes = t.eventTypes;
  const page = eventTypes.page;

  return (
    <SiteShell pageTitle={page.pageTitle}>
      <section className="event-types-page" aria-labelledby="event-types-page-title">
        <header className="event-types-page-header">
          <TertiaryButton href="/#top" icon={<ArrowLeftOutlined />}>
            {page.backToHome}
          </TertiaryButton>
          <span className="eyebrow">{page.eyebrow}</span>
          <h1 id="event-types-page-title">{page.title}</h1>
          <p>{page.intro}</p>
        </header>

        <section className="event-types-page-group" aria-labelledby="event-types-page-primary-title">
          <div className="event-types-page-group-heading">
            <h2 id="event-types-page-primary-title">{page.primaryHeading}</h2>
            <p>{page.primaryIntro}</p>
          </div>

          <div className="event-types-grid event-types-grid--page">
            {eventTypes.items.map((item) => (
              <Link
                className={`event-type-card event-type-card--${item.status}`}
                data-event-type={item.id}
                href={`/event-types/${item.id}`}
                key={item.id}
              >
                <div className="event-type-image">
                  <span className={`event-type-badge event-type-badge--${item.status}`}>
                    {item.status === "current"
                      ? eventTypes.badgeCurrent
                      : item.status === "next"
                        ? eventTypes.badgeNext
                        : eventTypes.badgeFuture}
                  </span>
                  <Image
                    alt={item.imageAlt}
                    fill
                    sizes="(max-width: 620px) calc(100vw - 56px), (max-width: 1180px) 45vw, 320px"
                    src={item.image}
                  />
                </div>
                <div className="event-type-body">
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="event-types-page-group" aria-labelledby="event-types-page-additional-title">
          <div className="event-types-page-group-heading">
            <h2 id="event-types-page-additional-title">{page.additionalHeading}</h2>
            <p>{page.additionalIntro}</p>
          </div>

          <div className="event-types-additional-grid">
            {page.additionalItems.map((item) => (
              <article
                className="event-type-additional-card"
                data-event-type={item.id}
                key={item.id}
              >
                <span className="event-type-badge event-type-badge--future">
                  {eventTypes.badgeFuture}
                </span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="event-types-suggest-card">
          <div className="event-types-suggest-copy">
            <span className="eyebrow">{page.suggestCta.eyebrow}</span>
            <h2>{page.suggestCta.title}</h2>
            <p>{page.suggestCta.body}</p>
          </div>
          <div className="event-types-suggest-action">
            <Button
              type="primary"
              size="large"
              href={page.suggestCta.href}
              icon={<MessageOutlined />}
            >
              {page.suggestCta.buttonLabel}
            </Button>
          </div>
        </aside>

        <p className="event-types-phase-note phase-note">
          <span aria-hidden="true">
            <Image alt="" height={96} src="/images/logo.png" width={96} />
          </span>
          {eventTypes.phaseNote}
        </p>

        <div className="event-types-page-footer-action">
          <TertiaryButton href="/#top" icon={<ArrowLeftOutlined />}>
            {page.backToHome}
          </TertiaryButton>
        </div>
      </section>
    </SiteShell>
  );
}
