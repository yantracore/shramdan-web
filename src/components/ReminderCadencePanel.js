"use client";

import { BellOutlined } from "@ant-design/icons";
import { Checkbox } from "antd";
import { useMemo, useState } from "react";
import { patchJson } from "@/lib/apiClient";
import { useToast } from "@/lib/toast";

const isDemoId = (id) => typeof id === "string" && id.startsWith("demo-");

const CADENCE_KEYS = ["3d", "24h", "1h"];

const COPY = {
  np: {
    eyebrow: "अभियान संयोजक मात्र — सम्झना",
    title: "सहभागीहरूलाई सम्झना",
    intro:
      "कुन-कुन समयमा सहभागीहरूले सम्झना सूचना पाउने हो छनोट गर्नुहोस्। पुष्टि गरेका सहभागीहरूलाई मात्र पठाइन्छ।",
    options: {
      "3d": "अभियानको ३ दिन अघि",
      "24h": "अभियानको २४ घण्टा अघि",
      "1h": "अभियानको १ घण्टा अघि"
    },
    successToast: "सम्झना तालिका सुरक्षित गरियो।",
    demoSuccessToast: "सम्झना तालिका सुरक्षित (स्थानीय)।",
    errorToast: "सुरक्षित गर्न सकिएन। फेरि प्रयास गर्नुहोस्।",
    backendPendingToast: "ब्याकएन्ड समर्थन अझै तयार छैन — डेमो मा स्थानीय रूपमा सुरक्षित।"
  },
  en: {
    eyebrow: "Campaign lead only — reminders",
    title: "Reminders for participants",
    intro:
      "Pick when confirmed participants get a reminder. Only confirmed roster members are notified.",
    options: {
      "3d": "3 days before the event",
      "24h": "24 hours before the event",
      "1h": "1 hour before the event"
    },
    successToast: "Reminder schedule saved.",
    demoSuccessToast: "Reminder schedule saved (local only).",
    errorToast: "Could not save. Please try again.",
    backendPendingToast: "Backend endpoint is pending — saved locally for the demo."
  }
};

function normalizeCadence(value) {
  if (!Array.isArray(value)) return new Set(["3d", "24h"]);
  return new Set(value.filter((k) => CADENCE_KEYS.includes(k)));
}

export function ReminderCadencePanel({ event, language = "np", onSaved }) {
  const t = COPY[language] || COPY.np;
  const messageApi = useToast();

  const [selected, setSelected] = useState(() =>
    normalizeCadence(event?.reminderCadence)
  );
  const [saving, setSaving] = useState(false);

  const arrayValue = useMemo(() => Array.from(selected), [selected]);

  const persist = async (nextSet) => {
    const nextArray = Array.from(nextSet);
    setSelected(new Set(nextArray));
    setSaving(true);
    try {
      if (isDemoId(event?.id)) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        messageApi.success(t.demoSuccessToast);
        onSaved?.({ ...event, reminderCadence: nextArray });
        return;
      }

      try {
        await patchJson(
          `/events/${event.id}/reminders`,
          { reminderCadence: nextArray },
          { requireAuth: true }
        );
        messageApi.success(t.successToast);
        onSaved?.();
      } catch (apiError) {
        if (apiError?.status === 404 || apiError?.status === 501) {
          messageApi.info(t.backendPendingToast);
          onSaved?.({ ...event, reminderCadence: nextArray });
          return;
        }
        throw apiError;
      }
    } catch (error) {
      messageApi.error(error?.message || t.errorToast);
      // Roll back on hard error
      setSelected(normalizeCadence(event?.reminderCadence));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key) => (e) => {
    const next = new Set(selected);
    if (e.target.checked) next.add(key);
    else next.delete(key);
    persist(next);
  };

  return (
    <section className="reminder-cadence-panel" aria-labelledby="reminder-cadence-title">
      <header className="reminder-cadence-header">
        <span className="eyebrow">{t.eyebrow}</span>
        <h2 id="reminder-cadence-title">
          <BellOutlined aria-hidden="true" /> {t.title}
        </h2>
        <p>{t.intro}</p>
      </header>

      <ul className="reminder-cadence-options">
        {CADENCE_KEYS.map((key) => (
          <li key={key} className="reminder-cadence-option">
            <Checkbox
              checked={selected.has(key)}
              onChange={handleToggle(key)}
              disabled={saving}
            >
              {t.options[key]}
            </Checkbox>
          </li>
        ))}
      </ul>
    </section>
  );
}
