"use client";

// Account security cards for /me: active sessions + a danger zone.
//   GET    /auth/sessions          → list active sessions
//   DELETE /auth/sessions/{id}     → revoke one
//   POST   /auth/logout-all        → sign out everywhere (incl. this device)
//   DELETE /auth/me { password }   → self-service account deletion (403 on a
//                                     wrong password)
// The last two invalidate the current token, so we clear the local session
// and redirect afterwards.

import { DesktopOutlined, LogoutOutlined, WarningOutlined } from "@ant-design/icons";
import { Button, Input, Modal, Popconfirm, Spin } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  deleteAccount,
  fetchSessions,
  logoutAllSessions,
  revokeSession
} from "@/lib/apiClient";
import { clearAuthSession } from "@/lib/authSession";
import { useToast } from "@/lib/toast";

const COPY = {
  np: {
    sessions: {
      heading: "सक्रिय sessions",
      intro: "तपाईंको खातामा हाल लग-इन भएका डिभाइसहरू। नचिनेको देखिए revoke गर्नुहोस्।",
      since: "देखि",
      empty: "कुनै सक्रिय session फेला परेन।",
      revoke: "हटाउने",
      revokeConfirm: "यो session हटाउने?",
      logoutAll: "सबै ठाउँबाट लग-आउट",
      logoutAllConfirm: "सबै डिभाइसबाट लग-आउट गर्ने?",
      logoutAllDesc: "यो डिभाइससहित सबै ठाउँबाट लग-आउट हुनेछ।"
    },
    danger: {
      heading: "खाता मेटाउनुहोस्",
      intro: "यो स्थायी हो — तपाईंको खाता र डेटा हटाइनेछ। यो फिर्ता गर्न सकिँदैन।",
      deleteCta: "खाता मेटाउने",
      modalTitle: "खाता मेटाउने पुष्टि",
      warning: "यो कार्य फिर्ता गर्न सकिँदैन। पुष्टि गर्न पासवर्ड हाल्नुहोस्।",
      passwordLabel: "पासवर्ड",
      passwordPlaceholder: "तपाईंको पासवर्ड",
      confirmCta: "स्थायी रूपमा मेटाउने",
      cancel: "रद्द"
    },
    revoked: "Session हटाइयो।",
    loggedOutAll: "सबै ठाउँबाट लग-आउट भयो।",
    deleted: "तपाईंको खाता मेटाइयो।",
    wrongPassword: "पासवर्ड मिलेन।",
    error: "केही गडबड भयो। फेरि प्रयास गर्नुहोस्।"
  },
  en: {
    sessions: {
      heading: "Active sessions",
      intro: "Devices currently signed in to your account. Revoke any you don't recognize.",
      since: "since",
      empty: "No active sessions found.",
      revoke: "Revoke",
      revokeConfirm: "Revoke this session?",
      logoutAll: "Sign out everywhere",
      logoutAllConfirm: "Sign out of all devices?",
      logoutAllDesc: "You'll be signed out everywhere, including this device."
    },
    danger: {
      heading: "Delete account",
      intro: "This is permanent — your account and data are removed. It cannot be undone.",
      deleteCta: "Delete account",
      modalTitle: "Confirm account deletion",
      warning: "This action cannot be undone. Enter your password to confirm.",
      passwordLabel: "Password",
      passwordPlaceholder: "Your password",
      confirmCta: "Delete permanently",
      cancel: "Cancel"
    },
    revoked: "Session revoked.",
    loggedOutAll: "Signed out everywhere.",
    deleted: "Your account has been deleted.",
    wrongPassword: "Incorrect password.",
    error: "Something went wrong. Please try again."
  }
};

function deviceLabel(userAgent) {
  const ua = String(userAgent || "");
  if (!ua) return "Unknown device";
  let os = "";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS|Macintosh/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iOS/i.test(ua)) os = "iOS";
  else if (/Linux/i.test(ua)) os = "Linux";
  let browser = "";
  if (/Edg/i.test(ua)) browser = "Edge";
  else if (/Chrome/i.test(ua)) browser = "Chrome";
  else if (/Firefox/i.test(ua)) browser = "Firefox";
  else if (/Safari/i.test(ua)) browser = "Safari";
  const label = [browser, os].filter(Boolean).join(" · ");
  return label || ua.slice(0, 40);
}

function formatWhen(iso, language) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const locale = language === "np" ? "ne-NP" : "en-US";
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric"
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function AccountSecurity({ language = "np" }) {
  const t = COPY[language] || COPY.np;
  const messageApi = useToast();
  const router = useRouter();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState("");
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchSessions()
      .then((res) => {
        if (!alive) return;
        const list = res?.data?.sessions ?? res?.sessions ?? [];
        setSessions(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (alive) setSessions([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const handleRevoke = async (id) => {
    setRevokingId(id);
    try {
      await revokeSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      messageApi.success(t.revoked);
    } catch (error) {
      messageApi.error(error?.message || t.error);
    } finally {
      setRevokingId("");
    }
  };

  const handleLogoutAll = async () => {
    setLoggingOutAll(true);
    try {
      await logoutAllSessions();
      clearAuthSession();
      messageApi.success(t.loggedOutAll);
      router.replace("/login");
    } catch (error) {
      messageApi.error(error?.message || t.error);
      setLoggingOutAll(false);
    }
  };

  const closeDelete = () => {
    setDeleteOpen(false);
    setDeletePassword("");
  };

  const handleDelete = async () => {
    if (!deletePassword) return;
    setDeleting(true);
    try {
      await deleteAccount(deletePassword);
      clearAuthSession();
      messageApi.success(t.deleted);
      router.replace("/");
    } catch (error) {
      if (error?.status === 403) {
        messageApi.error(t.wrongPassword);
      } else {
        messageApi.error(error?.message || t.error);
      }
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="content-card me-security-card">
        <div className="me-card-heading">
          <h2>{t.sessions.heading}</h2>
          <p>{t.sessions.intro}</p>
        </div>

        {loading ? (
          <div className="me-security-loading">
            <Spin />
          </div>
        ) : sessions.length === 0 ? (
          <p className="me-security-empty">{t.sessions.empty}</p>
        ) : (
          <ul className="me-session-list">
            {sessions.map((s) => (
              <li key={s.id} className="me-session-row">
                <span className="me-session-icon" aria-hidden="true">
                  <DesktopOutlined />
                </span>
                <span className="me-session-text">
                  <strong>{deviceLabel(s.userAgent)}</strong>
                  <span className="me-session-meta">
                    {s.ip ? `${s.ip} · ` : ""}
                    {t.sessions.since} {formatWhen(s.createdAt, language)}
                  </span>
                </span>
                <Popconfirm
                  title={t.sessions.revokeConfirm}
                  okText={t.sessions.revoke}
                  okButtonProps={{ danger: true }}
                  onConfirm={() => handleRevoke(s.id)}
                >
                  <Button size="small" danger loading={revokingId === s.id}>
                    {t.sessions.revoke}
                  </Button>
                </Popconfirm>
              </li>
            ))}
          </ul>
        )}

        <Popconfirm
          title={t.sessions.logoutAllConfirm}
          description={t.sessions.logoutAllDesc}
          okText={t.sessions.logoutAll}
          okButtonProps={{ danger: true }}
          onConfirm={handleLogoutAll}
        >
          <Button icon={<LogoutOutlined />} loading={loggingOutAll} className="me-logout-all-btn">
            {t.sessions.logoutAll}
          </Button>
        </Popconfirm>
      </div>

      <div className="content-card me-danger-card">
        <div className="me-card-heading">
          <h2>
            <WarningOutlined /> {t.danger.heading}
          </h2>
          <p>{t.danger.intro}</p>
        </div>
        <Button danger onClick={() => setDeleteOpen(true)}>
          {t.danger.deleteCta}
        </Button>
      </div>

      <Modal
        title={t.danger.modalTitle}
        open={deleteOpen}
        onCancel={closeDelete}
        onOk={handleDelete}
        okText={t.danger.confirmCta}
        cancelText={t.danger.cancel}
        okButtonProps={{ danger: true, disabled: !deletePassword }}
        confirmLoading={deleting}
      >
        <p className="me-danger-warning">{t.danger.warning}</p>
        <label className="me-danger-label" htmlFor="me-delete-password">
          {t.danger.passwordLabel}
        </label>
        <Input.Password
          id="me-delete-password"
          value={deletePassword}
          onChange={(e) => setDeletePassword(e.target.value)}
          onPressEnter={handleDelete}
          placeholder={t.danger.passwordPlaceholder}
          autoComplete="current-password"
        />
      </Modal>
    </>
  );
}
