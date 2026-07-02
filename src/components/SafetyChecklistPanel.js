"use client";

import { CheckCircleFilled, SafetyCertificateOutlined } from "@ant-design/icons";
import { Button, Checkbox } from "antd";
import { useMemo, useState } from "react";
import { postJson } from "@/lib/apiClient";
import { useToast } from "@/lib/toast";

const isDemoId = (id) => typeof id === "string" && id.startsWith("demo-");

const COPY = {
  np: {
    eyebrow: "अभियान संयोजक मात्र — सुरक्षा जाँच",
    title: "अभियान सक्रिय गर्नुअघि सुरक्षा जाँच",
    intro:
      "सहभागीहरूको सुरक्षाको लागि अभियान सक्रिय (ACTIVE) हुनुअघि यी सबै बुँदा पुष्टि गर्नुहोस्। हरेक बुँदा संयोजकले हेरेर/पुष्टि गरेर मात्र टिक लगाउनुहोस्।",
    items: [
      "अघिल्लो समीक्षा बैठक (Pre-execution review) सम्पन्न; अन्तिम सहभागी सूची तय।",
      "स्वास्थ्यकर्मी / प्राथमिक उपचार किट उपलब्ध। उच्च जोखिम भए प्रमाणित स्वास्थ्यकर्मी अनिवार्य।",
      "सुरक्षा प्रमुख तोकिएको; ट्राफिक र खतरनाक स्थलहरू पहिचान भएको।",
      "स्थानीय अनुमति / जग्गाधनीको स्वीकृति लिखित रूपमा पुष्टि।",
      "मौसम पूर्वानुमान हेरिएको; वर्षा वा ताप अनुसार वैकल्पिक योजना तयार।",
      "औजार, पानी, मास्क, खाजा सबै लजिस्टिक्स तयार।",
      "सहभागीहरूलाई समय र भेला स्थान पुनः सूचना पठाइएको।"
    ],
    requiredHint: "सबै {n} बुँदा टिक लागेपछि सक्रिय गर्न सकिनेछ।",
    progress: "{checked} / {total} पुष्टि भयो",
    activateCta: "अभियान सक्रिय गर्ने",
    activateLockedHint: "बाँकी बुँदाहरू पनि पुष्टि गर्नुहोस्।",
    activatingState: "सक्रिय गर्दै...",
    successToast: "अभियान सक्रिय भयो।",
    demoSuccessToast: "डेमो अभियान सक्रिय भयो (स्थानीय)।",
    errorToast: "सक्रिय गर्न सकिएन। फेरि प्रयास गर्नुहोस्।",
    backendPendingToast:
      "ब्याकएन्ड समर्थन अझै तयार छैन — डेमो मा मात्र स्थिति परिवर्तन हुनेछ।",
    forbiddenToast: "तपाईं यस अभियानको संयोजक होइन।"
  },
  en: {
    eyebrow: "Campaign lead only — safety check",
    title: "Pre-event safety checklist",
    intro:
      "Before this campaign can go ACTIVE, confirm each item below. The lead must personally verify before ticking — these are real-world safety conditions, not paperwork.",
    items: [
      "Pre-execution review meeting completed; final participant roster locked.",
      "Medic / first-aid kit on site. Verified medic required for high-risk categories.",
      "Safety lead assigned; traffic and hazard points identified.",
      "Local permits / landowner consent confirmed in writing.",
      "Weather forecast reviewed; rain or heat contingency in place.",
      "Tools, water, masks, refreshments — all logistics ready.",
      "Participants re-notified of time and meetup location."
    ],
    requiredHint: "All {n} items must be ticked before the event can go live.",
    progress: "{checked} / {total} confirmed",
    activateCta: "Activate Campaign",
    activateLockedHint: "Tick the remaining items to enable activation.",
    activatingState: "Activating...",
    successToast: "Campaign is now active.",
    demoSuccessToast: "Demo campaign activated (local only).",
    errorToast: "Could not activate the campaign. Please try again.",
    backendPendingToast:
      "Backend activate endpoint is pending — demo state will reflect locally only.",
    forbiddenToast: "You are not the lead for this campaign."
  }
};

export function SafetyChecklistPanel({ event, language = "np", onActivated }) {
  const t = COPY[language] || COPY.np;
  const messageApi = useToast();

  const items = t.items;
  const totalItems = items.length;

  const [checked, setChecked] = useState(() => items.map(() => false));
  const [saving, setSaving] = useState(false);

  const checkedCount = useMemo(
    () => checked.filter(Boolean).length,
    [checked]
  );
  const allChecked = checkedCount === totalItems;

  const handleToggle = (index) => (e) => {
    setChecked((prev) => {
      const next = prev.slice();
      next[index] = e.target.checked;
      return next;
    });
  };

  const handleActivate = async () => {
    if (!allChecked || saving) return;
    setSaving(true);
    try {
      if (isDemoId(event?.id)) {
        await new Promise((resolve) => setTimeout(resolve, 350));
        messageApi.success(t.demoSuccessToast);
        onActivated?.({
          ...event,
          status: "ACTIVE",
          safetyChecklistCompletedAt: new Date().toISOString()
        });
        return;
      }

      try {
        await postJson(
          `/events/${event.id}/activate`,
          { checklistConfirmed: true },
          { requireAuth: true }
        );
        messageApi.success(t.successToast);
        onActivated?.();
      } catch (apiError) {
        if (apiError?.status === 404 || apiError?.status === 501) {
          messageApi.info(t.backendPendingToast);
          return;
        }
        if (apiError?.status === 403) {
          messageApi.error(t.forbiddenToast);
          return;
        }
        throw apiError;
      }
    } catch (error) {
      messageApi.error(error?.message || t.errorToast);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="safety-checklist-panel" aria-labelledby="safety-checklist-title">
      <header className="safety-checklist-header">
        <span className="eyebrow">{t.eyebrow}</span>
        <h2 id="safety-checklist-title">
          <SafetyCertificateOutlined aria-hidden="true" />
          {t.title}
        </h2>
        <p>{t.intro}</p>
      </header>

      <ul className="safety-checklist-items">
        {items.map((label, i) => (
          <li
            key={i}
            className={`safety-checklist-item ${checked[i] ? "is-checked" : ""}`}
          >
            <Checkbox checked={checked[i]} onChange={handleToggle(i)} disabled={saving}>
              {label}
            </Checkbox>
          </li>
        ))}
      </ul>

      <footer className="safety-checklist-footer">
        <span className="safety-checklist-progress">
          {allChecked ? (
            <>
              <CheckCircleFilled aria-hidden="true" className="safety-checklist-progress-icon" />
              {t.progress
                .replace("{checked}", checkedCount)
                .replace("{total}", totalItems)}
            </>
          ) : (
            t.progress
              .replace("{checked}", checkedCount)
              .replace("{total}", totalItems)
          )}
        </span>
        <Button
          type="primary"
          size="large"
          disabled={!allChecked || saving}
          loading={saving}
          onClick={handleActivate}
          className="safety-checklist-activate-cta"
        >
          {saving ? t.activatingState : t.activateCta}
        </Button>
      </footer>
      {!allChecked ? (
        <p className="safety-checklist-hint">
          {t.requiredHint.replace("{n}", totalItems)}
        </p>
      ) : null}
    </section>
  );
}
