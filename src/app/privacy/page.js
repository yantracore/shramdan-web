"use client";

import { usePreferences } from "@/app/providers";
import { LegalPage } from "@/components/LegalPage";
import { copy } from "@/lib/siteContent";

export default function PrivacyPage() {
  const { language } = usePreferences();
  const t = copy[language] ?? copy.np;

  return <LegalPage pageTitle={t.pageTitles.privacy} content={t.legal.privacy} />;
}
