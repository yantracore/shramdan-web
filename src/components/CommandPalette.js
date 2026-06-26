"use client";

// CommandPalette — cmd/ctrl+K opens a centered search dialog that
// filters across all top-level routes, event-type categories, and demo
// events/issues. Arrow keys navigate, Enter routes, Esc closes.
// All client-side; no backend search yet — once an /search endpoint
// exists we can swap the static dataset for a debounced fetch.

import {
  AppstoreOutlined,
  CalendarOutlined,
  FileTextOutlined,
  HomeOutlined,
  SearchOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { listAllEvents } from "@/lib/eventsApi";

const STATIC_ROUTES = [
  { id: "home", labels: ["गृहपृष्ठ", "Home"], href: "/", icon: HomeOutlined },
  { id: "campaign", labels: ["अभियानहरू", "अभियान", "समस्याहरू", "Campaign", "Campaigns", "Events", "Issues"], href: "/campaign", icon: AppstoreOutlined },
  { id: "event-types", labels: ["कार्यक्षेत्र", "Event types"], href: "/event-types", icon: AppstoreOutlined },
  { id: "intro", labels: ["परिचय", "Intro"], href: "/intro", icon: FileTextOutlined },
  { id: "learn", labels: ["सिकौँ", "Learn", "Docs"], href: "/learn", icon: FileTextOutlined },
  { id: "join", labels: ["जोडिने", "Join"], href: "/join", icon: TeamOutlined },
  { id: "feedback", labels: ["प्रतिक्रिया", "Feedback"], href: "/feedback", icon: FileTextOutlined },
  { id: "settings", labels: ["सेटिङ्स", "Settings"], href: "/settings", icon: AppstoreOutlined },
  { id: "leaderboard", labels: ["लीडरबोर्ड", "Leaderboard"], href: "/leaderboard", icon: TrophyOutlined },
  { id: "impact", labels: ["प्रभाव", "Impact"], href: "/impact", icon: TrophyOutlined },
  { id: "calendar", labels: ["पात्रो", "Calendar"], href: "/calendar", icon: CalendarOutlined },
  { id: "me", labels: ["मेरो प्रोफाइल", "My profile", "Me"], href: "/me/preview", icon: UserOutlined },
  { id: "signup", labels: ["सदस्यता", "Signup", "OTP"], href: "/signup", icon: UserOutlined },
  { id: "login", labels: ["लगइन", "Login"], href: "/login", icon: UserOutlined }
];

const COPY = {
  np: {
    open: "खोज",
    placeholder: "पृष्ठ, अभियान वा कार्यक्षेत्र खोज्नुहोस्…",
    empty: "केही भेटिएन।",
    hintRoute: "रुट",
    hintEvent: "अभियान",
    hintCategory: "कार्यक्षेत्र"
  },
  en: {
    open: "Search",
    placeholder: "Search pages, events, or categories…",
    empty: "Nothing matched.",
    hintRoute: "Route",
    hintEvent: "Event",
    hintCategory: "Category"
  }
};

function normalize(s) {
  return String(s || "").toLowerCase().trim();
}

export function CommandPalette({ language = "np" }) {
  const t = COPY[language] || COPY.np;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);

  // Compile dataset. Events come from the API; routes are static.
  const [eventBuckets, setEventBuckets] = useState({ active: [], scheduled: [], completed: [] });
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listAllEvents({ language });
        if (!cancelled) setEventBuckets(data);
      } catch {
        if (!cancelled) setEventBuckets({ live: [], upcoming: [], past: [] });
      }
    })();
    return () => { cancelled = true; };
  }, [language]);

  const dataset = useMemo(() => {
    const events = [...eventBuckets.active, ...eventBuckets.scheduled, ...eventBuckets.completed];
    const eventRows = events.map((e) => ({
      id: `event-${e.id}`,
      label: e.title,
      sublabel: e.addressText,
      href: `/events/${e.slug ?? e.id}`,
      icon: AppstoreOutlined,
      kindLabel: t.hintEvent,
      searchable: `${e.title || ""} ${e.addressText || ""}`
    }));
    const routeRows = STATIC_ROUTES.map((r) => ({
      id: r.id,
      label: r.labels[0],
      sublabel: r.labels.slice(1).join(" • ") || null,
      href: r.href,
      icon: r.icon,
      kindLabel: t.hintRoute,
      searchable: r.labels.join(" ")
    }));
    return [...routeRows, ...eventRows];
  }, [t.hintRoute, t.hintEvent, eventBuckets]);

  // Keyboard: cmd/ctrl+K toggles.
  useEffect(() => {
    const onKey = (e) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const trigger = (isMac && e.metaKey && e.key.toLowerCase() === "k") ||
        (!isMac && e.ctrlKey && e.key.toLowerCase() === "k");
      if (trigger) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Focus input on open.
  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => inputRef.current?.focus?.(), 60);
      return () => window.clearTimeout(id);
    }
    setQuery("");
    setActiveIdx(0);
    return undefined;
  }, [open]);

  const q = normalize(query);
  const results = useMemo(() => {
    if (!q) return dataset.slice(0, 14);
    return dataset
      .filter((row) => normalize(row.searchable).includes(q))
      .slice(0, 14);
  }, [q, dataset]);

  useEffect(() => {
    setActiveIdx(0);
  }, [q]);

  const close = () => setOpen(false);
  const go = (href) => {
    if (!href) return;
    router.push(href);
    close();
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const row = results[activeIdx];
      if (row) go(row.href);
    }
  };

  return (
    <>
      <button
        type="button"
        className="command-trigger"
        aria-label={t.open}
        title={t.open + " (Ctrl+K)"}
        onClick={() => setOpen(true)}
      >
        <SearchOutlined />
      </button>
      {open ? (
        <div
          className="command-palette-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={t.open}
          onClick={close}
        >
          <div
            className="command-palette"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="command-palette-input">
              <SearchOutlined aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={t.placeholder}
                autoComplete="off"
              />
              <kbd>Esc</kbd>
            </header>
            {results.length === 0 ? (
              <p className="command-palette-empty">{t.empty}</p>
            ) : (
              <ul className="command-palette-list" role="listbox">
                {results.map((row, i) => {
                  const Icon = row.icon || SearchOutlined;
                  const active = i === activeIdx;
                  return (
                    <li
                      key={row.id}
                      className={`command-palette-row${active ? " is-active" : ""}`}
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => setActiveIdx(i)}
                      onClick={() => go(row.href)}
                    >
                      <Icon aria-hidden="true" />
                      <span className="command-palette-row-text">
                        <strong>{row.label}</strong>
                        {row.sublabel ? <span>{row.sublabel}</span> : null}
                      </span>
                      <span className="command-palette-row-kind">{row.kindLabel}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
