"use client";

import { CheckCircleFilled, LogoutOutlined, UserAddOutlined } from "@ant-design/icons";
import { Button, Modal, Popconfirm, Radio, Space } from "antd";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { deleteJson, postJson } from "@/lib/apiClient";
import { isActiveParticipationStatus } from "@/lib/eventParticipants";
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
    rejoinBlocked: "अहिले फेरि जोडिन सकिएन — पहिले छाड्नुभएको रेकर्ड सर्भरले पुनः सक्रिय गरेन। कृपया आयोजकलाई सम्पर्क गर्नुहोस्।",
    leaveCta: "यो अभियानबाट हट्ने",
    leaveConfirm: "साँच्चै हट्ने? तपाईंको भूमिका अरूका लागि खाली हुनेछ।",
    leaveConfirmOk: "हट्नुहोस्",
    leaveConfirmCancel: "रद्द गर्नुहोस्",
    leftToast: "तपाईं अभियानबाट हट्नुभयो।",
    demoLeftToast: "तपाईं डेमो अभियानबाट हट्नुभयो (स्थानीय)।",
    leaveError: "हट्न सकिएन। फेरि प्रयास गर्नुहोस्।",
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
    rejoinBlocked: "Couldn't re-join right now — a signup you previously left wasn't reactivated by the server. Please contact an organizer.",
    leaveCta: "Leave this event",
    leaveConfirm: "Leave this event? Your spot will open up for someone else.",
    leaveConfirmOk: "Leave",
    leaveConfirmCancel: "Cancel",
    leftToast: "You've left the event.",
    demoLeftToast: "You left this demo event (local only).",
    leaveError: "Could not leave. Please try again.",
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
  viewerParticipantId = null,
  onJoined,
  onLeft
}) {
  const t = COPY[language] || COPY.np;
  const session = useSyncExternalStore(subscribeAuthSession, getAuthSession, () => null);
  const messageApi = useToast();

  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState(false);

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

    // Withdraw is offered only while the event is still open to join and the
    // viewer hasn't been checked in on-site. Real events need the participant
    // record id (from /participants/me); demo events leave by name match.
    const canLeave =
      JOINABLE_STATUSES.has(event?.status) &&
      viewerStatus !== "CHECKED_IN" &&
      (isDemo || Boolean(viewerParticipantId));

    const handleLeave = async () => {
      setLeaving(true);
      try {
        if (isDemo) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          const nextRoles = rolesNeeded.map((row) => {
            if (row.role !== viewerRole) return row;
            const filledNames = (Array.isArray(row.filledNames) ? row.filledNames : []).filter(
              (name) => name !== viewerName
            );
            return {
              ...row,
              filled: Math.max(0, (row.filled || 0) - 1),
              filledNames
            };
          });
          messageApi.success(t.demoLeftToast);
          onLeft?.({
            ...event,
            participantCount: Math.max(0, (event?.participantCount || 0) - 1),
            rolesNeeded: nextRoles
          });
          return;
        }

        await deleteJson(`/events/${eventId}/participants/${viewerParticipantId}`, {
          requireAuth: true
        });
        messageApi.success(t.leftToast);
        onLeft?.({ left: true });
      } catch (apiError) {
        messageApi.error(apiError?.message || t.leaveError);
      } finally {
        setLeaving(false);
      }
    };

    return (
      <div className="event-join-panel event-join-panel-joined">
        <CheckCircleFilled aria-hidden="true" />
        <span>{label}</span>
        {canLeave ? (
          <Popconfirm
            title={t.leaveConfirm}
            okText={t.leaveConfirmOk}
            cancelText={t.leaveConfirmCancel}
            okButtonProps={{ danger: true, loading: leaving }}
            onConfirm={handleLeave}
          >
            <Button
              type="text"
              size="small"
              icon={<LogoutOutlined />}
              loading={leaving}
              className="event-join-leave"
            >
              {t.leaveCta}
            </Button>
          </Popconfirm>
        ) : null}
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
      if (created && created.role && !isActiveParticipationStatus(created.status)) {
        // Backend bug: re-joining after leaving returns 201 but hands back the
        // stale terminal record (status LEFT / NO_SHOW) instead of reactivating
        // it — so the member isn't actually on the roster. Don't claim success.
        messageApi.error(t.rejoinBlocked);
        onJoined?.({ refetch: true });
      } else if (created && created.role) {
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
