"use client";

import {
  AppstoreOutlined,
  FileTextOutlined,
  FormOutlined,
  LogoutOutlined,
  MessageOutlined
} from "@ant-design/icons";
import { Button, Spin, Tag } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { SiteShell } from "@/components/SiteShell";
import {
  clearAuthSession,
  getAuthSession,
  isAdminUser,
  subscribeAuthSession
} from "@/lib/authSession";

const adminModules = [
  {
    icon: <FormOutlined />,
    label: "Applications",
    status: "First CRUD",
    body: "Review contributor applications, update statuses, write admin notes, and remove spam entries."
  },
  {
    icon: <MessageOutlined />,
    label: "Feedback",
    status: "Next",
    body: "Review public feedback, update status, reply as admin, and close resolved conversations."
  },
  {
    icon: <FileTextOutlined />,
    label: "Issues and events",
    status: "Later",
    body: "Wait for finalized backend contracts before managing community issues, events, incidents, and roles."
  }
];

export default function AdminPage() {
  const router = useRouter();
  const session = useSyncExternalStore(subscribeAuthSession, getAuthSession, () => null);

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
      <SiteShell>
        <section className="page-section admin-loading">
          <Spin size="large" />
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <section className="page-section admin-section">
        <div className="admin-hero">
          <div>
            <span className="eyebrow">Control Center</span>
            <h1>Admin Control Center</h1>
            <p>Manage Shramdan operations from one place.</p>
          </div>
          <div className="admin-session-card">
            <span>Signed in as</span>
            <strong>{session.user.email}</strong>
            <Button icon={<LogoutOutlined />} onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        <div className="admin-module-grid">
          {adminModules.map((module) => (
            <article className="content-card admin-module-card" key={module.label}>
              <span className="admin-module-icon" aria-hidden="true">
                {module.icon}
              </span>
              <div>
                <div className="admin-module-heading">
                  <h2>{module.label}</h2>
                  <Tag color={module.status === "First CRUD" ? "green" : "default"}>
                    {module.status}
                  </Tag>
                </div>
                <p>{module.body}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="content-card admin-next-card">
          <AppstoreOutlined aria-hidden="true" />
          <div>
            <h2>Next build target</h2>
            <p>
              The next step is the Applications management view: list applications, filter by
              status or role, update status, save admin notes, and delete unwanted entries.
            </p>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
