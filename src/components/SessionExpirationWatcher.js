"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { usePreferences } from "@/app/providers";
import { subscribeAuthSessionExpired } from "@/lib/authSession";
import { buildLoginHref } from "@/lib/loginRedirect";
import { copy } from "@/lib/siteContent";
import { useToast } from "@/lib/toast";

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

      router.replace(buildLoginHref(pathname, "expired"));
    });

    return unsubscribe;
  }, [language, messageApi, pathname, router]);

  return null;
}
