"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ContributorForm } from "@/components/ContributorForm";
import { isHoneypotTriggered } from "@/components/Honeypot";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { postJson } from "@/lib/apiClient";
import { copy } from "@/lib/siteContent";
import { useToast } from "@/lib/toast";

function JoinPageContent() {
  const { language } = usePreferences();
  const searchParams = useSearchParams();
  const t = copy[language];
  const messageApi = useToast();
  const [submitting, setSubmitting] = useState(false);
  const selectedRole = searchParams.get("role");
  const allowedRoles = new Set(t.options.applicationRoles.map((role) => role.value));
  const initialRole = allowedRoles.has(selectedRole) ? selectedRole : undefined;

  const handleSubmit = async (values) => {
    if (isHoneypotTriggered(values)) {
      messageApi.success(t.messages.join);
      return true;
    }

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
      <section className="page-section form-section">
        <ContributorForm
          content={t}
          eyebrow={t.join.eyebrow}
          title={t.join.title}
          intro={t.join.intro}
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
