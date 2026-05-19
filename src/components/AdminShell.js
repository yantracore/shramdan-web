"use client";

import {
  AppstoreOutlined,
  FormOutlined,
  LogoutOutlined,
  MenuOutlined,
  MessageOutlined,
  MoonOutlined,
  SunOutlined,
  UserOutlined
} from "@ant-design/icons";
import { Avatar, Button, Drawer, Dropdown, Spin, Tag, Tooltip } from "antd";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { usePreferences } from "@/app/providers";
import { clearAuthSession, getAuthSession, isAdminUser, subscribeAuthSession } from "@/lib/authSession";

const adminNavItems = [
  { href: "/admin", icon: <AppstoreOutlined />, label: "Dashboard" },
  { href: "/admin/applications", icon: <FormOutlined />, label: "Applications" },
  { href: "/admin/feedback", icon: <MessageOutlined />, label: "Feedback" }
];

function AdminSidebar({ activePath, onNavigate }) {
  return (
    <aside className="admin-sidebar" aria-label="Admin navigation">
      <Link className="admin-sidebar-brand" href="/admin" onClick={onNavigate}>
        <span>SH</span>
        <strong>Shramdan</strong>
      </Link>
      <nav className="admin-sidebar-nav">
        {adminNavItems.map((item) => {
          const isActive = activePath === item.href;

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={isActive ? "is-active" : undefined}
              href={item.href}
              key={item.href}
              onClick={onNavigate}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function AdminShell({ children, subtitle, title }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useSyncExternalStore(subscribeAuthSession, getAuthSession, () => null);
  const { mode, toggleMode } = usePreferences();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (!session) {
      router.replace("/login");
      return;
    }

    if (!isAdminUser(session.user)) {
      clearAuthSession();
      router.replace("/login");
    }
  }, [router, session]);

  const handleLogout = () => {
    clearAuthSession();
    router.replace("/login");
  };

  if (!session || !isAdminUser(session.user)) {
    return (
      <main className="admin-auth-loading">
        <Spin size="large" />
      </main>
    );
  }

  const displayName = session.user.name || session.user.email;
  const userMenu = {
    items: [
      {
        key: "identity",
        disabled: true,
        label: (
          <div className="admin-user-menu-profile">
            <strong>{displayName}</strong>
            <span>{session.user.email}</span>
            <Tag color="green">{session.user.role}</Tag>
          </div>
        )
      },
      { type: "divider" },
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Logout",
        onClick: handleLogout
      }
    ]
  };

  return (
    <main className="admin-shell">
      <AdminSidebar activePath={pathname} />

      <Drawer
        className="admin-mobile-drawer"
        open={isDrawerOpen}
        placement="left"
        title="Admin"
        onClose={() => setIsDrawerOpen(false)}
      >
        <AdminSidebar activePath={pathname} onNavigate={() => setIsDrawerOpen(false)} />
      </Drawer>

      <section className="admin-workspace">
        <header className="admin-topbar">
          <div className="admin-title-block">
            <Button
              className="admin-mobile-menu-button"
              icon={<MenuOutlined />}
              onClick={() => setIsDrawerOpen(true)}
            />
            <div>
              <h1>{title}</h1>
              {subtitle ? <p>{subtitle}</p> : null}
            </div>
          </div>
          <div className="admin-topbar-actions">
            <Tooltip title="Switch theme">
              <Button icon={mode === "light" ? <SunOutlined /> : <MoonOutlined />} onClick={toggleMode} />
            </Tooltip>
            <Dropdown menu={userMenu} placement="bottomRight" trigger={["click"]}>
              <Button className="admin-user-button">
                <Avatar size={24} icon={<UserOutlined />} />
                <span>{displayName}</span>
              </Button>
            </Dropdown>
          </div>
        </header>

        <div className="admin-content">{children}</div>
      </section>
    </main>
  );
}
