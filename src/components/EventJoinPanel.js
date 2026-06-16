"use client";

import { CheckCircleFilled, UserAddOutlined } from "@ant-design/icons";
import { Button, Modal, Radio, Space } from "antd";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { postJson } from "@/lib/apiClient";
import { getAuthSession, subscribeAuthSession } from "@/lib/authSession";
import { buildLoginHref } from "@/lib/loginRedirect";
import { useToast } from "@/lib/toast";

const isDemoId = (id) => typeof id === "string" && id.startsWith("demo-");

const COPY = {
  np: {
    cta: "यो अभियानमा जोडिनुहोस्",
    alreadyJoined: "तपाईं {role} भूमिकामा जोडिनुभएको छ",
    waitlistedAs: "{role} भूमिकाको प्रतीक्षा सूचीमा हुनुहुन्छ",
    checkedIn: "तपाईं {role} भूमिकामा साइटमा चेक-इन हुनुभयो",
    closedStatus: "अभियान अब जोडिन खुल्ला छैन",
    modalTitle: "कुन भूमिकामा जोडिने?",
    modalIntro: "तपाईंलाई मन पर्ने / आफूलाई मिल्ने भूमिका छान्नुहोस्। पछि परिवर्तन गर्न सकिन्छ।",
    fullRole: "{label} (पूरा)",
    roleSlotsLeft: "{label} ({n} खाली)",
    submit: "जोडिनुहोस्",
    cancel: "रद्द गर्नुहोस्",
    selectRequired: "एक भूमिका छान्नुहोस्।",
    successToast: "तपाईं अभियानमा जोडिनुभयो।",
    waitlistToast: "भूमिका भरिएको छ — तपाईं प्रतीक्षा सूचीमा हुनुहुन्छ।",
    demoSuccessToast: "तपाईं डेमो अभियानमा जोडिनुभयो (स्थानीय)।",
    errorToast: "जोडिन सकिएन। फेरि प्रयास गर्नुहोस्।",
    medicCredentialError: "स्वास्थ्यकर्मी भूमिकाको लागि प्रमाणित मेडिकल क्रेडेन्सियल चाहिन्छ।",
    alreadyJoinedDifferentRole: "तपाईं पहिले अर्को भूमिकामा जोडिनुभएको छ।",
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
    waitlistedAs: "You're on the {role} waitlist",
    checkedIn: "You're checked in as {role}",
    closedStatus: "This event is no longer open to join",
    modalTitle: "Which role would you take?",
    modalIntro: "Pick the role that fits you. You can change it later.",
    fullRole: "{label} (full)",
    roleSlotsLeft: "{label} ({n} open)",
    submit: "Join",
    cancel: "Cancel",
    selectRequired: "Pick a role to continue.",
    successToast: "You're in.",
    waitlistToast: "That role is full — you're on the waitlist.",
    demoSuccessToast: "You're in this demo event (local only).",
    errorToast: "Could not join. Please try again.",
    medicCredentialError: "The Medic role requires verified medical credentials.",
    alreadyJoinedDifferentRole: "You've already joined this event in a different role.",
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

// `viewerRole` / `viewerStatus` are owned by the event detail page (single
// source of truth shared with EventRosterPanel), so this panel renders the
// joined/waitlisted/checked-in banner straight from props — no fetch here.
export function EventJoinPanel({
  event,
  language = "np",
  viewerRole = null,
  viewerStatus = null,
  onJoined
}) {
  const t = COPY[language] || COPY.np;
  const session = useSyncExternalStore(subscribeAuthSession, getAuthSession, () => null);
  const messageApi = useToast();

  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [saving, setSaving] = useState(false);

  const eventId = event?.id;
  const isDemo = isDemoId(eventId);
  const viewerId = session?.user?.id || null;
  const viewerName = session?.user?.name || null;

  const rolesNeeded = Array.isArray(event?.rolesNeeded) ? event.rolesNeeded : [];

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
    const roleLabel = t.roles[viewerRole] || viewerRole;
    let label = t.alreadyJoined.replace("{role}", roleLabel);
    if (viewerStatus === "INVITED") {
      label = t.waitlistedAs.replace("{role}", roleLabel);
    } else if (viewerStatus === "CHECKED_IN") {
      label = t.checkedIn.replace("{role}", roleLabel);
    }
    return (
      <div className="event-join-panel event-join-panel-joined">
        <CheckCircleFilled aria-hidden="true" />
        <span>{label}</span>
      </div>
    );
  }

  if (!viewerId) {
    return (
      <div className="event-join-panel event-join-panel-anon">
        <span>{t.loginPrompt}</span>
        <Link href={buildLoginHref(`/events/${event?.slug ?? event?.id ?? ""}`, "join")}>
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
      if (isDemo) {
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

      const response = await postJson(
        `/events/${eventId}/participants`,
        { role: selectedRole },
        { requireAuth: true }
      );
      const created = response?.data ?? response;
      if (created && created.role) {
        if (created.status === "INVITED") {
          messageApi.info(t.waitlistToast);
        } else {
          messageApi.success(t.successToast);
        }
        onJoined?.({ id: created.id, role: created.role, status: created.status });
      } else {
        messageApi.success(t.successToast);
        onJoined?.();
      }
      setOpen(false);
    } catch (apiError) {
      if (apiError?.status === 403) {
        messageApi.error(t.medicCredentialError);
      } else if (apiError?.status === 409) {
        messageApi.warning(t.alreadyJoinedDifferentRole);
        // Already in under another role — ask the page to reconcile so the
        // UI flips to "joined" state.
        onJoined?.({ refetch: true });
      } else {
        messageApi.error(apiError?.message || t.errorToast);
      }
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
