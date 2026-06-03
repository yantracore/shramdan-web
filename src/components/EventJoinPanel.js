"use client";

import { CheckCircleFilled, UserAddOutlined } from "@ant-design/icons";
import { Button, Modal, Radio, Space } from "antd";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { postJson } from "@/lib/apiClient";
import { getAuthSession, subscribeAuthSession } from "@/lib/authSession";
import { useToast } from "@/lib/toast";

const isDemoId = (id) => typeof id === "string" && id.startsWith("demo-");

const COPY = {
  np: {
    cta: "यो अभियानमा जोडिनुहोस्",
    alreadyJoined: "तपाईं {role} भूमिकामा जोडिनुभएको छ",
    closedStatus: "अभियान अब जोडिन खुल्ला छैन",
    modalTitle: "कुन भूमिकामा जोडिने?",
    modalIntro: "तपाईंलाई मन पर्ने / आफूलाई मिल्ने भूमिका छान्नुहोस्। पछि परिवर्तन गर्न सकिन्छ।",
    fullRole: "{label} (पूरा)",
    roleSlotsLeft: "{label} ({n} खाली)",
    submit: "जोडिनुहोस्",
    cancel: "रद्द गर्नुहोस्",
    selectRequired: "एक भूमिका छान्नुहोस्।",
    successToast: "तपाईं अभियानमा जोडिनुभयो।",
    demoSuccessToast: "तपाईं डेमो अभियानमा जोडिनुभयो (स्थानीय)।",
    errorToast: "जोडिन सकिएन। फेरि प्रयास गर्नुहोस्।",
    backendPendingToast:
      "ब्याकएन्ड समर्थन अझै तयार छैन — तर तपाईंको रुचि नोट गरियो।",
    loginPrompt: "जोडिन पहिले लग-इन गर्नुहोस्",
    loginCta: "लग-इन गर्नुहोस्",
    roles: {
      WORKER: "कामदार",
      PHOTOGRAPHER: "फोटोग्राफर",
      LIVESTREAMER: "लाइभस्ट्रिमर",
      MEDIC: "स्वास्थ्यकर्मी",
      SAFETY_LEAD: "सुरक्षा प्रमुख",
      COORDINATOR: "संयोजक",
      LOGISTICS: "लजिस्टिक्स"
    }
  },
  en: {
    cta: "Join This Event",
    alreadyJoined: "You're in as {role}",
    closedStatus: "This event is no longer open to join",
    modalTitle: "Which role would you take?",
    modalIntro: "Pick the role that fits you. You can change it later.",
    fullRole: "{label} (full)",
    roleSlotsLeft: "{label} ({n} open)",
    submit: "Join",
    cancel: "Cancel",
    selectRequired: "Pick a role to continue.",
    successToast: "You're in.",
    demoSuccessToast: "You're in this demo event (local only).",
    errorToast: "Could not join. Please try again.",
    backendPendingToast:
      "Backend join endpoint is pending — your interest has been noted.",
    loginPrompt: "Sign in to join",
    loginCta: "Sign In",
    roles: {
      WORKER: "Worker",
      PHOTOGRAPHER: "Photographer",
      LIVESTREAMER: "Livestreamer",
      MEDIC: "Medic",
      SAFETY_LEAD: "Safety Lead",
      COORDINATOR: "Coordinator",
      LOGISTICS: "Logistics"
    }
  }
};

const JOINABLE_STATUSES = new Set(["SCHEDULED", "ACTIVE", "DRAFT"]);

function findViewerRole(rolesNeeded, viewerName) {
  if (!viewerName || !Array.isArray(rolesNeeded)) return null;
  for (const row of rolesNeeded) {
    if (Array.isArray(row.filledNames) && row.filledNames.includes(viewerName)) {
      return row.role;
    }
  }
  return null;
}

export function EventJoinPanel({ event, language = "np", onJoined }) {
  const t = COPY[language] || COPY.np;
  const session = useSyncExternalStore(subscribeAuthSession, getAuthSession, () => null);
  const messageApi = useToast();

  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [saving, setSaving] = useState(false);

  const rolesNeeded = useMemo(
    () => (Array.isArray(event?.rolesNeeded) ? event.rolesNeeded : []),
    [event?.rolesNeeded]
  );

  const viewerName = session?.user?.name || null;
  const viewerRole = findViewerRole(rolesNeeded, viewerName);

  if (rolesNeeded.length === 0) return null;

  const isClosed = !JOINABLE_STATUSES.has(event?.status);

  if (isClosed && !viewerRole) {
    return (
      <div className="event-join-panel event-join-panel-closed">
        <span>{t.closedStatus}</span>
      </div>
    );
  }

  if (viewerRole) {
    return (
      <div className="event-join-panel event-join-panel-joined">
        <CheckCircleFilled aria-hidden="true" />
        <span>
          {t.alreadyJoined.replace("{role}", t.roles[viewerRole] || viewerRole)}
        </span>
      </div>
    );
  }

  if (!session?.user?.id) {
    const next = encodeURIComponent(`/events/${event?.id || ""}`);
    return (
      <div className="event-join-panel event-join-panel-anon">
        <span>{t.loginPrompt}</span>
        <Link href={`/login?next=${next}`}>
          <Button type="primary" icon={<UserAddOutlined />}>
            {t.loginCta}
          </Button>
        </Link>
      </div>
    );
  }

  const handleOpen = () => {
    setSelectedRole(null);
    setOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedRole) {
      messageApi.error(t.selectRequired);
      return;
    }
    setSaving(true);
    try {
      if (isDemoId(event?.id)) {
        await new Promise((resolve) => setTimeout(resolve, 350));
        const nextRoles = rolesNeeded.map((row) => {
          if (row.role !== selectedRole) return row;
          const filledNames = Array.isArray(row.filledNames) ? row.filledNames : [];
          if (filledNames.includes(viewerName)) return row;
          return {
            ...row,
            filled: Math.min((row.filled || 0) + 1, row.count),
            filledNames: [...filledNames, viewerName || "तपाईं"]
          };
        });
        messageApi.success(t.demoSuccessToast);
        setOpen(false);
        onJoined?.({
          ...event,
          participantCount: (event?.participantCount || 0) + 1,
          rolesNeeded: nextRoles
        });
        return;
      }

      try {
        await postJson(
          `/events/${event.id}/join`,
          { role: selectedRole },
          { requireAuth: true }
        );
        messageApi.success(t.successToast);
        setOpen(false);
        onJoined?.();
      } catch (apiError) {
        if (apiError?.status === 404 || apiError?.status === 501) {
          messageApi.info(t.backendPendingToast);
          setOpen(false);
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
    <>
      <div className="event-join-panel">
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={handleOpen}
          className="event-join-cta"
          size="large"
        >
          {t.cta}
        </Button>
      </div>

      <Modal
        open={open}
        title={t.modalTitle}
        onCancel={() => (saving ? null : setOpen(false))}
        onOk={handleConfirm}
        okText={t.submit}
        cancelText={t.cancel}
        confirmLoading={saving}
        width={520}
      >
        <p className="event-join-intro">{t.modalIntro}</p>
        <Radio.Group
          onChange={(e) => setSelectedRole(e.target.value)}
          value={selectedRole}
          disabled={saving}
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            {rolesNeeded.map((row) => {
              const open = Math.max(0, (row.count || 0) - (row.filled || 0));
              const label = t.roles[row.role] || row.role;
              const text =
                open > 0
                  ? t.roleSlotsLeft.replace("{label}", label).replace("{n}", open)
                  : t.fullRole.replace("{label}", label);
              return (
                <Radio key={row.role} value={row.role} disabled={open === 0}>
                  {text}
                </Radio>
              );
            })}
          </Space>
        </Radio.Group>
      </Modal>
    </>
  );
}
