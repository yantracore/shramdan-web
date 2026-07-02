"use client";

// IncidentPanel — roadmap 4.2 + 4.3 + 4.5.
// Surfaces the per-event incident log to the leader / safety-lead /
// admin, with a report-new-incident modal. Public visitors see only
// an aggregate count + riskLevel summary + any publicNote.
//
// Demo events update local state through onChanged.
// Real events POST /events/{id}/incidents and PATCH per-incident.
// Backend endpoints pending; the UI degrades gracefully on 404/501.

import {
  ExclamationCircleOutlined,
  PlusOutlined,
  SafetyOutlined
} from "@ant-design/icons";
import { Button, Form, Input, Modal, Select, Tag } from "antd";
import { useMemo, useState, useSyncExternalStore } from "react";
import { postJson } from "@/lib/apiClient";
import { getAuthSession, subscribeAuthSession } from "@/lib/authSession";
import { useToast } from "@/lib/toast";

const isDemoId = (id) => typeof id === "string" && id.startsWith("demo-");

const INCIDENT_TYPES = [
  "INJURY",
  "THEFT",
  "CONFLICT",
  "LAND_PERMISSION",
  "WEATHER",
  "FLOOD",
  "PROPERTY_DAMAGE",
  "MISSING_PERSON",
  "LEGAL",
  "OTHER"
];

const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const SEVERITY_COLOR = {
  LOW: "default",
  MEDIUM: "gold",
  HIGH: "orange",
  CRITICAL: "red"
};

const STATUS_COLOR = {
  OPEN: "red",
  ACKNOWLEDGED: "orange",
  IN_PROGRESS: "gold",
  RESOLVED: "green",
  ESCALATED: "magenta",
  CLOSED: "default"
};

const COPY = {
  np: {
    eyebrow: "घटना ल्याज",
    title: "घटनाहरूको रेकर्ड",
    intro:
      "अभियानमा भएका सुरक्षा, मेडिकल, द्वन्द्व, अनुमति वा अरू कुनै सञ्चालन सम्बन्धी घटनाहरू यहाँ नोट गरिन्छ। सहभागीहरूले `escalate` गर्न पनि सक्छन्।",
    publicNoteHeading: "सार्वजनिक सुरक्षा सूचना",
    publicNoteEmpty: "अहिले कुनै सार्वजनिक सूचना छैन।",
    summaryHeading: "घटना सारांश",
    summaryOpen: "{n} खुला",
    summaryTotal: "जम्मा {n}",
    riskLabel: "जोखिम स्तर",
    reportCta: "नयाँ घटना दर्ता",
    leaderOnlyHint: "विस्तृत विवरण संयोजक र सुरक्षा प्रमुखले मात्र हेर्न सक्छन्।",
    publicEmpty: "अहिले कुनै घटना दर्ता छैन।",
    leaderEmpty: "अभियानमा अहिलेसम्म घटना छैन।",
    modalTitle: "घटना दर्ता गर्नुहोस्",
    modalIntro:
      "के भयो छोटकरीमा भन्नुहोस्। संयोजक र सुरक्षा प्रमुखले तुरुन्त हेर्नेछन्।",
    typeLabel: "प्रकार",
    severityLabel: "गम्भीरता",
    descriptionLabel: "के भयो (विवरण)",
    descriptionPlaceholder:
      "उदाहरण: सडक छेउ हिलोमा एक जना सहभागी चिप्लिएर परे; प्राथमिक उपचार चाहिएको छ।",
    locationLabel: "स्थान (वैकल्पिक)",
    locationPlaceholder: "उदाहरण: नदी किनार उत्तरी छेउ",
    submit: "दर्ता",
    cancel: "रद्द",
    requiredField: "अनिवार्य फिल्ड",
    successToast: "घटना दर्ता भयो। संयोजकलाई सूचना गयो।",
    demoSuccessToast: "डेमो घटना दर्ता भयो (स्थानीय)।",
    errorToast: "दर्ता गर्न सकिएन। फेरि प्रयास गर्नुहोस्।",
    backendPendingToast:
      "ब्याकएन्ड समर्थन अझै तयार छैन — स्थानीय रूपमा सुरक्षित।",
    types: {
      INJURY: "चोटपटक",
      THEFT: "चोरी",
      CONFLICT: "द्वन्द्व",
      LAND_PERMISSION: "जग्गा अनुमति",
      WEATHER: "मौसम",
      FLOOD: "बाढी",
      PROPERTY_DAMAGE: "सम्पत्ति क्षति",
      MISSING_PERSON: "हराएको व्यक्ति",
      LEGAL: "कानुनी",
      OTHER: "अन्य"
    },
    severities: {
      LOW: "सानो",
      MEDIUM: "मध्यम",
      HIGH: "उच्च",
      CRITICAL: "अत्यन्त गम्भीर"
    },
    statuses: {
      OPEN: "खुला",
      ACKNOWLEDGED: "थाहा भयो",
      IN_PROGRESS: "हेर्दै",
      RESOLVED: "समाधान",
      ESCALATED: "माथिल्लो तह",
      CLOSED: "बन्द"
    }
  },
  en: {
    eyebrow: "Incident log",
    title: "Incident record",
    intro:
      "Safety, medical, conflict, permission, or other operational incidents during the event are recorded here. Participants can also `escalate`.",
    publicNoteHeading: "Public safety notice",
    publicNoteEmpty: "No public notice posted.",
    summaryHeading: "Incident summary",
    summaryOpen: "{n} open",
    summaryTotal: "{n} total",
    riskLabel: "Risk level",
    reportCta: "Report incident",
    leaderOnlyHint:
      "Detailed reports are visible only to the leader, safety lead, and admins.",
    publicEmpty: "No incidents recorded.",
    leaderEmpty: "No incidents yet for this event.",
    modalTitle: "Report an incident",
    modalIntro:
      "Tell us what happened in a few lines. The leader and safety lead will be notified.",
    typeLabel: "Type",
    severityLabel: "Severity",
    descriptionLabel: "What happened",
    descriptionPlaceholder:
      "e.g. A participant slipped on the muddy bank and needs first aid.",
    locationLabel: "Location note (optional)",
    locationPlaceholder: "e.g. North end of the riverbank",
    submit: "Report",
    cancel: "Cancel",
    requiredField: "Required",
    successToast: "Incident reported. Leader has been notified.",
    demoSuccessToast: "Demo incident reported (local only).",
    errorToast: "Could not report. Please try again.",
    backendPendingToast:
      "Backend endpoint is pending — saved locally for the demo.",
    types: {
      INJURY: "Injury",
      THEFT: "Theft",
      CONFLICT: "Conflict",
      LAND_PERMISSION: "Land permission",
      WEATHER: "Weather",
      FLOOD: "Flood",
      PROPERTY_DAMAGE: "Property damage",
      MISSING_PERSON: "Missing person",
      LEGAL: "Legal",
      OTHER: "Other"
    },
    severities: {
      LOW: "Low",
      MEDIUM: "Medium",
      HIGH: "High",
      CRITICAL: "Critical"
    },
    statuses: {
      OPEN: "Open",
      ACKNOWLEDGED: "Acknowledged",
      IN_PROGRESS: "In progress",
      RESOLVED: "Resolved",
      ESCALATED: "Escalated",
      CLOSED: "Closed"
    }
  }
};

function deriveRiskLevel(incidents) {
  if (!Array.isArray(incidents) || incidents.length === 0) return "NORMAL";
  const open = incidents.filter(
    (i) => !["RESOLVED", "CLOSED"].includes(i.status)
  );
  if (open.some((i) => i.severity === "CRITICAL")) return "CRITICAL";
  if (open.some((i) => i.severity === "HIGH")) return "URGENT";
  if (open.some((i) => i.severity === "MEDIUM")) return "WATCH";
  return "NORMAL";
}

export function IncidentPanel({ event, language = "np", canSeeFull, onChanged }) {
  const t = COPY[language] || COPY.np;
  const session = useSyncExternalStore(subscribeAuthSession, getAuthSession, () => null);
  const messageApi = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const incidents = useMemo(
    () => (Array.isArray(event?.incidents) ? event.incidents : []),
    [event?.incidents]
  );
  const openCount = useMemo(
    () =>
      incidents.filter((i) => !["RESOLVED", "CLOSED"].includes(i.status)).length,
    [incidents]
  );
  const totalCount = incidents.length;
  const derivedRisk = useMemo(() => deriveRiskLevel(incidents), [incidents]);
  const riskLevel = event?.riskLevel || derivedRisk;
  const publicNote = event?.publicSafetyNote || null;

  const isAuthenticated = Boolean(session?.user?.id);

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      const payload = {
        type: values.type,
        severity: values.severity,
        description: values.description.trim(),
        ...(values.locationNote ? { locationNote: values.locationNote.trim() } : {})
      };
      const optimistic = {
        id: `inc-${Date.now()}`,
        eventId: event?.id,
        ...payload,
        status: "OPEN",
        reportedByName: session?.user?.name || "—",
        createdAt: new Date().toISOString()
      };
      const nextIncidents = [optimistic, ...incidents];
      const nextRiskLevel = deriveRiskLevel(nextIncidents);

      if (isDemoId(event?.id)) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        messageApi.success(t.demoSuccessToast);
        setOpen(false);
        form.resetFields();
        onChanged?.({
          ...event,
          incidents: nextIncidents,
          riskLevel: nextRiskLevel
        });
        return;
      }
      try {
        await postJson(`/events/${event.id}/incidents`, payload, {
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
          onChanged?.({
            ...event,
            incidents: nextIncidents,
            riskLevel: nextRiskLevel
          });
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
    <section className="incident-panel" aria-labelledby="incident-panel-title">
      <header className="incident-panel-header">
        <span className="eyebrow">
          <SafetyOutlined aria-hidden="true" /> {t.eyebrow}
        </span>
        <h2 id="incident-panel-title">{t.title}</h2>
        <p>{t.intro}</p>
      </header>

      <div className="incident-panel-summary">
        <div className="incident-panel-summary-item">
          <span className="incident-panel-summary-label">{t.riskLabel}</span>
          <Tag
            color={
              riskLevel === "CRITICAL"
                ? "red"
                : riskLevel === "URGENT"
                  ? "orange"
                  : riskLevel === "WATCH"
                    ? "gold"
                    : "green"
            }
          >
            {riskLevel}
          </Tag>
        </div>
        <div className="incident-panel-summary-item">
          <span className="incident-panel-summary-label">{t.summaryHeading}</span>
          <span>
            {t.summaryOpen.replace("{n}", openCount)} · {t.summaryTotal.replace("{n}", totalCount)}
          </span>
        </div>
        {isAuthenticated ? (
          <Button
            type="primary"
            danger
            icon={<PlusOutlined />}
            onClick={() => setOpen(true)}
          >
            {t.reportCta}
          </Button>
        ) : null}
      </div>

      {publicNote ? (
        <div className="incident-panel-public-note" role="status">
          <strong>{t.publicNoteHeading}:</strong> {publicNote}
        </div>
      ) : null}

      {!canSeeFull ? (
        <p className="incident-panel-leader-hint">{t.leaderOnlyHint}</p>
      ) : null}

      {canSeeFull ? (
        incidents.length === 0 ? (
          <p className="incident-panel-empty">{t.leaderEmpty}</p>
        ) : (
          <ul className="incident-panel-list">
            {incidents.map((incident) => (
              <li key={incident.id} className="incident-panel-row">
                <div className="incident-panel-row-tags">
                  <Tag color={SEVERITY_COLOR[incident.severity] || "default"}>
                    {t.severities[incident.severity] || incident.severity}
                  </Tag>
                  <Tag>{t.types[incident.type] || incident.type}</Tag>
                  <Tag color={STATUS_COLOR[incident.status] || "default"}>
                    {t.statuses[incident.status] || incident.status}
                  </Tag>
                </div>
                <p className="incident-panel-row-description">
                  <ExclamationCircleOutlined aria-hidden="true" />{" "}
                  {incident.description}
                </p>
                {incident.locationNote ? (
                  <p className="incident-panel-row-location">
                    {incident.locationNote}
                  </p>
                ) : null}
                {incident.reportedByName ? (
                  <p className="incident-panel-row-reporter">
                    — {incident.reportedByName}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )
      ) : null}

      <Modal
        open={open}
        title={t.modalTitle}
        onCancel={() => (saving ? null : setOpen(false))}
        onOk={() => form.submit()}
        okText={t.submit}
        cancelText={t.cancel}
        confirmLoading={saving}
        width={560}
        okButtonProps={{ danger: true }}
      >
        <p className="incident-panel-modal-intro">{t.modalIntro}</p>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ type: "OTHER", severity: "MEDIUM" }}
          disabled={saving}
        >
          <Form.Item
            label={t.typeLabel}
            name="type"
            rules={[{ required: true, message: t.requiredField }]}
          >
            <Select
              options={INCIDENT_TYPES.map((value) => ({
                value,
                label: t.types[value] || value
              }))}
            />
          </Form.Item>
          <Form.Item
            label={t.severityLabel}
            name="severity"
            rules={[{ required: true, message: t.requiredField }]}
          >
            <Select
              options={SEVERITIES.map((value) => ({
                value,
                label: t.severities[value] || value
              }))}
            />
          </Form.Item>
          <Form.Item
            label={t.descriptionLabel}
            name="description"
            rules={[{ required: true, whitespace: true, message: t.requiredField }]}
          >
            <Input.TextArea
              rows={4}
              placeholder={t.descriptionPlaceholder}
              maxLength={1500}
              showCount
            />
          </Form.Item>
          <Form.Item label={t.locationLabel} name="locationNote">
            <Input placeholder={t.locationPlaceholder} maxLength={240} />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  );
}
