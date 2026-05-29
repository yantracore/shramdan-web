"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  AppstoreOutlined,
  LogoutOutlined,
  MenuOutlined,
  MoonOutlined,
  SunOutlined,
  TranslationOutlined,
  UserAddOutlined,
  UserOutlined
} from "@ant-design/icons";
import { Avatar, Button, Dropdown, Tag, Tooltip } from "antd";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FaFacebookF, FaTiktok, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { usePreferences } from "@/app/providers";
import { copy } from "@/lib/siteContent";
import { getAuthSession, isAdminUser, subscribeAuthSession } from "@/lib/authSession";
import { logoutAndClearSession } from "@/lib/apiClient";

function getInitials(user) {
  const source = user?.name || user?.username || user?.email || "";
  const cleaned = source.trim();

  if (!cleaned) {
    return "";
  }

  const parts = cleaned.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

const socialIcons = {
  facebook: FaFacebookF,
  twitter: FaXTwitter,
  tiktok: FaTiktok,
  youtube: FaYoutube
};

export function SiteShell({ children, pageTitle }) {
  const { language, mode, toggleLanguage, toggleMode } = usePreferences();
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const mobileMenuRef = useRef(null);

  const closeMobileMenu = () => {
    if (mobileMenuRef.current) {
      mobileMenuRef.current.open = false;
    }
  };

  useEffect(() => {
    closeMobileMenu();
  }, [pathname]);

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
  const navItems = [
    { href: "/", label: t.nav.home },
    { href: "/issues", label: t.nav.issues },
    { href: "/join", label: t.nav.join },
    { href: "/feedback", label: t.nav.feedback },
    isAuthenticated
      ? { href: "/me", label: t.me.navLabel }
      : { href: "/login", label: t.nav.login }
  ];

  const handleLogout = async () => {
    await logoutAndClearSession();
    router.replace("/login");
  };

  const handleBrandClick = (event) => {
    if (pathname === "/" && typeof window !== "undefined" && window.scrollY > 0) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const userMenu = isAuthenticated
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
                }
              ]
            : []),
          {
            key: "profile",
            icon: <UserOutlined />,
            label: t.me.menu.myProfile,
            onClick: () => router.push("/me")
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
  const footerLinks = [
    {
      title: t.footer.columns.quickLinks,
      links: navItems
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

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateHeader = () => {
      const currentScrollY = window.scrollY;
      const isNearTop = currentScrollY < 24;
      const isScrollingUp = currentScrollY < lastScrollY;

      setIsHeaderVisible(isNearTop || isScrollingUp);
      lastScrollY = Math.max(currentScrollY, 0);
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <main className="site-shell">
      <header
        className={`topbar${isHeaderVisible ? "" : " topbar-hidden"}`}
        aria-label={t.ariaLabels.nav}
      >
        <Link className="brand" href="/" aria-label={t.ariaLabels.home} onClick={handleBrandClick}>
          <span className="brand-mark">
            <Image alt="" height={96} priority src="/images/logo.png" width={96} />
          </span>
          <span>{t.footer.brand}</span>
        </Link>

        <nav className="nav-links" aria-label={t.ariaLabels.nav}>
          {navItems.map((item) => {
            const isActive = activePath === item.href;

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={isActive ? "is-active" : undefined}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="toolbar" aria-label={t.ariaLabels.preferences}>
          <div className="preference-controls">
            <Tooltip title={t.controls.themeTooltip}>
              <Button
                aria-label={t.controls.themeTooltip}
                icon={mode === "light" ? <SunOutlined /> : <MoonOutlined />}
                onClick={toggleMode}
              />
            </Tooltip>
            <Tooltip title={t.controls.languageTooltip}>
              <Button
                aria-label={t.controls.languageTooltip}
                icon={<TranslationOutlined />}
                onClick={toggleLanguage}
              >
                {t.controls.language}
              </Button>
            </Tooltip>
          </div>
          {isAuthenticated ? (
            <Dropdown menu={userMenu} placement="bottomRight" trigger={["click"]}>
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
            <Button className="toolbar-cta" type="primary" href="/join" icon={<UserAddOutlined />}>
              {t.nav.join}
            </Button>
          )}
        </div>

        <details className="mobile-menu" ref={mobileMenuRef}>
          <summary aria-label={t.ariaLabels.openMenu}>
            <MenuOutlined />
          </summary>
          <div className="mobile-menu-panel">
            {navItems.map((item) => {
              const isActive = activePath === item.href;

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={isActive ? "is-active" : undefined}
                  href={item.href}
                  key={item.href}
                  onClick={closeMobileMenu}
                >
                  {item.label}
                </Link>
              );
            })}
            {isAdmin ? (
              <Link
                aria-current={activePath === "/admin" ? "page" : undefined}
                className={activePath === "/admin" ? "is-active" : undefined}
                href="/admin"
                onClick={closeMobileMenu}
              >
                {t.me.menu.adminCenter}
              </Link>
            ) : null}
            <div className="mobile-menu-preferences" aria-label={t.ariaLabels.preferences}>
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
      </header>

      {children}

      <footer className="footer" aria-label={t.footer.ariaLabel}>
        <div className="footer-brand">
          <Link className="footer-logo" href="/" aria-label={t.ariaLabels.home} onClick={handleBrandClick}>
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
