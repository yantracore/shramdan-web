"use client";

import { Card, Radio, Switch, Typography } from "antd";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";

const { Title, Paragraph, Text } = Typography;

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
    motion: {
      title: "Motion",
      entrance: {
        label: "Entrance animations",
        description:
          "Sections र cards viewport मा आउँदा soft fade + slide। बन्द गर्नुभए सबै कुरा तुरुन्तै देखिनेछ।"
      }
    },
    live: {
      title: "Live indicators",
      iconSize: {
        label: "LIVE icon size",
        description: "Event cards र thumbnails मा LIVE badge को आकार।",
        sm: "सानो",
        md: "मध्यम",
        lg: "ठूलो"
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
    motion: {
      title: "Motion",
      entrance: {
        label: "Entrance animations",
        description:
          "Sections and cards fade-and-slide softly as they enter the viewport. Turn off for instant content."
      }
    },
    live: {
      title: "Live indicators",
      iconSize: {
        label: "LIVE icon size",
        description: "Size of the LIVE badge on event cards and thumbnails.",
        sm: "Small",
        md: "Medium",
        lg: "Large"
      }
    },
    note: "These settings save locally in your browser. Account sync is planned for the future."
  }
};

export default function SettingsPage() {
  const {
    language,
    mode,
    entranceAnimation,
    liveIconSize,
    setLanguage,
    setMode,
    setEntranceAnimation,
    setLiveIconSize
  } = usePreferences();
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

        <Card title={t.motion.title} style={{ marginBottom: 16 }}>
          <SettingRow
            label={t.motion.entrance.label}
            description={t.motion.entrance.description}
            control={
              <Switch
                checked={entranceAnimation}
                onChange={(checked) => setEntranceAnimation(checked)}
              />
            }
          />
        </Card>

        <Card title={t.live.title} style={{ marginBottom: 16 }}>
          <SettingRow
            label={t.live.iconSize.label}
            description={t.live.iconSize.description}
            control={
              <Radio.Group
                value={liveIconSize}
                onChange={(e) => setLiveIconSize(e.target.value)}
                optionType="button"
                options={[
                  { label: t.live.iconSize.sm, value: "sm" },
                  { label: t.live.iconSize.md, value: "md" },
                  { label: t.live.iconSize.lg, value: "lg" }
                ]}
              />
            }
          />
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
