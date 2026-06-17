"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  UploadOutlined,
  UserOutlined
} from "@ant-design/icons";
import { Alert, Avatar, Button, Input, Spin, Tag } from "antd";
import { usePreferences } from "@/app/providers";
import { AccountSecurity } from "@/components/AccountSecurity";
import { Form } from "@/components/AppForm";
import { SiteShell } from "@/components/SiteShell";
import { changePassword, fetchMe, updateMe } from "@/lib/apiClient";
import { setFieldErrorsAndScroll } from "@/lib/formErrors";
import {
  getAuthSession,
  setAuthSession,
  subscribeAuthSession
} from "@/lib/authSession";
import { buildLoginHref } from "@/lib/loginRedirect";
import { copy } from "@/lib/siteContent";
import { useToast } from "@/lib/toast";
import { uploadAvatar } from "@/lib/uploads";

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

function getInitials(profile) {
  const source = (profile?.name || profile?.username || profile?.email || "").trim();

  if (!source) {
    return "";
  }

  const parts = source.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function formatDate(iso, language) {
  if (!iso) return null;
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const locale = language === "np" ? "ne-NP" : "en-US";

  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export default function MePage() {
  const router = useRouter();
  const { language } = usePreferences();
  const t = copy[language].me;
  const globalCopy = copy[language];

  const session = useSyncExternalStore(subscribeAuthSession, getAuthSession, () => null);
  const sessionResolved = typeof window !== "undefined";

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const messageApi = useToast();
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!sessionResolved) return;

    if (!session) {
      router.replace(buildLoginHref("/me"));
    }
  }, [router, session, sessionResolved]);

  const loadProfile = () => {
    setLoadingProfile(true);
    setLoadError(null);

    fetchMe()
      .then((response) => {
        const user = response?.data?.user ?? response?.data;

        if (!user) {
          setLoadError(new Error(t.errors.loadFailed));
          return;
        }

        setProfile(user);
        profileForm.setFieldsValue({
          name: user.name ?? "",
          username: user.username ?? ""
        });

        if (session?.accessToken) {
          setAuthSession({
            accessToken: session.accessToken,
            user: { ...session.user, ...user }
          });
        }
      })
      .catch((error) => {
        setLoadError(error);
      })
      .finally(() => {
        setLoadingProfile(false);
      });
  };

  useEffect(() => {
    if (!session) return;
    // Intentional fetch-on-mount/session-change; the setState inside
    // loadProfile is the point of the effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  const handleProfileSubmit = async (values) => {
    setSavingProfile(true);
    try {
      const response = await updateMe(values);
      const updated = response?.data?.user ?? response?.data ?? {};

      setProfile((prev) => ({ ...prev, ...updated }));
      profileForm.setFieldsValue({
        name: updated.name ?? values.name,
        username: updated.username ?? values.username
      });

      if (session?.accessToken) {
        setAuthSession({
          accessToken: session.accessToken,
          user: { ...session.user, ...updated }
        });
      }

      messageApi.success(t.success.profileSaved);
    } catch (error) {
      if (error?.errorCode === "USERNAME_TAKEN") {
        setFieldErrorsAndScroll(profileForm, [
          { name: "username", errors: [t.errors.usernameTaken] }
        ]);
      } else {
        messageApi.error(error?.message || globalCopy.messages.submitError);
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarPick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
      messageApi.error(t.validation.avatarBadType);
      return;
    }

    if (file.size > AVATAR_MAX_BYTES) {
      messageApi.error(t.validation.avatarTooLarge);
      return;
    }

    setSavingAvatar(true);
    try {
      const url = await uploadAvatar(file);
      const response = await updateMe({ avatar: url });
      const updated = response?.data?.user ?? response?.data ?? {};

      setProfile((prev) => ({ ...prev, ...updated, avatar: updated.avatar ?? url }));

      if (session?.accessToken) {
        setAuthSession({
          accessToken: session.accessToken,
          user: { ...session.user, ...updated, avatar: updated.avatar ?? url }
        });
      }

      messageApi.success(t.success.avatarSaved);
    } catch (error) {
      messageApi.error(error?.message || globalCopy.messages.submitError);
    } finally {
      setSavingAvatar(false);
    }
  };

  const handlePasswordSubmit = async (values) => {
    setSavingPassword(true);
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      passwordForm.resetFields();
      messageApi.success(t.success.passwordChanged);
    } catch (error) {
      if (error?.errorCode === "WRONG_CURRENT_PASSWORD") {
        setFieldErrorsAndScroll(passwordForm, [
          { name: "currentPassword", errors: [t.errors.wrongCurrentPassword] }
        ]);
      } else if (error?.errorCode === "SAME_PASSWORD") {
        setFieldErrorsAndScroll(passwordForm, [
          { name: "newPassword", errors: [t.errors.samePassword] }
        ]);
      } else {
        messageApi.error(error?.message || globalCopy.messages.submitError);
      }
    } finally {
      setSavingPassword(false);
    }
  };

  if (!session || loadingProfile) {
    return (
      <SiteShell pageTitle={globalCopy.pageTitles.me}>
        <section className="page-section me-section">
          <div className="me-loading">
            <Spin size="large" />
          </div>
        </section>
      </SiteShell>
    );
  }

  if (loadError) {
    return (
      <SiteShell pageTitle={globalCopy.pageTitles.me}>
        <section className="page-section me-section">
          <Alert
            type="error"
            showIcon
            message={t.errors.loadFailed}
            description={loadError.message}
            action={
              <Button size="small" onClick={loadProfile}>
                {t.errors.retry}
              </Button>
            }
          />
        </section>
      </SiteShell>
    );
  }

  const roleLabel = t.identity.roleLabels[profile?.role] || profile?.role;
  const createdAtDisplay = formatDate(profile?.createdAt, language);
  const showPasswordSection = !profile?.isOAuthUser;

  return (
    <SiteShell pageTitle={globalCopy.pageTitles.me}>
      <section className="page-section me-section">
        <div className="section-heading">
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </div>

        <div className="content-card me-identity-card">
          <div className="me-card-heading">
            <h2>{t.identity.heading}</h2>
            <p>{t.identity.intro}</p>
          </div>
          <dl className="me-identity-grid">
            <div>
              <dt>
                <MailOutlined /> {t.identity.email}
              </dt>
              <dd>{profile?.email || t.identity.notAvailable}</dd>
            </div>
            <div>
              <dt>
                <PhoneOutlined /> {t.identity.phone}
              </dt>
              <dd>
                {profile?.phone || t.identity.notAvailable}
                {profile?.phone && (
                  <Tag
                    color={profile.isVerified ? "green" : "orange"}
                    style={{ marginLeft: 8 }}
                  >
                    {profile.isVerified ? t.identity.verified : t.identity.notVerified}
                  </Tag>
                )}
              </dd>
            </div>
            <div>
              <dt>{t.identity.role}</dt>
              <dd>
                <Tag color={profile?.role === "ADMIN" ? "geekblue" : "default"}>
                  {roleLabel}
                </Tag>
                {profile?.isOAuthUser && (
                  <Tag color="purple" style={{ marginLeft: 8 }}>
                    {t.identity.oauthBadge}
                  </Tag>
                )}
              </dd>
            </div>
            {createdAtDisplay && (
              <div>
                <dt>{t.identity.memberSince}</dt>
                <dd>{createdAtDisplay}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="content-card me-avatar-card">
          <div className="me-card-heading">
            <h2>{t.avatar.heading}</h2>
            <p>{t.avatar.intro}</p>
          </div>
          <div className="me-avatar-row">
            <Avatar
              size={96}
              src={profile?.avatar || undefined}
              icon={<UserOutlined />}
            >
              {getInitials(profile)}
            </Avatar>
            <div className="me-avatar-actions">
              <input
                ref={fileInputRef}
                type="file"
                accept={AVATAR_ALLOWED_TYPES.join(",")}
                onChange={handleAvatarChange}
                hidden
              />
              <Button
                icon={<UploadOutlined />}
                onClick={handleAvatarPick}
                loading={savingAvatar}
              >
                {savingAvatar ? t.avatar.uploading : t.avatar.change}
              </Button>
            </div>
          </div>
        </div>

        <Form
          form={profileForm}
          layout="vertical"
          className="content-card form-card me-profile-form"
          onFinish={handleProfileSubmit}
          requiredMark={false}
        >
          <div className="me-card-heading">
            <h2>{t.profile.heading}</h2>
            <p>{t.profile.intro}</p>
          </div>
          <div className="form-grid">
            <Form.Item
              label={t.profile.name}
              name="name"
              rules={[{ required: true, message: t.validation.required }]}
            >
              <Input prefix={<UserOutlined />} />
            </Form.Item>
            <Form.Item
              label={t.profile.username}
              name="username"
              rules={[{ required: true, message: t.validation.required }]}
            >
              <Input prefix={<UserOutlined />} />
            </Form.Item>
          </div>
          <Button type="primary" htmlType="submit" loading={savingProfile}>
            {t.profile.save}
          </Button>
        </Form>

        {showPasswordSection ? (
          <Form
            form={passwordForm}
            layout="vertical"
            className="content-card form-card me-password-form"
            onFinish={handlePasswordSubmit}
            requiredMark={false}
          >
            <div className="me-card-heading">
              <h2>{t.password.heading}</h2>
              <p>{t.password.intro}</p>
            </div>
            <div className="form-grid">
              <Form.Item
                label={t.password.current}
                name="currentPassword"
                className="wide-field"
                rules={[{ required: true, message: t.validation.required }]}
              >
                <Input.Password prefix={<LockOutlined />} autoComplete="current-password" />
              </Form.Item>
              <Form.Item
                label={t.password.next}
                name="newPassword"
                rules={[
                  { required: true, message: t.validation.required },
                  { min: 8, message: t.validation.passwordTooShort }
                ]}
              >
                <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
              </Form.Item>
              <Form.Item
                label={t.password.confirm}
                name="confirmNewPassword"
                dependencies={["newPassword"]}
                rules={[
                  { required: true, message: t.validation.required },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("newPassword") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error(t.validation.passwordMismatch));
                    }
                  })
                ]}
              >
                <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
              </Form.Item>
            </div>
            <Button type="primary" htmlType="submit" loading={savingPassword}>
              {t.password.save}
            </Button>
          </Form>
        ) : (
          <Alert
            className="me-oauth-banner"
            type="info"
            showIcon
            message={t.password.heading}
            description={t.password.oauthDisabled}
          />
        )}

        <AccountSecurity language={language} />
      </section>
    </SiteShell>
  );
}
