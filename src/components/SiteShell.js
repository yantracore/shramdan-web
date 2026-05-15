"use client";

import { useEffect, useState } from "react";
import {
  MenuOutlined,
  MoonOutlined,
  SunOutlined,
  TranslationOutlined,
  UserAddOutlined
} from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaFacebookF, FaTiktok, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { usePreferences } from "@/app/providers";
import { copy } from "@/lib/siteContent";

const socialIcons = {
  facebook: FaFacebookF,
  twitter: FaXTwitter,
  tiktok: FaTiktok,
  youtube: FaYoutube
};

export function SiteShell({ children }) {
  const { language, mode, toggleLanguage, toggleMode } = usePreferences();
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const pathname = usePathname();
  const t = copy[language];
  const activePath = pathname === "/" ? "/" : `/${pathname.split("/").filter(Boolean)[0]}`;
  const navItems = [
    { href: "/", label: t.nav.home },
    { href: "/join", label: t.nav.join },
    { href: "/feedback", label: t.nav.feedback }
  ];
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
        <Link className="brand" href="/" aria-label={t.ariaLabels.home}>
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
          <Button type="primary" href="/join" icon={<UserAddOutlined />}>
            {t.nav.join}
          </Button>
        </div>

        <details className="mobile-menu">
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
                >
                  {item.label}
                </Link>
              );
            })}
            <button type="button" aria-label={t.controls.themeTooltip} title={t.controls.themeTooltip} onClick={toggleMode}>
              {mode === "light" ? t.controls.darkTheme : t.controls.lightTheme}
            </button>
            <button type="button" aria-label={t.controls.languageTooltip} title={t.controls.languageTooltip} onClick={toggleLanguage}>
              {t.controls.language}
            </button>
          </div>
        </details>
      </header>

      {children}

      <footer className="footer" aria-label={t.footer.ariaLabel}>
        <div className="footer-brand">
          <Link className="footer-logo" href="/" aria-label={t.ariaLabels.home}>
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
