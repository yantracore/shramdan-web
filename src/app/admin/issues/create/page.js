"use client";

import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { AdminPanelHeading } from "@/components/admin/AdminPanelHeading";
import { IssueMultiStepForm } from "@/components/admin/IssueMultiStepForm";
import { postJson } from "@/lib/apiClient";
import { copy } from "@/lib/siteContent";
import { useToast } from "@/lib/toast";

export default function AdminIssueCreatePage() {
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  // Admin UI is EN-only (per project_language_scope memory); pull the
  // English copy block so the multi-step shell can render step titles.
  const enCopy = copy.en;

  const handleFinish = async (values) => {
    setSubmitting(true);

    const { cover, additionalImages, ...rest } = values;
    // Admin control center is EN-only (project_language_scope), so the
    // title/description are authored in English. POST /issues requires
    // `language` (enum ne|en) — the source locale the backend auto-
    // translates from — so send "en".
    const payload = { ...rest, language: "en" };
    if (cover?.id) payload.coverImageId = cover.id;
    if (Array.isArray(additionalImages) && additionalImages.length) {
      payload.uploadIds = additionalImages.map((image) => image.id);
    }

    // No catch here: a failure (including backend validation) propagates into
    // IssueMultiStepForm, which pins each error onto its field and step.
    // `finally` still clears the submitting state before the throw lands.
    try {
      await postJson("/issues", payload, { requireAuth: true });
      toast.success("Issue created.");
      router.push("/admin/issues");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminShell title="Create issue">
      <section className="admin-panel multi-step-section">
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

        <IssueMultiStepForm
          copy={enCopy}
          submitting={submitting}
          submitLabel="Create issue"
          onSubmit={handleFinish}
        />
      </section>
    </AdminShell>
  );
}
