"use client";

import {
  CloudUploadOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  PictureOutlined
} from "@ant-design/icons";
import { Button, Input, Select, Spin } from "antd";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePreferences } from "@/app/providers";
import { Form } from "@/components/AppForm";
import { IssueCoverUpload } from "@/components/admin/IssueCoverUpload";
import { IssueImagesUpload } from "@/components/admin/IssueImagesUpload";
import { IssueMapThumb } from "@/components/IssueMapThumb";
import IssueLocationPickerBlock from "@/components/IssueLocationPickerBlock";
import { MultiStepShell } from "@/components/MultiStepShell";
import { SiteShell } from "@/components/SiteShell";
import { postJson } from "@/lib/apiClient";
import {
  ISSUE_CATEGORIES,
  ISSUE_PICKER_FIELDS,
  ISSUE_PICKER_FIELD_MAP
} from "@/lib/adminUtils";
import { categoryOptionLabel } from "@/lib/categoryIcons";
import { useStepFormErrors } from "@/hooks/useStepFormErrors";
import { ISSUE_TEXT_LIMITS, buildIssueTextRules } from "@/lib/issueFormValidation";
import { getAuthSession } from "@/lib/authSession";
import { buildLoginHref } from "@/lib/loginRedirect";
import { copy } from "@/lib/siteContent";
import { useToast } from "@/lib/toast";

/* /issues/new — multi-step issue reporter.
 *
 * Five centered steps:
 *   0. cover    Cover photo upload
 *   1. basics   Title + Description
 *   2. place    Map pin + Address text
 *   3. extras   Category + Additional photos
 *   4. review   Summary + Submit
 *
 * Auth gate, draft-restore prompt and 14-day TTL draft auto-save are preserved
 * from the pre-refactor implementation. */

const NEW_ISSUE_PATH = "/issues/new";
const DRAFT_KEY = "shramdan:issue-draft:v1";
const DRAFT_DEBOUNCE_MS = 800;
const DRAFT_TTL_MS = 14 * 24 * 60 * 60_000;

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
    restore: "पुनः ल्याउने",
    discard: "हटाउने",
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
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ values, savedAt }));
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
  if (location && Number.isFinite(location.lat) && Number.isFinite(location.lng)) {
    return Promise.resolve();
  }
  return Promise.reject(new Error(message));
};

function FormLocationField({ value, onChange, ...rest }) {
  return <IssueLocationPickerBlock value={value} onChange={onChange} {...rest} />;
}

const STEP_KEYS = ["cover", "basics", "place", "extras", "review"];
const STEP_FIELDS = {
  cover: ["cover"],
  basics: ["title", "description"],
  place: ["location", "addressText"],
  extras: ["category"],
  review: []
};

// Which step renders each field — so a backend validation error can jump the
// user back to the step holding the offending field. Includes the optional
// `additionalImages` picker (rendered on `extras`, but not gated by it).
const FIELD_STEP = {
  cover: 0,
  title: 1,
  description: 1,
  location: 2,
  addressText: 2,
  category: 3,
  additionalImages: 3
};

export default function NewIssuePage() {
  const router = useRouter();
  const { language } = usePreferences();
  const t = copy[language] ?? copy.np;
  const labels = t.issueNew;
  const fields = labels.fields;
  const pickerLabels = fields.picker;
  const dt = DRAFT_COPY[language] || DRAFT_COPY.np;
  const ms = t.multiStep;
  const stepCopy = ms.issueNew.steps;
  const messageApi = useToast();
  const [form] = Form.useForm();
  const [authChecked, setAuthChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [imagesUploading, setImagesUploading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const addressTouchedRef = useRef(false);
  const [stepIndex, setStepIndex] = useState(0);
  const { applyApiErrors, clearFieldErrors } = useStepFormErrors({
    form,
    stepIndex,
    setStepIndex,
    fieldStep: FIELD_STEP
  });

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

  useEffect(() => {
    if (!authChecked) return;
    const existing = readDraft();
    if (existing) {
      setDraftPrompt(existing);
    }
  }, [authChecked]);

  useEffect(() => {
    if (!savedAt) return undefined;
    const id = setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, [savedAt]);

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

  const categoryOptions = useMemo(
    () =>
      ISSUE_CATEGORIES.map((value) => ({
        value,
        label: categoryOptionLabel(value, labels.categories[value] ?? value)
      })),
    [labels.categories]
  );

  // Title + description floors (required → min chars → min words) + inline
  // hints, shared with the member-edit and admin issue forms. Built here (not
  // module-level) so the counts render as Devanagari in NP.
  const { titleRules, descriptionRules, titleHint, descriptionHint } = useMemo(
    () => buildIssueTextRules(fields, language),
    [fields, language]
  );

  const handleAddressSuggestion = (suggested) => {
    if (addressTouchedRef.current) return;
    if (!suggested) return;
    form.setFieldsValue({ addressText: suggested });
  };

  const handleAddressFieldChange = () => {
    addressTouchedRef.current = true;
  };

  const stepDefs = useMemo(
    () =>
      STEP_KEYS.map((key) => ({
        key,
        title: stepCopy[key].title,
        heading: stepCopy[key].heading,
        intro: stepCopy[key].intro
      })),
    [stepCopy]
  );

  const currentKey = STEP_KEYS[stepIndex];
  const isLast = currentKey === "review";

  // On the cover step, the only way forward is a fully uploaded cover image.
  // Keep "Continue" disabled until the upload finishes and yields an id, so the
  // user can't advance into a flow that will only fail validation later. Also
  // block any forward move (Continue or final Submit) while a cover or extra
  // image is still uploading — advancing then would silently drop the pending
  // upload from the payload.
  const coverValue = Form.useWatch("cover", form);
  const anyUploading = coverUploading || imagesUploading;
  const nextDisabled = (currentKey === "cover" && !coverValue?.id) || anyUploading;

  const goNext = async () => {
    const fieldsToCheck = STEP_FIELDS[currentKey];
    if (fieldsToCheck.length) {
      try {
        await form.validateFields(fieldsToCheck);
      } catch {
        return;
      }
    }
    setStepIndex((i) => i + 1);
  };

  const goBack = () => {
    setStepIndex((i) => Math.max(0, i - 1));
  };

  const handleSubmit = async () => {
    try {
      const allFields = Object.values(STEP_FIELDS).flat();
      await form.validateFields(allFields);
    } catch {
      messageApi.error(t.messages.submitError);
      return;
    }

    const values = form.getFieldsValue(true);
    const cover = values.cover;
    const location = values.location || {};
    const additionalImages = Array.isArray(values.additionalImages) ? values.additionalImages : [];

    const payload = {
      title: values.title,
      description: values.description,
      // The author wrote the issue in whatever language the form is
      // showing. Tell the backend the source locale ("np" → "ne") so it
      // can auto-translate to the other locale — POST /issues requires
      // `language` (enum ne|en) for exactly this. See localizeIssue() for
      // how both stored translations are picked back apart on read.
      language: language === "np" ? "ne" : "en",
      category: values.category,
      addressText: values.addressText,
      latitude: location.lat,
      longitude: location.lng,
      // Province + district resolved from the pin (GET /resolve-location).
      // Null when the lookup failed (e.g. just outside a seeded boundary) —
      // compactPayload drops them and the backend re-resolves server-side.
      provinceId: location.provinceId ?? null,
      districtId: location.districtId ?? null,
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
        router.push(`/campaign/${newSlugOrId}`);
      } else {
        router.push("/campaigns");
      }
    } catch (error) {
      // Jump to the earliest step holding an error, pin each error to its field
      // (preserved across step navigation), and scroll to the first. Form-level
      // / non-validation messages fall through to a toast.
      applyApiErrors(error, {
        fieldMap: ISSUE_PICKER_FIELD_MAP,
        knownFields: ISSUE_PICKER_FIELDS,
        toast: messageApi,
        fallbackMessage: t.messages.submitError
      });
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
      <section className="page-section multi-step-section new-issue-section">
        {draftPrompt ? (
          <aside className="new-issue-draft-banner" role="status">
            <div className="new-issue-draft-banner-text">
              <CloudUploadOutlined aria-hidden="true" />
              <div>
                <strong>{dt.foundTitle}</strong>
                <span>
                  {promptAge
                    ? dt.foundIntroFmt.replace("{time}", localizeDigits(promptAge, language))
                    : dt.foundIntroFmt.replace("{time} ", "")}
                </span>
              </div>
            </div>
            <div className="new-issue-draft-banner-actions">
              <Button type="primary" size="small" onClick={handleRestoreDraft}>
                {dt.restore}
              </Button>
              <Button size="small" icon={<DeleteOutlined />} onClick={handleDiscardDraft}>
                {dt.discard}
              </Button>
            </div>
          </aside>
        ) : null}

        <Form
          form={form}
          layout="vertical"
          component="div"
          initialValues={{ category: "ROADSIDE" }}
          onValuesChange={(changed) => {
            clearFieldErrors(changed);
            scheduleDraftSave();
          }}
          preserve
        >
          <MultiStepShell
            steps={stepDefs}
            current={stepIndex}
            language={language}
            onBack={goBack}
            onNext={goNext}
            onSubmit={handleSubmit}
            nextDisabled={nextDisabled}
            nextLoading={submitting && isLast}
            isSubmitStep={isLast}
            submitLabel={labels.submit}
          >
            {currentKey === "cover" ? (
              <Form.Item
                name="cover"
                label={fields.cover}
                required
                valuePropName="value"
                rules={[{ validator: coverImageValidator(fields.coverRequired) }]}
              >
                <IssueCoverUpload onUploadingChange={setCoverUploading} />
              </Form.Item>
            ) : null}

            {currentKey === "basics" ? (
              <>
                <Form.Item
                  name="title"
                  label={fields.title}
                  extra={titleHint}
                  validateFirst
                  rules={titleRules}
                >
                  <Input
                    autoFocus
                    maxLength={ISSUE_TEXT_LIMITS.title.maxChars}
                    placeholder={fields.titlePlaceholder}
                  />
                </Form.Item>
                <Form.Item
                  name="description"
                  label={fields.description}
                  extra={descriptionHint}
                  validateFirst
                  rules={descriptionRules}
                >
                  <Input.TextArea
                    rows={6}
                    maxLength={ISSUE_TEXT_LIMITS.description.maxChars}
                    showCount
                    placeholder={fields.descriptionPlaceholder}
                  />
                </Form.Item>
              </>
            ) : null}

            {currentKey === "place" ? (
              <>
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
                  rules={[{ required: true, whitespace: true, message: fields.addressRequired }]}
                >
                  <Input
                    placeholder={fields.addressPlaceholder}
                    onChange={handleAddressFieldChange}
                  />
                </Form.Item>
              </>
            ) : null}

            {currentKey === "extras" ? (
              <>
                <Form.Item
                  name="category"
                  label={fields.category}
                  rules={[{ required: true, message: fields.categoryRequired }]}
                >
                  <Select options={categoryOptions} placeholder={fields.categoryPlaceholder} />
                </Form.Item>
                <Form.Item
                  name="additionalImages"
                  label={fields.additionalImages}
                  valuePropName="value"
                >
                  <IssueImagesUpload onUploadingChange={setImagesUploading} />
                </Form.Item>
              </>
            ) : null}

            {currentKey === "review" ? (
              <ReviewSummary form={form} labels={labels} language={language} />
            ) : null}
          </MultiStepShell>

          {savedAgoLabel ? (
            <p className="new-issue-draft-status" aria-live="polite" style={{ textAlign: "center" }}>
              <CloudUploadOutlined aria-hidden="true" /> {savedAgoLabel}
            </p>
          ) : null}
        </Form>
      </section>
    </SiteShell>
  );
}

function ReviewSummary({ form, labels, language }) {
  const v = form.getFieldsValue(true);
  const loc = v.location;
  const hasCoords = loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng);
  const categoryLabel = v.category ? labels.categories[v.category] ?? v.category : null;
  const coverUrl = v.cover?.url || null;
  const photos = Array.isArray(v.additionalImages) ? v.additionalImages : [];
  const r = labels.review;
  const photosLabel =
    language === "np"
      ? `${localizeDigits(photos.length, "np")} तस्वीर`
      : `${photos.length} photo${photos.length === 1 ? "" : "s"}`;

  return (
    <div className="issue-review-card">
      <div className="issue-review-hero">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="issue-review-hero-img" src={coverUrl} alt="" />
        ) : (
          <div className="issue-review-hero-empty">
            <PictureOutlined aria-hidden="true" />
            <span>{r.noCover}</span>
          </div>
        )}
        {categoryLabel ? (
          <span className="issue-review-hero-tag">{categoryLabel}</span>
        ) : null}
      </div>

      <div className="issue-review-body">
        <h2 className="issue-review-title">{v.title || "—"}</h2>

        {v.addressText ? (
          <p className="issue-review-address">
            <EnvironmentOutlined aria-hidden="true" /> {v.addressText}
          </p>
        ) : null}

        {v.description ? (
          <p className="issue-review-desc">{v.description}</p>
        ) : null}

        {hasCoords ? (
          <section className="issue-review-section">
            <h3 className="issue-review-section-title">
              <EnvironmentOutlined aria-hidden="true" /> {r.locationTitle}
            </h3>
            <div className="issue-review-map">
              <IssueMapThumb
                latitude={loc.lat}
                longitude={loc.lng}
                zoom={15}
                alt=""
              />
            </div>
            <p className="issue-review-coords">
              {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
            </p>
          </section>
        ) : null}

        {photos.length ? (
          <section className="issue-review-section">
            <h3 className="issue-review-section-title">
              <PictureOutlined aria-hidden="true" /> {r.photosTitle} · {photosLabel}
            </h3>
            <div className="issue-review-photos">
              {photos.map((p, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={p.id || p.url || i}
                  className="issue-review-photo"
                  src={p.url}
                  alt=""
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
