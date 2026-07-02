"use client";

// Phase 6 (2026-06-05 pivot) — the cinematic intro is now two photo-
// driven chapters: a five-step "how it works" lineup (rendered from
// siteContent.coreIdea so the homepage donor stays the single source
// of truth) and a community-collaboration grid. GSAP scroll
// choreography stays unchanged — every chapter is still an .intro-act
// so the fromTo(opacity, y) timeline animates the new shapes too.

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightOutlined } from "@ant-design/icons";
import { usePreferences } from "@/app/providers";
import { copy as siteCopy } from "@/lib/siteContent";

const IS_BROWSER = typeof window !== "undefined";
const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

function StepsChapter({ language }) {
  const steps = siteCopy[language]?.coreIdea?.steps || siteCopy.np.coreIdea.steps;
  return (
    <ol className="intro-workflow-grid">
      {steps.map((step, i) => (
        <li key={step.id} className="intro-workflow-card">
          <div className="intro-workflow-card-photo">
            <Image
              src={step.image}
              alt={step.imageAlt || step.title}
              fill
              sizes="(max-width: 720px) 100vw, (max-width: 1280px) 33vw, 18vw"
            />
            <span className="intro-workflow-card-number" aria-hidden="true">
              {localizeDigits(i + 1, language)}
            </span>
          </div>
          <h3>{step.title}</h3>
          <p>{step.body}</p>
        </li>
      ))}
    </ol>
  );
}

function CommunityChapter({ tiles }) {
  return (
    <div className="intro-community-grid">
      {tiles.map((tile) => (
        <article key={tile.id} className="intro-community-tile">
          <div className="intro-community-tile-photo">
            <Image
              src={tile.image}
              alt={tile.imageAlt || tile.title}
              fill
              sizes="(max-width: 720px) 100vw, (max-width: 1180px) 50vw, 33vw"
            />
          </div>
          <h3>{tile.title}</h3>
          <p>{tile.body}</p>
          {tile.link ? (
            <Link href={tile.link.href} className="intro-community-tile-link">
              {tile.link.label}
              <ArrowRightOutlined aria-hidden="true" />
            </Link>
          ) : null}
        </article>
      ))}
    </div>
  );
}

export function IntroCinematic({ copy, language = "np" }) {
  const rootRef = useRef(null);
  const { entranceAnimation } = usePreferences();
  const acts = copy?.acts || [];
  const [activeSection, setActiveSection] = useState(acts[0]?.id ?? "");

  // GSAP scroll choreography — kept verbatim from the prior cinematic.
  useEffect(() => {
    if (!IS_BROWSER) return;
    if (!rootRef.current) return;
    if (!entranceAnimation) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;

    let ctx;
    let cancelled = false;

    (async () => {
      const { default: gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        const sections = gsap.utils.toArray(".intro-act");
        sections.forEach((act) => {
          gsap.fromTo(
            act,
            { opacity: 0, y: 32 },
            {
              opacity: 1,
              y: 0,
              duration: 1.0,
              ease: "expo.out",
              scrollTrigger: {
                trigger: act,
                start: "top 82%",
                toggleActions: "play none none reverse"
              }
            }
          );
        });

        const heroTitle = document.querySelector(".intro-hero-title");
        if (heroTitle) {
          gsap.to(heroTitle, {
            y: -60,
            ease: "none",
            scrollTrigger: {
              trigger: ".intro-hero",
              start: "top top",
              end: "bottom top",
              scrub: 0.6
            }
          });
        }
      }, rootRef);
    })();

    return () => {
      cancelled = true;
      if (ctx) ctx.revert();
    };
  }, [entranceAnimation]);

  // Jump-nav active-section tracking — runs even when GSAP is gated off
  // (the right-rail nav is functional, not decorative).
  useEffect(() => {
    if (!IS_BROWSER) return;
    const targets = acts
      .map((act) => document.getElementById(`intro-section-${act.id}`))
      .filter(Boolean);
    if (targets.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const id = visible.target.id.replace(/^intro-section-/, "");
          setActiveSection(id);
        }
      },
      { rootMargin: "-30% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [acts]);

  return (
    <div className="intro-cinematic" ref={rootRef}>
      <section className="intro-hero">
        <p className="intro-eyebrow">{copy.eyebrow}</p>
        <h1 className="intro-hero-title">{copy.title}</h1>
      </section>

      {acts.length > 1 ? (
        <nav className="intro-jumpnav" aria-label={language === "np" ? "खण्ड नेभिगेसन" : "Section navigation"}>
          {acts.map((act) => (
            <a
              key={act.id}
              href={`#intro-section-${act.id}`}
              className="intro-jumpnav-link"
              aria-current={activeSection === act.id ? "true" : undefined}
            >
              <span className="intro-jumpnav-dot" aria-hidden="true" />
              <span className="intro-jumpnav-label">{act.kicker}</span>
            </a>
          ))}
        </nav>
      ) : null}

      {acts.map((act) => (
        <section
          key={act.id}
          id={`intro-section-${act.id}`}
          className={`intro-act intro-act-${act.id}`}
          data-act={act.id}
        >
          {act.kicker ? <p className="intro-act-kicker">{act.kicker}</p> : null}
          <h2 className="intro-act-title">{act.title}</h2>
          {act.body ? <p className="intro-act-body">{act.body}</p> : null}

          {act.id === "steps" ? <StepsChapter language={language} /> : null}
          {act.id === "community" && act.tiles ? <CommunityChapter tiles={act.tiles} /> : null}
        </section>
      ))}

      {copy.close ? (
        <section className="intro-act intro-close" data-act="close" id="intro-section-close">
          <p>
            {copy.close.text}{" "}
            <Link href={copy.close.link.href} className="intro-close-link">
              {copy.close.link.label}
              <ArrowRightOutlined aria-hidden="true" />
            </Link>
          </p>
        </section>
      ) : null}
    </div>
  );
}
