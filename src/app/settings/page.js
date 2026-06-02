"use client";

import { Card, Radio, Typography } from "antd";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";

const { Title, Paragraph, Text } = Typography;

// Note: the "Motion" + "Live indicators" cards were removed by user
// request on 2026-06-02 for now. The underlying preferences
// (entranceAnimation, liveIconSize) are still tracked in providers.js
// and consumed at runtime — only the UI controls are hidden. To bring
// them back, restore the cards + Switch/Radio.Group blocks from
// git history (last seen in commit 191eca6).

const copy = {
  np: {
    pageTitle: "App Settings",
    pageSubtitle: "तपाईंको रुचि अनुसार अनुभव मिलाउनुहोस्।",
    appearance: {
      title: "Appearance",
      mode: {
        label: "Theme",
        description: "Light वा Dark मध्ये छनोट गर्नुहोस्।",
        light: "Light",
        dark: "Dark"
      },
      language: {
        label: "भाषा",
        description: "Public surfaces मा प्रयोग हुने भाषा।",
        np: "नेपाली",
        en: "English"
      }
    },
    note:
      "यी settings तपाईंको browser मा local रूपमा save हुन्छन्। भविष्यमा accounts सँग sync गर्ने योजना छ।"
  },
  en: {
    pageTitle: "App Settings",
    pageSubtitle: "Tune the experience to your taste.",
    appearance: {
      title: "Appearance",
      mode: {
        label: "Theme",
        description: "Light or Dark.",
        light: "Light",
        dark: "Dark"
      },
      language: {
        label: "Language",
        description: "Used across public surfaces.",
        np: "नेपाली",
        en: "English"
      }
    },
    note: "These settings save locally in your browser. Account sync is planned for the future."
  }
};

export default function SettingsPage() {
  const { language, mode, setLanguage, setMode } = usePreferences();
  const t = copy[language];

  return (
    <SiteShell>
      <section className="page-section">
        <header style={{ marginBottom: 24 }}>
          <Title level={1} style={{ marginBottom: 4 }}>
            {t.pageTitle}
          </Title>
          <Paragraph style={{ marginBottom: 0, opacity: 0.8 }}>{t.pageSubtitle}</Paragraph>
        </header>

        <Card title={t.appearance.title} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 24, flexDirection: "column" }}>
            <SettingRow
              label={t.appearance.mode.label}
              description={t.appearance.mode.description}
              control={
                <Radio.Group
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  optionType="button"
                  options={[
                    { label: t.appearance.mode.light, value: "light" },
                    { label: t.appearance.mode.dark, value: "dark" }
                  ]}
                />
              }
            />
            <SettingRow
              label={t.appearance.language.label}
              description={t.appearance.language.description}
              control={
                <Radio.Group
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  optionType="button"
                  options={[
                    { label: t.appearance.language.np, value: "np" },
                    { label: t.appearance.language.en, value: "en" }
                  ]}
                />
              }
            />
          </div>
        </Card>

        <Text type="secondary" style={{ display: "block", marginTop: 16 }}>
          {t.note}
        </Text>
      </section>
    </SiteShell>
  );
}

function SettingRow({ label, description, control }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap"
      }}
    >
      <div style={{ flex: 1, minWidth: 240 }}>
        <Text strong style={{ display: "block", marginBottom: 2 }}>
          {label}
        </Text>
        <Text type="secondary" style={{ fontSize: 13 }}>
          {description}
        </Text>
      </div>
      <div>{control}</div>
    </div>
  );
}
