"use client";

import {
  CalendarOutlined,
  EnvironmentOutlined,
  FormOutlined,
  MessageOutlined,
  RightOutlined,
  ToolOutlined
} from "@ant-design/icons";
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
    body: "Browse community-reported issues, filter by status or category, inspect details, and create new issues on behalf of verified contributors.",
    href: "/admin/issues",
    icon: <EnvironmentOutlined />,
    label: "Issues",
    status: "Live"
  },
  {
    body: "Track cleanup events, assign event leaders, settle leader voting, and resolve tie-breaks.",
    href: "/admin/events",
    icon: <CalendarOutlined />,
    label: "Events",
    status: "Live"
  },
  {
    body: "Incident, role, and notification administration will be added after backend contracts are finalized.",
    href: "#",
    icon: <ToolOutlined />,
    label: "Operations",
    status: "Later"
  }
];

export default function AdminDashboardPage() {
  return (
    <AdminShell title="Dashboard">
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
          Applications, Feedback, Issues, and Events are connected to the live backend. Admins can
          create new issues on behalf of verified contributors; status changes, edits, notes, and
          deletes are still pending backend mutation endpoints. Events supports leader assignment,
          tie-break, and voting settle; scheduling and completion remain with the assigned event
          leader by API design.
        </p>
        <Link href="/">Back to public site</Link>
      </section>
    </AdminShell>
  );
}
