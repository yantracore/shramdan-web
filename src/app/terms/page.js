"use client";

import { usePreferences } from "@/app/providers";
import { LegalPage } from "@/components/LegalPage";
import { copy } from "@/lib/siteContent";

export default function TermsPage() {
  const { language } = usePreferences();
  const t = copy[language] ?? copy.np;

  return <LegalPage pageTitle={t.pageTitles.terms} content={t.legal.terms} />;
}
