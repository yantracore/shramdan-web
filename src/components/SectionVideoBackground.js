"use client";

import { useEffect, useRef } from "react";

export function SectionVideoBackground({
  src,
  poster,
  overlay = "soft",
  objectPosition = "center"
}) {
  const wrapperRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const video = videoRef.current;
    if (!wrapper || !video) return undefined;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const playSafe = () => {
      if (mq.matches) return;
      const p = video.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          playSafe();
        } else {
          video.pause();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(wrapper);

    const onMqChange = () => {
      if (mq.matches) {
        video.pause();
        video.currentTime = 0;
      }
    };
    mq.addEventListener?.("change", onMqChange);

    return () => {
      io.disconnect();
      mq.removeEventListener?.("change", onMqChange);
    };
  }, []);

  return (
    <div
      className={`section-video-bg section-video-bg--${overlay}`}
      ref={wrapperRef}
      aria-hidden="true"
    >
      <video
        ref={videoRef}
        className="section-video-bg-media"
        style={{ objectPosition }}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
      />
      <span className="section-video-bg-overlay" />
    </div>
  );
}

export default SectionVideoBackground;
