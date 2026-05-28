"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { usePreferences } from "@/app/providers";
import { subscribeAuthSessionExpired } from "@/lib/authSession";
import { copy } from "@/lib/siteContent";
import { useToast } from "@/lib/toast";

function isSafeRelativePath(path) {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//");
}

export function SessionExpirationWatcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { language } = usePreferences();
  const messageApi = useToast();
  const lastFiredAt = useRef(0);

  useEffect(() => {
    const unsubscribe = subscribeAuthSessionExpired(() => {
      const now = Date.now();

      if (now - lastFiredAt.current < 1500) {
        return;
      }

      lastFiredAt.current = now;

      const t = copy[language] ?? copy.np;
      messageApi.warning(t.messages.sessionExpired);

      if (pathname === "/login") {
        return;
      }

      const nextParam = isSafeRelativePath(pathname) ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${nextParam}`);
    });

    return unsubscribe;
  }, [language, messageApi, pathname, router]);

  return null;
}
