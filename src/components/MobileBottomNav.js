"use client";

// Primary navigation for every viewport below the pill breakpoint (<=1024px):
// phones AND tablets. Replaces the top hamburger — apps feel more native with a
// thumb-reachable tab bar. On a phone it stays a tight 5-slot bar; on a wider
// tablet the `wide` tabs reveal so the stretched bar fills with useful actions
// instead of huge gaps. The "More" button opens SiteShell's bottom sheet with
// the full secondary nav + preferences + auth.

import {
  AppstoreOutlined,
  BellOutlined,
  EllipsisOutlined,
  HeartOutlined,
  HomeOutlined,
  PlusOutlined,
  UserOutlined
} from "@ant-design/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNotifications } from "@/components/NotificationsProvider";

const COPY = {
  np: {
    home: "घर",
    campaign: "अभियान",
    report: "नयाँ",
    notifications: "सूचना",
    contribute: "सहयोग",
    me: "मेरो",
    more: "थप"
  },
  en: {
    home: "Home",
    campaign: "Campaign",
    report: "New",
    notifications: "Alerts",
    contribute: "Join",
    me: "Me",
    more: "More"
  }
};

// `wide: true` tabs only appear from ~640px up (see .mobile-bottom-nav-tab--wide
// in home.css), so a phone keeps a 5-slot bar and a tablet fills its width.
const TABS = [
  { id: "home", href: "/", icon: HomeOutlined, match: (p) => p === "/" },
  {
    id: "campaign",
    href: "/campaigns",
    icon: AppstoreOutlined,
    match: (p) =>
      p?.startsWith("/campaign") || p?.startsWith("/events") || p?.startsWith("/issues")
  },
  {
    id: "report",
    href: "/issues/new",
    icon: PlusOutlined,
    wide: true,
    match: (p) => p === "/issues/new"
  },
  {
    id: "notifications",
    href: "/me/notifications",
    icon: BellOutlined,
    match: (p) => p?.startsWith("/me/notifications")
  },
  {
    id: "contribute",
    href: "/contribute",
    icon: HeartOutlined,
    wide: true,
    match: (p) => p?.startsWith("/contribute") || p === "/join"
  },
  {
    id: "me",
    href: "/me/preview",
    icon: UserOutlined,
    // /me/notifications has its own tab, so keep the profile tab from also
    // lighting up on that path.
    match: (p) => p?.startsWith("/me") && !p?.startsWith("/me/notifications")
  }
];

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
function localizeCount(value, language) {
  const capped = value > 99 ? "99+" : String(value);
  if (language !== "np") return capped;
  return capped.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

function hasNavCount(value) {
  return value !== null && value !== undefined && value !== "";
}

export function MobileBottomNav({ language = "np", counts = {}, onMore }) {
  const t = COPY[language] || COPY.np;
  const pathname = usePathname();
  const { unreadCount = 0 } = useNotifications();

  const badgeFor = (id) => {
    if (id === "campaign") return counts.campaign ?? null;
    if (id === "notifications") {
      return unreadCount > 0 ? localizeCount(unreadCount, language) : null;
    }
    return null;
  };

  return (
    <nav
      className="mobile-bottom-nav"
      aria-label={language === "np" ? "तल नेभिगेसन" : "Bottom navigation"}
    >
      {TABS.map(({ id, href, icon: Icon, match, wide }) => {
        const active = match(pathname);
        const badge = badgeFor(id);
        return (
          <Link
            key={id}
            href={href}
            className={`mobile-bottom-nav-tab${active ? " is-active" : ""}${
              wide ? " mobile-bottom-nav-tab--wide" : ""
            }`}
            aria-current={active ? "page" : undefined}
            onClick={(event) => {
              if (pathname === href && typeof window !== "undefined" && window.scrollY > 0) {
                event.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          >
            <Icon aria-hidden="true" />
            {hasNavCount(badge) ? (
              <span
                className={`nav-count-badge nav-count-badge--${id} mobile-bottom-nav-count`}
                aria-label={`${t[id]}: ${badge}`}
              >
                {badge}
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
