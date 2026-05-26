"use client";

import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { AdminPanelHeading } from "@/components/admin/AdminPanelHeading";
import { IssueForm } from "@/components/admin/IssueForm";
import { postJson } from "@/lib/apiClient";
import { useToast } from "@/lib/toast";

export default function AdminIssueCreatePage() {
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = async (values) => {
    setSubmitting(true);

    const { cover, ...rest } = values;
    const payload = cover?.url ? { ...rest, coverImage: cover.url } : rest;

    try {
      await postJson("/issues", payload, { requireAuth: true });
      toast.success("Issue created.");
      router.push("/admin/issues");
    } catch (error) {
      toast.error(error.message || "Could not create issue.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminShell title="Create issue">
      <section className="admin-panel">
        <AdminPanelHeading
          eyebrow="Community issues"
          title="Create issue"
          description="Report a new community issue on behalf of a verified contributor. All required fields must match the public issue contract."
          actions={
            <Link href="/admin/issues">
              <Button icon={<ArrowLeftOutlined />}>Back to issues</Button>
            </Link>
          }
        />

        <IssueForm
          submitting={submitting}
          submitLabel="Create issue"
          onSubmit={handleFinish}
        />
      </section>
    </AdminShell>
  );
}
