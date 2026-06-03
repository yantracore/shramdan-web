"use client";

// PushOptInPanel — roadmap 8.3.
// UI for requesting Notification permission, subscribing to push,
// and showing the current state. Demo mode does not actually post
// the subscription to a backend (no VAPID server yet); permission
// grant + local test notification is the surface for now.

import {
  BellFilled,
  BellOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  StopOutlined
} from "@ant-design/icons";
import { Button } from "antd";
import { useEffect, useState } from "react";
import {
  getCurrentSubscription,
  getPermissionState,
  isPushSupported,
  registerServiceWorker,
  requestPermissionAndSubscribe,
  showLocalTestNotification,
  unsubscribe
} from "@/lib/pwa";
import { useToast } from "@/lib/toast";

const COPY = {
  np: {
    eyebrow: "सूचना सेटिङ",
    title: "Push सूचना",
    intro:
      "अभियानको सम्झना र अत्यावश्यक सूचनाहरू तपाईंको ब्राउजरमा प्राप्त गर्न Push सूचना अनुमति दिनुहोस्। तपाईंले जुनसुकै बेला बन्द गर्न सक्नुहुन्छ।",
    statusUnsupported: "तपाईंको ब्राउजरले Push सूचना समर्थन गर्दैन।",
    statusDefault: "अहिले अनुमति अनुरोध भएको छैन।",
    statusDenied: "तपाईंले अनुमति अस्वीकार गर्नुभएको छ। ब्राउजर सेटिङमा गएर बदल्न सक्नुहुन्छ।",
    statusGranted: "Push सूचना सक्रिय छ।",
    statusDemo: "अनुमति प्राप्त भयो; ब्याकएन्ड VAPID अझै तयार छैन — स्थानीय परीक्षण मात्र काम गर्छ।",
    enableCta: "Push सक्रिय गर्नुहोस्",
    disableCta: "बन्द गर्नुहोस्",
    testCta: "परीक्षण सूचना पठाउनुहोस्",
    testTitle: "श्रमदान — परीक्षण",
    testBody: "Push सूचना तपाईंकहाँ आइपुगिरहेको छ।",
    enabledToast: "Push सूचना सक्रिय भयो।",
    disabledToast: "Push सूचना बन्द भयो।",
    deniedToast: "अनुमति अस्वीकार भयो।",
    errorToast: "केही गडबड भयो।",
    testFailedToast: "परीक्षण सूचना पठाउन सकिएन।"
  },
  en: {
    eyebrow: "Notification settings",
    title: "Push notifications",
    intro:
      "Allow push notifications to receive campaign reminders and urgent alerts in your browser. You can turn them off any time.",
    statusUnsupported: "Your browser doesn't support push notifications.",
    statusDefault: "Permission has not been requested yet.",
    statusDenied:
      "You've denied permission. You can change this in your browser settings.",
    statusGranted: "Push notifications are active.",
    statusDemo:
      "Permission granted; backend VAPID isn't ready yet — only local test notifications work.",
    enableCta: "Enable push",
    disableCta: "Turn off",
    testCta: "Send test notification",
    testTitle: "Shramdan — test",
    testBody: "Push notifications are reaching you.",
    enabledToast: "Push notifications enabled.",
    disabledToast: "Push notifications turned off.",
    deniedToast: "Permission denied.",
    errorToast: "Something went wrong.",
    testFailedToast: "Could not send the test notification."
  }
};

export function PushOptInPanel({ language = "np" }) {
  const t = COPY[language] || COPY.np;
  const messageApi = useToast();

  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState("default");
  const [subscription, setSubscription] = useState(null);
  const [busy, setBusy] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    setSupported(isPushSupported());
    setPermission(getPermissionState());
    if (isPushSupported()) {
      registerServiceWorker().then(() => {
        getCurrentSubscription().then((sub) => setSubscription(sub));
      });
    }
  }, []);

  const handleEnable = async () => {
    setBusy(true);
    const result = await requestPermissionAndSubscribe();
    setBusy(false);
    setPermission(getPermissionState());
    if (result.ok) {
      setSubscription(result.subscription);
      setIsDemoMode(Boolean(result.demoOnly));
      messageApi.success(t.enabledToast);
    } else if (result.reason === "permission-denied") {
      messageApi.warning(t.deniedToast);
    } else if (result.reason === "unsupported") {
      messageApi.error(t.statusUnsupported);
    } else {
      messageApi.error(t.errorToast);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    const result = await unsubscribe();
    setBusy(false);
    if (result.ok) {
      setSubscription(null);
      setIsDemoMode(false);
      messageApi.success(t.disabledToast);
    } else {
      messageApi.error(t.errorToast);
    }
  };

  const handleTest = async () => {
    const ok = await showLocalTestNotification({ title: t.testTitle, body: t.testBody });
    if (!ok) messageApi.error(t.testFailedToast);
  };

  let statusMessage;
  let statusIcon;
  let statusToneClass;
  if (!supported) {
    statusMessage = t.statusUnsupported;
    statusIcon = <StopOutlined />;
    statusToneClass = "is-unsupported";
  } else if (permission === "denied") {
    statusMessage = t.statusDenied;
    statusIcon = <CloseCircleFilled />;
    statusToneClass = "is-denied";
  } else if (permission === "granted") {
    statusMessage = isDemoMode || !subscription ? t.statusDemo : t.statusGranted;
    statusIcon = <CheckCircleFilled />;
    statusToneClass = "is-granted";
  } else {
    statusMessage = t.statusDefault;
    statusIcon = <BellOutlined />;
    statusToneClass = "is-default";
  }

  return (
    <section className="push-optin-panel" aria-labelledby="push-optin-title">
      <header className="push-optin-header">
        <span className="eyebrow">
          <BellFilled aria-hidden="true" /> {t.eyebrow}
        </span>
        <h2 id="push-optin-title">{t.title}</h2>
        <p>{t.intro}</p>
      </header>

      <div className={`push-optin-status ${statusToneClass}`} role="status">
        <span className="push-optin-status-icon" aria-hidden="true">
          {statusIcon}
        </span>
        <span>{statusMessage}</span>
      </div>

      <div className="push-optin-actions">
        {supported && permission !== "granted" ? (
          <Button
            type="primary"
            icon={<BellFilled />}
            onClick={handleEnable}
            disabled={busy || permission === "denied"}
            loading={busy}
          >
            {t.enableCta}
          </Button>
        ) : null}
        {supported && permission === "granted" ? (
          <>
            <Button icon={<BellFilled />} onClick={handleTest} disabled={busy}>
              {t.testCta}
            </Button>
            <Button danger onClick={handleDisable} disabled={busy} loading={busy}>
              {t.disableCta}
            </Button>
          </>
        ) : null}
      </div>
    </section>
  );
}
