"use client";

// Notification channel preferences — GET /notifications/preferences hydrates the
// toggles from the saved state, PUT /notifications/preferences persists changes
// ({ sms, email, push }). Both shipped 2026-07-01.

import { MailOutlined, MobileOutlined, BellOutlined } from "@ant-design/icons";
import { Button, Switch } from "antd";
import { useEffect, useState } from "react";
import {
  fetchNotificationPreferences,
  updateNotificationPreferences
} from "@/lib/apiClient";
import { useToast } from "@/lib/toast";

const COPY = {
  np: {
    eyebrow: "सूचना च्यानल",
    title: "कहाँ सूचना पाउने?",
    intro:
      "तपाईंलाई कुन माध्यमबाट सूचना पठाऔँ छान्नुहोस्। जुनसुकै बेला बदल्न सकिन्छ।",
    email: "इमेल",
    emailHint: "अभियान र समर्थनका अपडेट इमेलमा।",
    push: "Push (ब्राउजर)",
    pushHint: "ब्राउजरमा तत्काल अलर्ट।",
    sms: "SMS",
    smsHint: "अत्यावश्यक सूचना मोबाइलमा।",
    save: "सुरक्षित गर्ने",
    saved: "सूचना च्यानल अपडेट भयो।",
    error: "सुरक्षित गर्न सकिएन। फेरि प्रयास गर्नुहोस्।"
  },
  en: {
    eyebrow: "Notification channels",
    title: "Where should we reach you?",
    intro:
      "Choose how we send your notifications. You can change this any time.",
    email: "Email",
    emailHint: "Campaign and support updates by email.",
    push: "Push (browser)",
    pushHint: "Instant alerts in your browser.",
    sms: "SMS",
    smsHint: "Urgent notices to your mobile.",
    save: "Save",
    saved: "Notification channels updated.",
    error: "Could not save. Please try again."
  }
};

const CHANNELS = [
  { key: "email", icon: MailOutlined },
  { key: "push", icon: BellOutlined },
  { key: "sms", icon: MobileOutlined }
];

export function NotificationChannelPrefs({ language = "np" }) {
  const t = COPY[language] || COPY.np;
  const messageApi = useToast();
  const [prefs, setPrefs] = useState({ email: true, push: true, sms: false });
  const [saving, setSaving] = useState(false);

  // Hydrate from the saved channel prefs so the toggles reflect persisted state.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchNotificationPreferences();
        const channels = res?.data?.channels || res?.channels;
        if (!cancelled && channels) {
          setPrefs((prev) => ({
            email: Boolean(channels.email ?? prev.email),
            push: Boolean(channels.push ?? prev.push),
            sms: Boolean(channels.sms ?? prev.sms)
          }));
        }
      } catch {
        // Keep the sensible defaults if the read fails.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (key) => (checked) =>
    setPrefs((prev) => ({ ...prev, [key]: checked }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateNotificationPreferences(prefs);
      messageApi.success(t.saved);
    } catch (error) {
      messageApi.error(error?.message || t.error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="notif-prefs-panel" aria-labelledby="notif-prefs-title">
      <header className="notif-prefs-header">
        <span className="eyebrow">{t.eyebrow}</span>
        <h2 id="notif-prefs-title">{t.title}</h2>
        <p>{t.intro}</p>
      </header>
      <ul className="notif-prefs-list">
        {CHANNELS.map(({ key, icon: Icon }) => (
          <li key={key} className="notif-prefs-row">
            <span className="notif-prefs-icon" aria-hidden="true">
              <Icon />
            </span>
            <span className="notif-prefs-text">
              <strong>{t[key]}</strong>
              <span className="notif-prefs-hint">{t[`${key}Hint`]}</span>
            </span>
            <Switch checked={prefs[key]} onChange={toggle(key)} />
          </li>
        ))}
      </ul>
      <div className="notif-prefs-actions">
        <Button type="primary" onClick={handleSave} loading={saving}>
          {t.save}
        </Button>
      </div>
    </section>
  );
}
