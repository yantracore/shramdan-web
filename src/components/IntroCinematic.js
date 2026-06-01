"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePreferences } from "@/app/providers";

// Cinematic scrollable intro (Phase 4). Uses GSAP + ScrollTrigger
// dynamically (browser-only) so it doesn't ship on the SSR pass.
// Each .intro-act fades up + slides 24px when its top crosses 80%
// of the viewport. Reduced-motion + the user's entranceAnimation
// toggle both gate the animation off.

const IS_BROWSER = typeof window !== "undefined";

export function IntroCinematic({ acts, ctas, copy }) {
  const rootRef = useRef(null);
  const { entranceAnimation } = usePreferences();

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
        const acts = gsap.utils.toArray(".intro-act");
        acts.forEach((act) => {
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

        // Hero parallax — title floats slower than scroll.
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

  return (
    <div className="intro-cinematic" ref={rootRef}>
      <section className="intro-hero">
        <p className="intro-eyebrow">{copy.eyebrow}</p>
        <h1 className="intro-hero-title">{copy.title}</h1>
        <p className="intro-hero-tagline">{copy.tagline}</p>
        <p className="intro-hero-scroll">{copy.scrollCue}</p>
      </section>

      {acts.map((act) => (
        <section key={act.id} className="intro-act" data-act={act.id}>
          {act.kicker ? <p className="intro-act-kicker">{act.kicker}</p> : null}
          <h2 className="intro-act-title">{act.title}</h2>
          {act.body ? <p className="intro-act-body">{act.body}</p> : null}
          {act.items?.length ? (
            <ol className="intro-act-list">
              {act.items.map((item, i) => (
                <li key={i}>
                  <span className="intro-act-list-num">{i + 1}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          ) : null}
          {act.quote ? <blockquote className="intro-act-quote">{act.quote}</blockquote> : null}
        </section>
      ))}

      <section className="intro-act intro-cta">
        <h2 className="intro-act-title">{copy.ctaTitle}</h2>
        <p className="intro-act-body">{copy.ctaBody}</p>
        <div className="intro-cta-actions">
          {ctas.map((cta) => (
            <Link key={cta.href} href={cta.href} className="intro-cta-button">
              {cta.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
