"use client";

import { CloudUploadOutlined, DeleteOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Input, Select, Spin } from "antd";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePreferences } from "@/app/providers";
import { Form } from "@/components/AppForm";
import { IssueCoverUpload } from "@/components/admin/IssueCoverUpload";
import { IssueImagesUpload } from "@/components/admin/IssueImagesUpload";
import IssueLocationPickerBlock from "@/components/IssueLocationPickerBlock";
import { SiteShell } from "@/components/SiteShell";
import { postJson } from "@/lib/apiClient";
import { ISSUE_CATEGORIES } from "@/lib/adminUtils";
import { getAuthSession } from "@/lib/authSession";
import { buildLoginHref } from "@/lib/loginRedirect";
import { copy } from "@/lib/siteContent";
import { useToast } from "@/lib/toast";

const NEW_ISSUE_PATH = "/issues/new";
const DRAFT_KEY = "shramdan:issue-draft:v1";
const DRAFT_DEBOUNCE_MS = 800;
const DRAFT_TTL_MS = 14 * 24 * 60 * 60_000; // 14 days

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

const DRAFT_COPY = {
  np: {
    foundTitle: "अधुरो मस्यौदा फेला पर्‍यो",
    foundIntroFmt: "तपाईंले {time} अघि लेख्न थालेको थियो। पुनः ल्याउने?",
    restore: "पुनः ल्याउनुहोस्",
    discard: "हटाउनुहोस्",
    discardedToast: "मस्यौदा हटाइयो",
    restoredToast: "मस्यौदा फेरि ल्याइयो",
    savedNow: "मस्यौदा सुरक्षित · भर्खर",
    savedAgoFmt: "मस्यौदा सुरक्षित · {time} अघि",
    minutesAgoFmt: "{n} मि.",
    hoursAgoFmt: "{n} घण्टा",
    daysAgoFmt: "{n} दिन"
  },
  en: {
    foundTitle: "Unfinished draft found",
    foundIntroFmt: "You started writing this {time} ago. Restore it?",
    restore: "Restore",
    discard: "Discard",
    discardedToast: "Draft discarded",
    restoredToast: "Draft restored",
    savedNow: "Draft saved · just now",
    savedAgoFmt: "Draft saved · {time} ago",
    minutesAgoFmt: "{n} min",
    hoursAgoFmt: "{n} h",
    daysAgoFmt: "{n} d"
  }
};

const DRAFT_FIELDS = ["title", "description", "category", "addressText", "location"];

function pickDraftableValues(values) {
  const slice = {};
  for (const k of DRAFT_FIELDS) {
    if (values[k] !== undefined) slice[k] = values[k];
  }
  return slice;
}

function isDraftEmpty(draft) {
  if (!draft) return true;
  const { title, description, addressText, location } = draft;
  const noText = !title?.trim() && !description?.trim() && !addressText?.trim();
  const noLoc = !location || !Number.isFinite(location.lat);
  return noText && noLoc;
}

function readDraft() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt) return null;
    if (Date.now() - parsed.savedAt > DRAFT_TTL_MS) {
      window.localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    if (isDraftEmpty(parsed.values)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeDraft(values) {
  if (typeof window === "undefined") return null;
  if (isDraftEmpty(values)) {
    window.localStorage.removeItem(DRAFT_KEY);
    return null;
  }
  const savedAt = Date.now();
  try {
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ values, savedAt })
    );
  } catch {
    // quota / serialization — swallow; draft is best-effort
  }
  return savedAt;
}

function clearDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRAFT_KEY);
}

function formatRelative(ms, dt) {
  const min = Math.floor(ms / 60_000);
  if (min < 1) return null;
  if (min < 60) return dt.minutesAgoFmt.replace("{n}", String(min));
  const hr = Math.floor(min / 60);
  if (hr < 24) return dt.hoursAgoFmt.replace("{n}", String(hr));
  const days = Math.floor(hr / 24);
  return dt.daysAgoFmt.replace("{n}", String(days));
}

const coverImageValidator = (message) => (_rule, cover) =>
  cover?.id ? Promise.resolve() : Promise.reject(new Error(message));

const locationValidator = (message) => (_rule, location) => {
  if (
    location &&
    Number.isFinite(location.lat) &&
    Number.isFinite(location.lng)
  ) {
    return Promise.resolve();
  }
  return Promise.reject(new Error(message));
};

function FormLocationField({ value, onChange, ...rest }) {
  return (
    <IssueLocationPickerBlock value={value} onChange={onChange} {...rest} />
  );
}

export default function NewIssuePage() {
  const router = useRouter();
  const { language } = usePreferences();
  const t = copy[language] ?? copy.np;
  const labels = t.issueNew;
  const fields = labels.fields;
  const pickerLabels = fields.picker;
  const dt = DRAFT_COPY[language] || DRAFT_COPY.np;
  const messageApi = useToast();
  const [form] = Form.useForm();
  const [authChecked, setAuthChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const addressTouchedRef = useRef(false);

  // Draft state — banner appears on mount if a usable draft exists.
  // savedAt drives the "X min ago" status pill near the submit button.
  const [draftPrompt, setDraftPrompt] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [, forceTick] = useState(0);
  const debounceRef = useRef(null);

  useEffect(() => {
    const session = getAuthSession();

    if (!session?.user) {
      messageApi.info(labels.authRequiredMessage);
      router.replace(buildLoginHref(NEW_ISSUE_PATH, "report"));
      return;
    }

    setAuthChecked(true);
  }, [router, messageApi, labels.authRequiredMessage]);

  // Surface restore prompt once the form is mounted (post auth-gate).
  useEffect(() => {
    if (!authChecked) return;
    const existing = readDraft();
    if (existing) {
      setDraftPrompt(existing);
    }
  }, [authChecked]);

  // Re-render every 30s so "X min ago" stays fresh without a timer
  // on every keystroke.
  useEffect(() => {
    if (!savedAt) return undefined;
    const id = setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, [savedAt]);

  // Flush pending debounce on unmount so a half-typed draft isn't lost.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const scheduleDraftSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const slice = pickDraftableValues(form.getFieldsValue(DRAFT_FIELDS));
      const stamp = writeDraft(slice);
      setSavedAt(stamp);
    }, DRAFT_DEBOUNCE_MS);
  }, [form]);

  const handleRestoreDraft = () => {
    if (!draftPrompt?.values) return;
    form.setFieldsValue(draftPrompt.values);
    if (draftPrompt.values.addressText) {
      addressTouchedRef.current = true;
    }
    setSavedAt(draftPrompt.savedAt);
    setDraftPrompt(null);
    messageApi.success(dt.restoredToast);
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setDraftPrompt(null);
    setSavedAt(null);
    messageApi.info(dt.discardedToast);
  };

  const categoryOptions = ISSUE_CATEGORIES.map((value) => ({
    value,
    label: labels.categories[value] ?? value
  }));

  const handleAddressSuggestion = (suggested) => {
    if (addressTouchedRef.current) return;
    if (!suggested) return;
    form.setFieldsValue({ addressText: suggested });
  };

  const handleAddressFieldChange = () => {
    addressTouchedRef.current = true;
  };

  const handleSubmit = async (values) => {
    const cover = values.cover;
    const location = values.location || {};
    const additionalImages = Array.isArray(values.additionalImages)
      ? values.additionalImages
      : [];
    const payload = {
      title: values.title,
      description: values.description,
      category: values.category,
      addressText: values.addressText,
      latitude: location.lat,
      longitude: location.lng,
      coverImageId: cover.id
    };
    if (additionalImages.length) {
      payload.uploadIds = additionalImages.map((image) => image.id);
    }

    setSubmitting(true);

    try {
      const response = await postJson("/issues", payload, { requireAuth: true });
      messageApi.success(labels.successMessage);
      clearDraft();
      setSavedAt(null);
      const created = response?.data ?? response;
      const newSlugOrId = created?.slug ?? created?.id;

      if (newSlugOrId) {
        router.push(`/issues/${newSlugOrId}`);
      } else {
        router.push("/issues");
      }
    } catch (error) {
      messageApi.error(error.message || t.messages.submitError);
    } finally {
      setSubmitting(false);
    }
  };

  const savedAgo = savedAt ? Date.now() - savedAt : null;
  const savedAgoLabel =
    savedAgo == null
      ? null
      : formatRelative(savedAgo, dt) == null
        ? dt.savedNow
        : dt.savedAgoFmt.replace(
            "{time}",
            localizeDigits(formatRelative(savedAgo, dt), language)
          );

  const promptAge = draftPrompt
    ? formatRelative(Date.now() - draftPrompt.savedAt, dt)
    : null;

  if (!authChecked) {
    return (
      <SiteShell pageTitle={labels.title}>
        <section className="page-section">
          <div className="content-card" style={{ display: "grid", placeItems: "center", padding: 64 }}>
            <Spin size="large" />
          </div>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell pageTitle={labels.title}>
      <section className="page-section new-issue-section">
        {draftPrompt ? (
          <aside className="new-issue-draft-banner" role="status">
            <div className="new-issue-draft-banner-text">
              <CloudUploadOutlined aria-hidden="true" />
              <div>
                <strong>{dt.foundTitle}</strong>
                <span>
                  {promptAge
                    ? dt.foundIntroFmt.replace(
                        "{time}",
                        localizeDigits(promptAge, language)
                      )
                    : dt.foundIntroFmt.replace("{time} ", "")}
                </span>
              </div>
            </div>
            <div className="new-issue-draft-banner-actions">
              <Button
                type="primary"
                size="small"
                onClick={handleRestoreDraft}
              >
                {dt.restore}
              </Button>
              <Button
                size="small"
                icon={<DeleteOutlined />}
                onClick={handleDiscardDraft}
              >
                {dt.discard}
              </Button>
            </div>
          </aside>
        ) : null}

        <Form
          form={form}
          layout="vertical"
          className="content-card form-card new-issue-form"
          initialValues={{ category: "ROADSIDE" }}
          onFinish={handleSubmit}
          onValuesChange={scheduleDraftSave}
        >
          <header className="form-card-heading">
            <span className="eyebrow">{labels.eyebrow}</span>
            <h1>{labels.title}</h1>
            <p>{labels.intro}</p>
          </header>

          <Form.Item
            name="cover"
            label={fields.cover}
            required
            valuePropName="value"
            rules={[{ validator: coverImageValidator(fields.coverRequired) }]}
          >
            <IssueCoverUpload />
          </Form.Item>

          <Form.Item
            name="additionalImages"
            label={fields.additionalImages}
            valuePropName="value"
          >
            <IssueImagesUpload />
          </Form.Item>

          <Form.Item
            name="title"
            label={fields.title}
            rules={[{ required: true, message: fields.titleRequired }]}
          >
            <Input maxLength={140} placeholder={fields.titlePlaceholder} />
          </Form.Item>

          <Form.Item
            name="description"
            label={fields.description}
            rules={[{ required: true, message: fields.descriptionRequired }]}
          >
            <Input.TextArea
              rows={6}
              maxLength={2000}
              showCount
              placeholder={fields.descriptionPlaceholder}
            />
          </Form.Item>

          <Form.Item
            name="category"
            label={fields.category}
            rules={[{ required: true, message: fields.categoryRequired }]}
          >
            <Select options={categoryOptions} placeholder={fields.categoryPlaceholder} />
          </Form.Item>

          <Form.Item
            name="location"
            label={fields.location}
            rules={[{ validator: locationValidator(fields.locationRequired) }]}
          >
            <FormLocationField
              language={language}
              labels={pickerLabels}
              onAddressSuggestion={handleAddressSuggestion}
              onLocationError={setLocationError}
            />
          </Form.Item>
          {locationError ? (
            <p className="new-issue-location-error">{locationError}</p>
          ) : null}

          <Form.Item
            name="addressText"
            label={fields.address}
            extra={fields.addressFromMap}
            rules={[{ required: true, message: fields.addressRequired }]}
          >
            <Input
              placeholder={fields.addressPlaceholder}
              onChange={handleAddressFieldChange}
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            icon={<SendOutlined />}
            loading={submitting}
            block
          >
            {labels.submit}
          </Button>
          {savedAgoLabel ? (
            <p className="new-issue-draft-status" aria-live="polite">
              <CloudUploadOutlined aria-hidden="true" /> {savedAgoLabel}
            </p>
          ) : null}
        </Form>
      </section>
    </SiteShell>
  );
}
