"use client";

// 4-slot bottom nav that appears only at <=720px viewports. Replaces
// the hamburger menu as the primary mobile navigation surface — apps
// generally feel more native with a thumb-reachable tab bar than a
// top-right hamburger. The tabs map to the highest-frequency citizen
// actions: home, campaign (unified issues+events), my profile preview, more.
//
// The "more" tab opens the existing <details> hamburger menu by
// dispatching a custom event that SiteShell listens for.

import {
  AppstoreOutlined,
  EllipsisOutlined,
  HomeOutlined,
  UserOutlined
} from "@ant-design/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

const COPY = {
  np: {
    home: "घर",
    campaign: "अभियान",
    me: "मेरो",
    more: "थप"
  },
  en: {
    home: "Home",
    campaign: "Campaign",
    me: "Me",
    more: "More"
  }
};

// Issues + events are one entity now ("campaign"), so the two old tabs collapse
// into one. The match also catches the legacy /issues and /events paths so the
// tab still highlights during a redirect-in-flight.
const TABS = [
  { id: "home", href: "/", icon: HomeOutlined, match: (p) => p === "/" },
  {
    id: "campaign",
    href: "/campaigns",
    icon: AppstoreOutlined,
    match: (p) =>
      p?.startsWith("/campaign") || p?.startsWith("/events") || p?.startsWith("/issues")
  },
  { id: "me", href: "/me/preview", icon: UserOutlined, match: (p) => p?.startsWith("/me") }
];

function hasNavCount(value) {
  return value !== null && value !== undefined && value !== "";
}

export function MobileBottomNav({ language = "np", counts = {}, onMore }) {
  const t = COPY[language] || COPY.np;
  const pathname = usePathname();

  return (
    <nav className="mobile-bottom-nav" aria-label={language === "np" ? "तल नेभिगेसन" : "Bottom navigation"}>
      {TABS.map(({ id, href, icon: Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={id}
            href={href}
            className={`mobile-bottom-nav-tab${active ? " is-active" : ""}`}
            aria-current={active ? "page" : undefined}
            onClick={(event) => {
              if (pathname === href && typeof window !== "undefined" && window.scrollY > 0) {
                event.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          >
            <Icon aria-hidden="true" />
            {hasNavCount(counts[id]) ? (
              <span
                className={`nav-count-badge nav-count-badge--${id} mobile-bottom-nav-count`}
                aria-label={`${t[id]}: ${counts[id]}`}
              >
                {counts[id]}
              </span>
            ) : null}
            <span>{t[id]}</span>
          </Link>
        );
      })}
      <button
        type="button"
        className="mobile-bottom-nav-tab"
        onClick={onMore}
        aria-label={t.more}
      >
        <EllipsisOutlined aria-hidden="true" />
        <span>{t.more}</span>
      </button>
    </nav>
  );
}
