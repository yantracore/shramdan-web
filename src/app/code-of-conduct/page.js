"use client";

import { usePreferences } from "@/app/providers";
import { LegalPage } from "@/components/LegalPage";
import { copy } from "@/lib/siteContent";

export default function CodeOfConductPage() {
  const { language } = usePreferences();
  const t = copy[language] ?? copy.np;

  return <LegalPage pageTitle={t.pageTitles.codeOfConduct} content={t.legal.codeOfConduct} />;
}
