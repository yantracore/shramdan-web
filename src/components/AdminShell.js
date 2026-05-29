"use client";

import {
  AppstoreOutlined,
  BarChartOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  FormOutlined,
  GlobalOutlined,
  LogoutOutlined,
  MenuOutlined,
  MessageOutlined,
  MoonOutlined,
  SunOutlined,
  TeamOutlined,
  UserOutlined
} from "@ant-design/icons";
import { Avatar, Button, Drawer, Dropdown, Spin, Tag, Tooltip } from "antd";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { usePreferences } from "@/app/providers";
import { clearAuthSession, getAuthSession, isAdminUser, subscribeAuthSession } from "@/lib/authSession";
import { logoutAndClearSession } from "@/lib/apiClient";

function getUserInitials(name, email) {
  const source = (name || "").trim();

  if (source) {
    const parts = source.split(/\s+/).filter(Boolean);
    const letters = parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`
      : parts[0][0];
    return letters.toUpperCase();
  }

  return (email || "?").slice(0, 1).toUpperCase();
}

const adminNavGroups = [
  [
    { href: "/admin", icon: <AppstoreOutlined />, label: "Dashboard" },
    { href: "/admin/reports", icon: <BarChartOutlined />, label: "Reports" }
  ],
  [
    { href: "/admin/applications", icon: <FormOutlined />, label: "Applications" },
    { href: "/admin/feedback", icon: <MessageOutlined />, label: "Feedback" }
  ],
  [
    { href: "/admin/issues", icon: <EnvironmentOutlined />, label: "Issues" },
    { href: "/admin/events", icon: <CalendarOutlined />, label: "Events" }
  ],
  [
    { href: "/admin/users", icon: <TeamOutlined />, label: "Users" }
  ]
];

function AdminSidebar({ activePath, onNavigate }) {
  return (
    <aside className="admin-sidebar" aria-label="Admin navigation">
      <Link className="admin-sidebar-brand" href="/admin" onClick={onNavigate}>
        <span>SH</span>
        <strong>Shramdan</strong>
      </Link>
      <nav className="admin-sidebar-nav">
        {adminNavGroups.map((group, groupIndex) => (
          <div className="admin-sidebar-group" key={groupIndex}>
            {groupIndex > 0 ? <hr aria-hidden="true" className="admin-sidebar-divider" /> : null}
            {group.map((item) => {
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
          </div>
        ))}
      </nav>
    </aside>
  );
}

export function AdminShell({ children, title }) {
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

  useEffect(() => {
    if (!title) return;
    document.title = `${title} · श्रमदान Control Center`;
  }, [title]);

  const handleLogout = async () => {
    await logoutAndClearSession();
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
  const userInitials = getUserInitials(session.user.name, session.user.email);
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
        key: "back-to-website",
        icon: <GlobalOutlined />,
        label: "Back to website",
        onClick: () => router.push("/")
      },
      {
        key: "profile",
        icon: <UserOutlined />,
        label: "My profile",
        onClick: () => router.push("/me")
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
            </div>
          </div>
          <div className="admin-topbar-actions">
            <Tooltip title="Switch theme">
              <Button icon={mode === "light" ? <SunOutlined /> : <MoonOutlined />} onClick={toggleMode} />
            </Tooltip>
            <Dropdown menu={userMenu} placement="bottomRight" trigger={["click"]}>
              <Button className="admin-user-button">
                <Avatar size={24}>{userInitials}</Avatar>
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
