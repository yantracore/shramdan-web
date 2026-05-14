"use client";

import { message } from "antd";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ContributorForm } from "@/components/ContributorForm";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { postJson } from "@/lib/apiClient";
import { copy } from "@/lib/siteContent";

function JoinPageContent() {
  const { language } = usePreferences();
  const searchParams = useSearchParams();
  const t = copy[language];
  const [messageApi, contextHolder] = message.useMessage();
  const [submitting, setSubmitting] = useState(false);
  const selectedRole = searchParams.get("role");
  const allowedRoles = new Set(t.options.applicationRoles.map((role) => role.value));
  const initialRole = allowedRoles.has(selectedRole) ? selectedRole : undefined;

  const handleSubmit = async (values) => {
    setSubmitting(true);

    try {
      await postJson("/applications", values);
      messageApi.success(t.messages.join);
      return true;
    } catch (error) {
      messageApi.error(error.message || t.messages.submitError);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SiteShell>
      {contextHolder}
      <section className="page-section form-section">
        <div className="section-heading">
          <span className="eyebrow">{t.join.eyebrow}</span>
          <h1>{t.join.title}</h1>
          <p>{t.join.intro}</p>
        </div>
        <ContributorForm
          content={t}
          initialRole={initialRole}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      </section>
    </SiteShell>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={null}>
      <JoinPageContent />
    </Suspense>
  );
}
