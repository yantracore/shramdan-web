"use client";

// 5-slot bottom nav that appears only at <=720px viewports. Replaces
// the hamburger menu as the primary mobile navigation surface — apps
// generally feel more native with a thumb-reachable tab bar than a
// top-right hamburger. The tabs map to the highest-frequency citizen
// actions: home, issues, events, my profile preview, more.
//
// The "more" tab opens the existing <details> hamburger menu by
// dispatching a custom event that SiteShell listens for.

import {
  AppstoreOutlined,
  EllipsisOutlined,
  FlagOutlined,
  HomeOutlined,
  UserOutlined
} from "@ant-design/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

const COPY = {
  np: {
    home: "घर",
    issues: "समस्या",
    events: "अभियान",
    me: "मेरो",
    more: "थप"
  },
  en: {
    home: "Home",
    issues: "Issues",
    events: "Events",
    me: "Me",
    more: "More"
  }
};

const TABS = [
  { id: "home", href: "/", icon: HomeOutlined, match: (p) => p === "/" },
  { id: "issues", href: "/issues", icon: FlagOutlined, match: (p) => p?.startsWith("/issues") },
  { id: "events", href: "/events", icon: AppstoreOutlined, match: (p) => p?.startsWith("/events") },
  { id: "me", href: "/me/preview", icon: UserOutlined, match: (p) => p?.startsWith("/me") }
];

export function MobileBottomNav({ language = "np", onMore }) {
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
          >
            <Icon aria-hidden="true" />
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
