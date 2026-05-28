"use client";

import { SiteShell } from "@/components/SiteShell";

export function LegalPage({ pageTitle, content }) {
  return (
    <SiteShell pageTitle={pageTitle}>
      <section className="page-section legal-section">
        <article className="content-card legal-article">
          <header className="form-card-heading">
            <span className="eyebrow">{content.eyebrow}</span>
            <h1>{content.title}</h1>
            <p className="legal-last-updated">{content.lastUpdated}</p>
          </header>
          {content.intro ? <p className="legal-intro">{content.intro}</p> : null}
          {content.sections.map((section, index) => (
            <section className="legal-section-block" key={index}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph, paragraphIndex) => (
                <p key={paragraphIndex}>{paragraph}</p>
              ))}
            </section>
          ))}
          {content.footer ? <p className="legal-footer-note">{content.footer}</p> : null}
        </article>
      </section>
    </SiteShell>
  );
}
