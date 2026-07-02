"use client";

// /app/issues/new — mobile-first issue submission wrapper
// (roadmap 2.4). For the MVP we redirect to the existing public
// /issues/new form to avoid duplicating the upload + validation
// logic. Once the /app route gets its own mobile-shell, we can
// inline a tailored version of IssueForm here.

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AppIssueNewRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/issues/new?from=app");
  }, [router]);
  return null;
}
