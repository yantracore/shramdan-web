"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  AppstoreOutlined,
  BellOutlined,
  BookOutlined,
  ControlOutlined,
  FolderOpenOutlined,
  HeartOutlined,
  LogoutOutlined,
  MenuOutlined,
  MoonOutlined,
  ReadOutlined,
  SettingOutlined,
  SolutionOutlined,
  SunOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  TranslationOutlined,
  UserAddOutlined,
  UserOutlined
} from "@ant-design/icons";
import { Avatar, Button, Dropdown, Popover, Tag, Tooltip } from "antd";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FaFacebookF, FaTiktok, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { AppsStartMenu } from "@/components/AppsStartMenu";
import { BackToTop } from "@/components/BackToTop";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { NotificationsBell } from "@/components/NotificationsBell";
import { OnboardingSpotlight } from "@/components/OnboardingSpotlight";
import { usePreferences } from "@/app/providers";
import { copy, footerQuotes, getDailyQuoteIndex } from "@/lib/siteContent";
import { getAuthSession, isAdminUser, subscribeAuthSession } from "@/lib/authSession";
import { logoutAndClearSession } from "@/lib/apiClient";
import { buildLoginHref } from "@/lib/loginRedirect";
import { getCachedPublicCounts, getFallbackPublicCounts } from "@/lib/publicStats";

const PILL_INTRO_SESSION_KEY = "shramdan.pill.intro.v1";
const PILL_MIN_WIDTH_PX = 1180;
const BOTTOM_RIGHT_PANEL_SHOW_AFTER = 100;
// Footer "quote for today" band — hidden for now. Flip to true to re-enable.
const FOOTER_QUOTE_ENABLED = false;
const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function getInitials(user) {
  const source = user?.name || user?.username || user?.email || "";
  const cleaned = source.trim();

  if (!cleaned) {
    return "";
  }

  const parts = cleaned.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (digit) => NP_DIGITS[Number(digit)]);
}

function formatNavCount(value, language) {
  if (!Number.isFinite(Number(value))) return "";
  const formatted = Number(value).toLocaleString("en-US");
  return localizeDigits(formatted, language);
}

function hasNavCount(value) {
  return value !== null && value !== undefined && value !== "";
}

const socialIcons = {
  facebook: FaFacebookF,
  twitter: FaXTwitter,
  tiktok: FaTiktok,
  youtube: FaYoutube
};

export function SiteShell({ children, pageTitle, chromeMode = "full" }) {
  const { language, mode, toggleLanguage, toggleMode } = usePreferences();
  const [isPillEntering, setIsPillEntering] = useState(false);
  const [isPillTucked, setIsPillTucked] = useState(false);
  const [isBottomRightPanelVisible, setIsBottomRightPanelVisible] = useState(false);
  const [publicCounts, setPublicCounts] = useState(null);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const mobileMenuRef = useRef(null);
  const lastScrollYRef = useRef(0);

  const closeMobileMenu = () => {
    if (mobileMenuRef.current) {
      mobileMenuRef.current.open = false;
    }
  };

  useEffect(() => {
    closeMobileMenu();
  }, [pathname]);

  // Pick the day's footer quote on the client so the date is computed in the
  // visitor's timezone (avoids an SSR/CSR hydration mismatch). SSR renders
  // index 0 — today's featured session quote — so there is no flicker today.
  useEffect(() => {
    setQuoteIndex(getDailyQuoteIndex());
  }, []);

  useEffect(() => {
    let cancelled = false;
    getFallbackPublicCounts()
      .then((counts) => {
        if (!cancelled && counts) {
          setPublicCounts((current) => current ?? counts);
        }
      })
      .catch(() => {});

    getCachedPublicCounts()
      .then((counts) => {
        if (!cancelled) {
          setPublicCounts(counts);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPublicCounts(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const syncFloatingChrome = () => {
      const currentY = window.scrollY;
      const scrollingDown = currentY > lastScrollYRef.current + 8;
      const scrollingUp = currentY < lastScrollYRef.current - 8;

      setIsBottomRightPanelVisible(currentY > BOTTOM_RIGHT_PANEL_SHOW_AFTER);
      if (currentY < 80) {
        setIsPillTucked(false);
      } else if (scrollingDown) {
        setIsPillTucked(true);
      } else if (scrollingUp) {
        setIsPillTucked(false);
      }
      lastScrollYRef.current = currentY;
    };

    syncFloatingChrome();
    window.addEventListener("scroll", syncFloatingChrome, { passive: true });
    return () => window.removeEventListener("scroll", syncFloatingChrome);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event) => {
      const node = mobileMenuRef.current;
      if (!node || !node.open) {
        return;
      }
      if (!node.contains(event.target)) {
        node.open = false;
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const session = useSyncExternalStore(subscribeAuthSession, getAuthSession, () => null);
  const t = copy[language];
  const footerQuote = footerQuotes[quoteIndex] ?? footerQuotes[0];
  const footerQuotePrimary = language === "en" ? footerQuote.en : footerQuote.ne;
  const footerQuoteSecondary = language === "en" ? footerQuote.ne : footerQuote.en;
  const titles = t.pageTitles;
  const documentTitle = pageTitle
    ? `${pageTitle} · ${titles.brandSuffix}`
    : `${titles.brandSuffix} · ${titles.home}`;

  useEffect(() => {
    document.title = documentTitle;
  }, [documentTitle]);

  const activePath = pathname === "/" ? "/" : `/${pathname.split("/").filter(Boolean)[0]}`;
  const isAuthenticated = Boolean(session?.user);
  const isAdmin = isAuthenticated && isAdminUser(session.user);

  // Pill nav (>= 1180px): pure navigation, no auth. Login + Join live in the
  // TR user-icon popover. Events and issues carry public count badges across
  // desktop and mobile nav.
  const pillNavItems = [
    { href: "/", label: t.nav.home },
    {
      href: "/events",
      label: t.nav.events,
      count: formatNavCount(publicCounts?.events, language),
      countTone: "events"
    },
    {
      href: "/issues",
      label: t.nav.issues,
      count: formatNavCount(publicCounts?.issues, language),
      countTone: "issues"
    },
    { href: "/feedback", label: t.nav.feedback },
    { href: "/contribute", label: t.nav.contribute },
    {
      href: "/app-development",
      label: t.nav.appDev,
      highlight: true,
      badge: "LIVE",
      separatorBefore: true,
      tooltip: t.nav.appDevTooltip
    }
  ];

  // Bottom-left "apps grid" dropdown — secondary nav for places that don't
  // belong on the top pill (event types, intro, learn, resources, settings,
  // admin). Resources surfaced here per the 2026-06-05 pivot — its content
  // moved off the homepage.
  const appsGridItems = [
    { href: "/event-types", label: t.nav.eventTypes, icon: <TeamOutlined /> },
    { href: "/resources", label: t.nav.resources, icon: <FolderOpenOutlined /> },
    { href: "/learn", label: t.nav.learn, icon: <BookOutlined /> },
    { href: "/settings", label: t.nav.settings, icon: <SettingOutlined /> },
    ...(isAdmin
      ? [{ href: "/admin", label: t.me.menu.adminCenter, icon: <ControlOutlined /> }]
      : [])
  ];

  // Mobile drawer surfaces everything reachable from the corners — pill nav,
  // apps grid, and auth — in a single linear list.
  const mobileMenuItems = [
    ...pillNavItems,
    isAuthenticated
      ? { href: "/me", label: t.me.navLabel }
      : { href: buildLoginHref(pathname), label: t.nav.login },
    ...(isAuthenticated ? [] : [{ href: "/join", label: t.nav.join }]),
    ...appsGridItems
  ];

  const handleLogout = async () => {
    await logoutAndClearSession();
    router.replace("/login");
  };

  const smoothScrollToTop = () => {
    if (typeof window === "undefined" || window.scrollY <= 0) {
      return false;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    return true;
  };

  const handleBrandClick = (event) => {
    if (pathname === "/" && smoothScrollToTop()) {
      event.preventDefault();
    }
  };

  const handleSamePageNavClick = (event, href) => {
    if (pathname === href && smoothScrollToTop()) {
      event.preventDefault();
    }
  };

  const authedUserMenu = isAuthenticated
    ? {
        items: [
          {
            key: "identity",
            disabled: true,
            label: (
              <div className="toolbar-user-menu-profile">
                <strong>{session.user.name || session.user.username || session.user.email}</strong>
                <span>{session.user.email}</span>
                {isAdmin ? <Tag color="green">{session.user.role}</Tag> : null}
              </div>
            )
          },
          { type: "divider" },
          ...(isAdmin
            ? [
                {
                  key: "admin-center",
                  icon: <AppstoreOutlined />,
                  label: t.me.menu.adminCenter,
                  onClick: () => router.push("/admin")
                },
                { type: "divider" }
              ]
            : []),
          {
            key: "profile",
            icon: <UserOutlined />,
            label: t.me.menu.myProfile,
            onClick: () => router.push("/me")
          },
          {
            key: "applications",
            icon: <SolutionOutlined />,
            label: t.me.menu.applications,
            onClick: () => router.push("/me/applications")
          },
          {
            key: "saved",
            icon: <HeartOutlined />,
            label: t.me.menu.saved,
            onClick: () => router.push("/me/saved")
          },
          {
            key: "notifications",
            icon: <BellOutlined />,
            label: t.me.menu.notifications,
            onClick: () => router.push("/me/notifications")
          },
          { type: "divider" },
          {
            key: "logout",
            icon: <LogoutOutlined />,
            label: t.me.menu.logout,
            onClick: handleLogout
          }
        ]
      }
    : null;

  const guestPopoverContent = (
    <div className="guest-user-popover">
      <div className="guest-user-popover__header">
        <span className="guest-user-popover__avatar" aria-hidden="true">
          <UserOutlined />
        </span>
        <div className="guest-user-popover__identity">
          <strong>{t.guestPopover.title}</strong>
          <span>{t.guestPopover.subtitle}</span>
        </div>
      </div>
      <p className="guest-user-popover__body">{t.guestPopover.body}</p>
      <div className="guest-user-popover__actions">
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={() => router.push("/join")}
          block
        >
          {t.guestPopover.join}
        </Button>
        <Button
          icon={<UserOutlined />}
          onClick={() => router.push(buildLoginHref(pathname))}
          block
        >
          {t.guestPopover.login}
        </Button>
      </div>
    </div>
  );



  const handleAppsTileSelect = (event, item) => {
    if (pathname === item.href && smoothScrollToTop()) {
      event.preventDefault();
    }
  };

  const pagesLinks = [
    { href: "/", label: t.nav.home },
    { href: "/events", label: t.nav.events },
    { href: "/event-types", label: t.nav.eventTypes }
  ];
  const learnLinks = [
    { href: "/event-types", label: t.nav.eventTypes },
    { href: "/learn", label: t.footer.links.documents }
  ];
  const footerLinks = [
    {
      title: t.footer.columns.pages,
      links: pagesLinks
    },
    {
      title: t.footer.columns.learn,
      links: learnLinks
    },
    {
      title: t.footer.columns.getInvolved,
      links: [
        { href: "/join", label: t.footer.links.contributor },
        { href: "/feedback", label: t.footer.links.feedback }
      ]
    },
    {
      title: t.footer.columns.legal,
      links: [
        { href: "/terms", label: t.footer.links.terms },
        { href: "/privacy", label: t.footer.links.privacy },
        { href: "/code-of-conduct", label: t.footer.links.codeOfConduct }
      ]
    }
  ];

  // Pill nav entrance — runs once per browser session, only when the
  // viewport actually shows the pill (>= PILL_MIN_WIDTH_PX) and the user
  // has not opted out of motion. sessionStorage flag persists for the rest
  // of the tab session; opening a new tab plays the cinematic again.
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (sessionStorage.getItem(PILL_INTRO_SESSION_KEY)) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pillVisible = window.matchMedia(`(min-width: ${PILL_MIN_WIDTH_PX}px)`).matches;

    if (reducedMotion || !pillVisible) {
      sessionStorage.setItem(PILL_INTRO_SESSION_KEY, "1");
      return undefined;
    }

    // Defer the entrance flip into the next frame so React's effect rule
    // (`react-hooks/set-state-in-effect`) is satisfied — we synchronize
    // with the browser paint, not with the effect body.
    const raf = window.requestAnimationFrame(() => {
      setIsPillEntering(true);
    });
    const id = window.setTimeout(() => {
      setIsPillEntering(false);
      sessionStorage.setItem(PILL_INTRO_SESSION_KEY, "1");
    }, 600);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(id);
    };
  }, []);

  return (
    <main className="site-shell" data-chrome-mode={chromeMode}>
      <a className="skip-to-main" href="#main-content">
        {t.ariaLabels.skipToMain}
      </a>

      {chromeMode !== "none" ? (
        <header className="site-shell-banner" role="banner" aria-label={t.ariaLabels.nav}>
          <div className="site-shell-corner site-shell-corner--top-left">
            <div className="site-shell-corner__inner">
              <Link
                className="brand"
                href="/"
                aria-label={t.ariaLabels.home}
                onClick={handleBrandClick}
              >
                <span className="brand-mark">
                  <Image alt="" height={96} priority src="/images/logo.png" width={96} />
                </span>
                <span className="brand-name">{t.brand}</span>
              </Link>
            </div>
          </div>

          {chromeMode === "full" ? (
            <nav
              className={`site-shell-pill${isPillEntering ? " is-entering" : ""}${
                isPillTucked ? " is-tucked" : ""
              }`}
              aria-label={t.ariaLabels.nav}
            >
              {pillNavItems.map((item) => {
                const isActive = activePath === item.href;
                const classes = [
                  isActive ? "is-active" : "",
                  item.highlight ? "is-highlight" : "",
                  item.separatorBefore ? "has-separator" : ""
                ]
                  .filter(Boolean)
                  .join(" ");
                const link = (
                  <Link
                    key={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={classes || undefined}
                    href={item.href}
                    onClick={(event) => handleSamePageNavClick(event, item.href)}
                  >
                    <span className="site-shell-pill__label">
                      <ThunderboltOutlined
                        aria-hidden="true"
                        className="site-shell-pill__icon"
                        style={{ display: item.highlight ? "inline-flex" : "none" }}
                      />
                      <span>{item.label}</span>
                      {hasNavCount(item.count) ? (
                        <span
                          className={`nav-count-badge nav-count-badge--${item.countTone} site-shell-pill__count`}
                          aria-label={`${item.label}: ${item.count}`}
                        >
                          {item.count}
                        </span>
                      ) : null}
                    </span>
                    {item.badge ? (
                      <span className="site-shell-pill__badge" aria-hidden="true">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
                if (item.tooltip) {
                  return (
                    <Tooltip key={item.href} title={item.tooltip} placement="bottom">
                      {link}
                    </Tooltip>
                  );
                }
                return link;
              })}
            </nav>
          ) : null}

          <div className="site-shell-corner site-shell-corner--top-right">
            <div className="site-shell-corner__inner">
              <div className="quick-settings-row">
                <div className="preference-controls">
                  <Tooltip title={t.controls.languageTooltip}>
                    <button
                      type="button"
                      className="quick-settings-button"
                      aria-label={t.controls.languageTooltip}
                      onClick={toggleLanguage}
                    >
                      <TranslationOutlined />
                    </button>
                  </Tooltip>
                  <Tooltip title={t.controls.themeTooltip}>
                    <button
                      type="button"
                      className="quick-settings-button"
                      aria-label={t.controls.themeTooltip}
                      onClick={toggleMode}
                    >
                      {mode === "light" ? <MoonOutlined /> : <SunOutlined />}
                    </button>
                  </Tooltip>
                  {isAuthenticated ? <NotificationsBell language={language} /> : null}
                </div>
                {isAuthenticated ? (
                  <Dropdown
                    menu={authedUserMenu}
                    placement="bottomRight"
                    trigger={["click"]}
                    overlayClassName="site-corner-menu site-corner-menu--from-right"
                  >
                    <button
                      type="button"
                      className="toolbar-avatar"
                      aria-label={t.ariaLabels.userMenu}
                      title={t.ariaLabels.userMenu}
                    >
                      <Avatar
                        src={session.user.avatar || undefined}
                        icon={<UserOutlined />}
                        size={38}
                      >
                        {getInitials(session.user)}
                      </Avatar>
                    </button>
                  </Dropdown>
                ) : (
                  <Popover
                    content={guestPopoverContent}
                    trigger="click"
                    placement="bottomRight"
                    arrow={false}
                    overlayClassName="guest-user-popover-overlay site-corner-menu site-corner-menu--from-right"
                  >
                    <button
                      type="button"
                      className="user-icon-trigger"
                      aria-label={t.ariaLabels.userMenu}
                      title={t.ariaLabels.userMenu}
                    >
                      <UserOutlined />
                    </button>
                  </Popover>
                )}
                <details className="mobile-menu" ref={mobileMenuRef}>
                  <summary aria-label={t.ariaLabels.openMenu}>
                    <MenuOutlined />
                  </summary>
                  <div className="mobile-menu-panel">
                    {mobileMenuItems.map((item) => {
                      const isActive = activePath === item.href;
                      return (
                        <Link
                          aria-current={isActive ? "page" : undefined}
                          className={isActive ? "is-active" : undefined}
                          href={item.href}
                          key={item.href}
                          onClick={(event) => {
                            handleSamePageNavClick(event, item.href);
                            closeMobileMenu();
                          }}
                        >
                          <span className="mobile-menu-link-label">{item.label}</span>
                          {hasNavCount(item.count) ? (
                            <span
                              className={`nav-count-badge nav-count-badge--${item.countTone} mobile-menu-count`}
                              aria-label={`${item.label}: ${item.count}`}
                            >
                              {item.count}
                            </span>
                          ) : null}
                        </Link>
                      );
                    })}
                    <div
                      className="mobile-menu-preferences"
                      aria-label={t.ariaLabels.preferences}
                    >
                      <button
                        type="button"
                        aria-label={t.controls.themeTooltip}
                        title={t.controls.themeTooltip}
                        onClick={() => {
                          toggleMode();
                          closeMobileMenu();
                        }}
                      >
                        {mode === "light" ? t.controls.darkTheme : t.controls.lightTheme}
                      </button>
                      <button
                        type="button"
                        aria-label={t.controls.languageTooltip}
                        title={t.controls.languageTooltip}
                        onClick={() => {
                          toggleLanguage();
                          closeMobileMenu();
                        }}
                      >
                        {t.controls.language}
                      </button>
                      {isAuthenticated ? (
                        <button
                          type="button"
                          onClick={() => {
                            closeMobileMenu();
                            handleLogout();
                          }}
                        >
                          {t.me.menu.logout}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>

          {chromeMode === "full" ? (
            <div className="site-shell-corner site-shell-corner--bottom-left">
              <AppsStartMenu
                items={appsGridItems}
                language={language}
                onItemSelect={handleAppsTileSelect}
              />
            </div>
          ) : null}

          <div
            className={`site-shell-corner site-shell-corner--bottom-right${
              isBottomRightPanelVisible ? " is-visible" : ""
            }`}
          >
            <div className="site-shell-corner__inner">
              <BackToTop
                language={language}
                variant="inline"
                visible={isBottomRightPanelVisible}
              />
            </div>
          </div>
        </header>
      ) : null}

      <div id="main-content" tabIndex={-1}>
        <div key={pathname} className="page-transition">
          {children}
        </div>
      </div>

      <KeyboardShortcutsDialog language={language} />
      <OnboardingSpotlight language={language} />
      <MobileBottomNav
        language={language}
        counts={{
          events: formatNavCount(publicCounts?.events, language),
          issues: formatNavCount(publicCounts?.issues, language)
        }}
        onMore={() => {
          if (mobileMenuRef.current) {
            mobileMenuRef.current.open = !mobileMenuRef.current.open;
          }
        }}
      />

      {FOOTER_QUOTE_ENABLED && (
        <section className="footer-quote" aria-label={t.footer.quote.ariaLabel}>
          <div className="footer-quote-inner">
            <span className="footer-quote-kicker">{t.footer.quote.kicker}</span>
            <blockquote className="footer-quote-text">
              <p className="footer-quote-primary" lang={language === "en" ? "en" : "ne"}>
                {footerQuotePrimary}
              </p>
              <p className="footer-quote-secondary" lang={language === "en" ? "ne" : "en"}>
                {footerQuoteSecondary}
              </p>
            </blockquote>
          </div>
        </section>
      )}

      <footer className="footer" aria-label={t.footer.ariaLabel}>
        <div className="footer-brand">
          <Link
            className="footer-logo"
            href="/"
            aria-label={t.ariaLabels.home}
            onClick={handleBrandClick}
          >
            <span className="brand-mark footer-brand-mark">
              <Image alt="" height={96} src="/images/logo.png" width={96} />
            </span>
            <span>{t.footer.brand}</span>
          </Link>
          <p>{t.footer.intro}</p>
          <strong>{t.footer.note}</strong>
        </div>

        <div className="footer-columns">
          {footerLinks.map((column) => (
            <nav className="footer-column" aria-label={column.title} key={column.title}>
              <h2>{column.title}</h2>
              {column.links.map((link) => (
                <Link href={link.href} key={link.href}>
                  {link.label}
                </Link>
              ))}
            </nav>
          ))}

          <div className="footer-column footer-social-column">
            <h2>{t.footer.columns.social}</h2>
            <div className="social-links">
              {t.footer.social.map((item) => {
                const Icon = socialIcons[item.id];
                const isPlaceholder = item.href === "#";

                return (
                  <a
                    aria-label={item.label}
                    className="social-link"
                    href={item.href}
                    key={item.id}
                    rel={isPlaceholder ? undefined : "noreferrer"}
                    target={isPlaceholder ? undefined : "_blank"}
                  >
                    <Icon aria-hidden="true" focusable="false" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
