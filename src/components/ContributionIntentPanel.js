"use client";

// ContributionIntentPanel — roadmap 5.1 / 5.2 / 5.3.
// Lets a member declare a non-cash contribution intent on an event
// (labour-time / materials / logistics). Phase 5.4 fund donations
// (Esewa, Khalti, bank, foreign) are intentionally NOT here — they
// need real payment integration; this panel covers the three intent
// channels that don't.
//
// Demo events update local state. Real events POST to
// /events/{id}/contributions and degrade gracefully on 404/501.

import { GiftOutlined, ToolOutlined, TruckOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Radio, Space } from "antd";
import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { postJson } from "@/lib/apiClient";
import { getAuthSession, subscribeAuthSession } from "@/lib/authSession";
import { useToast } from "@/lib/toast";

const isDemoId = (id) => typeof id === "string" && id.startsWith("demo-");

const INTENT_KINDS = [
  { value: "LABOR", icon: ToolOutlined },
  { value: "MATERIALS", icon: GiftOutlined },
  { value: "LOGISTICS", icon: TruckOutlined }
];

const COPY = {
  np: {
    eyebrow: "योगदान",
    title: "तपाईंले के दिनसक्नुहुन्छ?",
    intro:
      "श्रम, सामग्री वा ढुवानी — कुनै पनि तरिकाले अभियानमा सहयोग गर्न सक्नुहुन्छ। संयोजकसँग समन्वय गर्न प्रस्ताव लेखेर पठाउनुहोस्।",
    kindLabor: "श्रम / समय",
    kindLaborHint: "कति घण्टा वा कुन भूमिकामा सहयोग गर्न सकिने।",
    kindMaterials: "सामग्री",
    kindMaterialsHint: "औजार, पन्जा, पानी, खाजा वा अरू कुनै सामान।",
    kindLogistics: "ढुवानी / लजिस्टिक्स",
    kindLogisticsHint: "गाडी, ट्रक, यातायात व्यवस्था वा भण्डारण।",
    openCta: "योगदान प्रस्ताव",
    loginPrompt: "योगदान दिन पहिले लग-इन गर्नुहोस्",
    loginCta: "लग-इन",
    modalTitle: "योगदान प्रस्ताव",
    modalIntro:
      "तपाईंले के दिनसक्नुहुन्छ छनोट गर्नुहोस् र विवरण लेख्नुहोस्। संयोजकले हेर्नेछन्।",
    kindLabel: "योगदानको प्रकार",
    quantityLabel: "अनुमानित मात्रा (वैकल्पिक)",
    quantityPlaceholder: "उदाहरण: ३ घण्टा, १० पन्जा, १ गाडी",
    notesLabel: "थप विवरण",
    notesPlaceholder:
      "तपाईं कहिले उपलब्ध हुनुहुन्छ, कुन विशेष सीप छ, अरू केही जानकारी।",
    submit: "पठाउनुहोस्",
    cancel: "रद्द",
    requiredField: "अनिवार्य",
    successToast: "तपाईंको प्रस्ताव संयोजकलाई पुग्यो।",
    demoSuccessToast: "डेमो मा प्रस्ताव दर्ता भयो (स्थानीय)।",
    backendPendingToast:
      "ब्याकएन्ड समर्थन अझै तयार छैन — स्थानीय रूपमा सुरक्षित।",
    errorToast: "पठाउन सकिएन। फेरि प्रयास गर्नुहोस्।",
    countSuffix: "{n} प्रस्ताव दर्ता"
  },
  en: {
    eyebrow: "Contribute",
    title: "What can you offer?",
    intro:
      "Labour, materials, or logistics — pick a way to back this campaign and the leader will reach out to coordinate.",
    kindLabor: "Labour / time",
    kindLaborHint: "Hours you can show up, or a role you can take on.",
    kindMaterials: "Materials",
    kindMaterialsHint: "Tools, gloves, water, food, or other supplies.",
    kindLogistics: "Logistics / transport",
    kindLogisticsHint: "Vehicles, transport coordination, or storage.",
    openCta: "Offer to contribute",
    loginPrompt: "Sign in to contribute",
    loginCta: "Sign in",
    modalTitle: "Offer to contribute",
    modalIntro:
      "Pick what you can offer and add any details. The campaign leader will see this.",
    kindLabel: "Contribution type",
    quantityLabel: "Estimated amount (optional)",
    quantityPlaceholder: "e.g. 3 hours, 10 gloves, 1 vehicle",
    notesLabel: "Details",
    notesPlaceholder: "When you're available, any special skill, anything else.",
    submit: "Send offer",
    cancel: "Cancel",
    requiredField: "Required",
    successToast: "Your offer has reached the leader.",
    demoSuccessToast: "Offer recorded in demo (local only).",
    backendPendingToast: "Backend endpoint pending — saved locally for the demo.",
    errorToast: "Could not send. Please try again.",
    countSuffix: "{n} offers in"
  }
};

const OPEN_STATUSES = new Set(["DRAFT", "SCHEDULED", "ACTIVE"]);

export function ContributionIntentPanel({ event, language = "np", onChanged }) {
  const t = COPY[language] || COPY.np;
  const session = useSyncExternalStore(subscribeAuthSession, getAuthSession, () => null);
  const messageApi = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const contributions = useMemo(
    () => (Array.isArray(event?.contributions) ? event.contributions : []),
    [event?.contributions]
  );
  const totalCount = contributions.length;

  if (!OPEN_STATUSES.has(event?.status)) return null;

  const isAuthenticated = Boolean(session?.user?.id);

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      const payload = {
        kind: values.kind,
        quantity: values.quantity ? values.quantity.trim() : null,
        notes: values.notes ? values.notes.trim() : null
      };
      const optimistic = {
        id: `contrib-${Date.now()}`,
        memberId: session?.user?.id,
        memberName: session?.user?.name || "—",
        ...payload,
        createdAt: new Date().toISOString()
      };
      const nextContributions = [optimistic, ...contributions];

      if (isDemoId(event?.id)) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        messageApi.success(t.demoSuccessToast);
        setOpen(false);
        form.resetFields();
        onChanged?.({ ...event, contributions: nextContributions });
        return;
      }
      try {
        await postJson(`/events/${event.id}/contributions`, payload, {
          requireAuth: true
        });
        messageApi.success(t.successToast);
        setOpen(false);
        form.resetFields();
        onChanged?.();
      } catch (apiError) {
        if (apiError?.status === 404 || apiError?.status === 501) {
          messageApi.info(t.backendPendingToast);
          setOpen(false);
          form.resetFields();
          onChanged?.({ ...event, contributions: nextContributions });
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
    <section className="contribution-intent-panel" aria-labelledby="contribution-intent-title">
      <header className="contribution-intent-header">
        <span className="eyebrow">{t.eyebrow}</span>
        <h2 id="contribution-intent-title">{t.title}</h2>
        <p>{t.intro}</p>
      </header>

      <ul className="contribution-intent-tiles" aria-hidden="true">
        {INTENT_KINDS.map(({ value, icon: Icon }) => {
          const label =
            value === "LABOR"
              ? t.kindLabor
              : value === "MATERIALS"
                ? t.kindMaterials
                : t.kindLogistics;
          const hint =
            value === "LABOR"
              ? t.kindLaborHint
              : value === "MATERIALS"
                ? t.kindMaterialsHint
                : t.kindLogisticsHint;
          return (
            <li key={value} className={`contribution-intent-tile contrib-${value.toLowerCase()}`}>
              <span className="contribution-intent-tile-icon">
                <Icon />
              </span>
              <strong>{label}</strong>
              <span className="contribution-intent-tile-hint">{hint}</span>
            </li>
          );
        })}
      </ul>

      <div className="contribution-intent-actions">
        {isAuthenticated ? (
          <Button type="primary" size="large" onClick={() => setOpen(true)}>
            {t.openCta}
          </Button>
        ) : (
          <div className="contribution-intent-anon">
            <span>{t.loginPrompt}</span>
            <Link
              href={`/login?next=${encodeURIComponent(`/events/${event?.id || ""}`)}`}
            >
              <Button type="primary">{t.loginCta}</Button>
            </Link>
          </div>
        )}
        {totalCount > 0 ? (
          <span className="contribution-intent-count">
            {t.countSuffix.replace("{n}", totalCount)}
          </span>
        ) : null}
      </div>

      <Modal
        open={open}
        title={t.modalTitle}
        onCancel={() => (saving ? null : setOpen(false))}
        onOk={() => form.submit()}
        okText={t.submit}
        cancelText={t.cancel}
        confirmLoading={saving}
        width={560}
      >
        <p className="contribution-intent-modal-intro">{t.modalIntro}</p>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ kind: "LABOR" }}
          disabled={saving}
        >
          <Form.Item
            label={t.kindLabel}
            name="kind"
            rules={[{ required: true, message: t.requiredField }]}
          >
            <Radio.Group>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Radio value="LABOR">
                  <strong>{t.kindLabor}</strong>
                  <br />
                  <span className="contribution-intent-radio-hint">{t.kindLaborHint}</span>
                </Radio>
                <Radio value="MATERIALS">
                  <strong>{t.kindMaterials}</strong>
                  <br />
                  <span className="contribution-intent-radio-hint">{t.kindMaterialsHint}</span>
                </Radio>
                <Radio value="LOGISTICS">
                  <strong>{t.kindLogistics}</strong>
                  <br />
                  <span className="contribution-intent-radio-hint">{t.kindLogisticsHint}</span>
                </Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
          <Form.Item label={t.quantityLabel} name="quantity">
            <Input placeholder={t.quantityPlaceholder} maxLength={120} />
          </Form.Item>
          <Form.Item
            label={t.notesLabel}
            name="notes"
            rules={[{ required: true, message: t.requiredField }]}
          >
            <Input.TextArea rows={4} placeholder={t.notesPlaceholder} maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  );
}
