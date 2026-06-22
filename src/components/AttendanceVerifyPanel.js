"use client";

// AttendanceVerifyPanel — roadmap 7.4.
// Photographer / leader confirms which roster members were actually
// present at a COMPLETED event. The current build uses a manual
// tri-state per member (saw / missed / unsure); a future enhancement
// is photo-AI cross-check. Demo state stays local; real flow will
// POST /events/{id}/attendance/verifications.

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
  SafetyOutlined
} from "@ant-design/icons";
import { Button } from "antd";
import { useMemo, useState } from "react";
import { useToast } from "@/lib/toast";

const COPY = {
  np: {
    eyebrow: "उपस्थिति पुष्टि",
    title: "सहभागिता पुष्टिकरण",
    intro:
      "अभियानको दिन तपाईंले कुन सहभागीलाई देख्नुभयो भनेर पुष्टि गर्नुहोस्। यो रेकर्डले प्रमाणपत्र, क्रेडिट र भविष्यका भूमिका छनोटमा सहयोग गर्छ।",
    saw: "देखेँ",
    missed: "देखिनँ",
    unsure: "अनिश्चित",
    saveCta: "पुष्टि सुरक्षित गर्नुहोस्",
    summary: "{seen} पुष्टि · {missed} अनुपस्थित · {unsure} अनिश्चित",
    successToast: "उपस्थिति पुष्टिकरण सुरक्षित भयो (स्थानीय)।",
    emptyState: "रोस्टरमा भरिएको सहभागी छैन।",
    rolesLabel: {
      WORKER: "सफाइकर्मी",
      PHOTOGRAPHER: "फोटोग्राफर",
      LIVESTREAMER: "लाइभस्ट्रिमर",
      MEDIC: "स्वास्थ्यकर्मी",
      SAFETY_LEAD: "सुरक्षा प्रमुख",
      COORDINATOR: "संयोजक",
      LOGISTICS: "लजिस्टिक्स"
    }
  },
  en: {
    eyebrow: "Attendance verify",
    title: "Confirm attendance",
    intro:
      "Confirm which roster members were actually present at the event. This record supports certificates, credit, and future role decisions.",
    saw: "Saw",
    missed: "Missed",
    unsure: "Unsure",
    saveCta: "Save verifications",
    summary: "{seen} confirmed · {missed} missed · {unsure} unsure",
    successToast: "Attendance verifications saved (local).",
    emptyState: "No roster members filled.",
    rolesLabel: {
      WORKER: "Cleaner",
      PHOTOGRAPHER: "Photographer",
      LIVESTREAMER: "Livestreamer",
      MEDIC: "Medic",
      SAFETY_LEAD: "Safety lead",
      COORDINATOR: "Coordinator",
      LOGISTICS: "Logistics"
    }
  }
};

const STATES = ["unsure", "saw", "missed"];

export function AttendanceVerifyPanel({ event, language = "np", onChanged }) {
  const t = COPY[language] || COPY.np;
  const messageApi = useToast();

  // Flatten rolesNeeded → [{role, name}] list of filled slots.
  const rosterEntries = useMemo(() => {
    const out = [];
    (event?.rolesNeeded || []).forEach((row) => {
      (row.filledNames || []).forEach((name) => {
        out.push({ role: row.role, name });
      });
    });
    return out;
  }, [event?.rolesNeeded]);

  const [verifications, setVerifications] = useState(() =>
    rosterEntries.reduce((acc, entry) => {
      acc[`${entry.role}:${entry.name}`] = "unsure";
      return acc;
    }, {})
  );
  const [saving, setSaving] = useState(false);

  const summary = useMemo(() => {
    let seen = 0;
    let missed = 0;
    let unsure = 0;
    Object.values(verifications).forEach((state) => {
      if (state === "saw") seen += 1;
      else if (state === "missed") missed += 1;
      else unsure += 1;
    });
    return { seen, missed, unsure };
  }, [verifications]);

  if (rosterEntries.length === 0) {
    return (
      <section className="attendance-verify-panel">
        <p className="attendance-verify-empty">{t.emptyState}</p>
      </section>
    );
  }

  const setState = (key, state) => {
    setVerifications((prev) => ({ ...prev, [key]: state }));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    setSaving(false);
    messageApi.success(t.successToast);
    onChanged?.({
      ...event,
      attendanceVerifications: { ...verifications, _confirmedAt: new Date().toISOString() }
    });
  };

  return (
    <section
      className="attendance-verify-panel"
      aria-labelledby="attendance-verify-title"
    >
      <header className="attendance-verify-header">
        <span className="eyebrow">
          <SafetyOutlined aria-hidden="true" /> {t.eyebrow}
        </span>
        <h2 id="attendance-verify-title">{t.title}</h2>
        <p>{t.intro}</p>
      </header>

      <ul className="attendance-verify-list">
        {rosterEntries.map((entry) => {
          const key = `${entry.role}:${entry.name}`;
          const state = verifications[key];
          return (
            <li key={key} className={`attendance-verify-row state-${state}`}>
              <div className="attendance-verify-row-meta">
                <strong>{entry.name}</strong>
                <span>{t.rolesLabel[entry.role] || entry.role}</span>
              </div>
              <div className="attendance-verify-row-actions" role="radiogroup">
                {STATES.map((s) => {
                  const icon =
                    s === "saw" ? (
                      <CheckCircleOutlined aria-hidden="true" />
                    ) : s === "missed" ? (
                      <CloseCircleOutlined aria-hidden="true" />
                    ) : (
                      <QuestionCircleOutlined aria-hidden="true" />
                    );
                  return (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={state === s}
                      className={`attendance-verify-pill is-${s} ${state === s ? "is-selected" : ""}`}
                      onClick={() => setState(key, s)}
                      disabled={saving}
                    >
                      {icon} {t[s]}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>

      <footer className="attendance-verify-footer">
        <span className="attendance-verify-summary">
          {t.summary
            .replace("{seen}", summary.seen)
            .replace("{missed}", summary.missed)
            .replace("{unsure}", summary.unsure)}
        </span>
        <Button type="primary" onClick={handleSave} loading={saving}>
          {t.saveCta}
        </Button>
      </footer>
    </section>
  );
}
