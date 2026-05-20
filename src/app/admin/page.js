"use client";

import { FormOutlined, MessageOutlined, RightOutlined, ToolOutlined } from "@ant-design/icons";
import { Button, Tag } from "antd";
import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";

const dashboardModules = [
  {
    body: "Review contributor applications, update onboarding status, write admin notes, and remove unwanted entries.",
    href: "/admin/applications",
    icon: <FormOutlined />,
    label: "Applications",
    status: "Live"
  },
  {
    body: "Review public feedback, update review state, save admin replies, and delete resolved or duplicate entries.",
    href: "/admin/feedback",
    icon: <MessageOutlined />,
    label: "Feedback",
    status: "Live"
  },
  {
    body: "Issue, event, incident, role, and notification administration will be added after backend contracts are finalized.",
    href: "#",
    icon: <ToolOutlined />,
    label: "Operations",
    status: "Later"
  }
];

export default function AdminDashboardPage() {
  return (
    <AdminShell title="Control Center">
      <section className="admin-dashboard-grid">
        {dashboardModules.map((module) => {
          const isDisabled = module.href === "#";

          return (
            <article className="admin-dashboard-card" key={module.label}>
              <span className="admin-dashboard-card-icon">{module.icon}</span>
              <div className="admin-dashboard-card-heading">
                <h2>{module.label}</h2>
                <Tag color={module.status === "Live" ? "green" : "default"}>{module.status}</Tag>
              </div>
              <p>{module.body}</p>
              {isDisabled ? (
                <Button disabled>Coming later</Button>
              ) : (
                <Button href={module.href} icon={<RightOutlined />} type="primary">
                  Open {module.label}
                </Button>
              )}
            </article>
          );
        })}
      </section>

      <section className="admin-dashboard-note">
        <h2>Today&apos;s admin scope</h2>
        <p>
          Applications and Feedback are connected to the live backend. Profile details come from
          the login session until the API exposes a dedicated profile endpoint.
        </p>
        <Link href="/">Back to public site</Link>
      </section>
    </AdminShell>
  );
}
