"use client";

import { useState } from "react";
import { ReloadOutlined, SettingOutlined } from "@ant-design/icons";
import { Button, Popover, Tooltip } from "antd";
import { ACCENT_PRESETS, usePreferences } from "@/app/providers";

const copy = {
  np: {
    triggerTooltip: "सेटिङ्स",
    theme: { label: "थिम", description: "रुचि अनुसार रूप।", light: "Light", dark: "Dark" },
    language: { label: "भाषा", description: "Public surfaces मा देखिने भाषा।", np: "नेपाली", en: "English" },
    accent: { label: "एसेन्ट रङ", description: "Buttons, links र badges को secondary रङ।" },
    reset: "Defaults मा फर्काउनुहोस्"
  },
  en: {
    triggerTooltip: "Settings",
    theme: { label: "Theme", description: "Match your preferred appearance.", light: "Light", dark: "Dark" },
    language: { label: "Language", description: "Used across public surfaces.", np: "नेपाली", en: "English" },
    accent: { label: "Accent Color", description: "Secondary tint for buttons, links, and badges." },
    reset: "Reset to defaults"
  }
};

export function SettingsPopover() {
  const { language, mode, accent, setLanguage, setMode, setAccent } = usePreferences();
  const [open, setOpen] = useState(false);
  const t = copy[language];

  const handleReset = () => {
    setMode("light");
    setLanguage("np");
    setAccent("ember");
  };

  const content = (
    <div className="settings-popover">
      <Section label={t.theme.label} description={t.theme.description}>
        <ChipGroup
          options={[
            { value: "light", label: t.theme.light },
            { value: "dark", label: t.theme.dark }
          ]}
          value={mode}
          onChange={setMode}
        />
      </Section>

      <Section label={t.language.label} description={t.language.description}>
        <ChipGroup
          options={[
            { value: "np", label: t.language.np },
            { value: "en", label: t.language.en }
          ]}
          value={language}
          onChange={setLanguage}
        />
      </Section>

      <Section label={t.accent.label} description={t.accent.description}>
        <div className="settings-popover-accents" role="radiogroup">
          {Object.entries(ACCENT_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={accent === key}
              aria-label={preset.name}
              title={preset.name}
              className={`accent-swatch${accent === key ? " is-active" : ""}`}
              style={{ background: preset.color }}
              onClick={() => setAccent(key)}
            />
          ))}
        </div>
      </Section>

      <div className="settings-popover-footer">
        <Button size="small" icon={<ReloadOutlined />} onClick={handleReset} type="text">
          {t.reset}
        </Button>
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      arrow={false}
      overlayClassName="settings-popover-overlay"
    >
      <Tooltip title={open ? null : t.triggerTooltip}>
        <Button aria-label={t.triggerTooltip} icon={<SettingOutlined />} />
      </Tooltip>
    </Popover>
  );
}

function Section({ label, description, children }) {
  return (
    <div className="settings-popover-section">
      <div className="settings-popover-section-head">
        <span className="settings-popover-label">{label}</span>
        {description ? (
          <span className="settings-popover-description">{description}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function ChipGroup({ options, value, onChange }) {
  return (
    <div className="settings-popover-chipgroup" role="radiogroup">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            className={`settings-popover-chip${active ? " is-active" : ""}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
