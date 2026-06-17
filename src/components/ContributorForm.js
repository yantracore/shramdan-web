"use client";

import { Checkbox, Input } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Form } from "@/components/AppForm";
import { Honeypot } from "@/components/Honeypot";
import { MultiStepShell } from "@/components/MultiStepShell";
import { PublicAttachmentField } from "@/components/PublicAttachmentField";

/* Multi-step contributor application — five steps:
 *
 *   0. intro       Visual hero card + Apply CTA (no fields)
 *   1. basics      name, email, phone (all required)
 *   2. work        portfolio, resume, experience (all optional)
 *   3. motivation  motivation textarea + consent
 *   4. verify      password + 6-digit email OTP + submit
 *
 * Submitting an application now creates a VERIFIED account and signs the
 * user in (backend moved member signup onto POST /applications, email-OTP
 * gated, on 2026-06-17). So the "next" on the motivation step requests an
 * email OTP (onRequestOtp) before advancing to the verify step, where the
 * user sets a password and enters the code; the final submit posts
 * { ...details, otp, password } and the page stores the returned session.
 *
 * Role selector was removed 2026-06-05 (later same day) — every applicant
 * lands as a generic Shramdan member (`role: "VOLUNTEER"` on the API).
 * Members get promoted to specific lanes automatically as they participate
 * in events. The `additionalInfo` field is also gone; submissions send
 * `additionalInfo: "n/a"` until the backend marks it optional.
 *
 * Form values persist to localStorage (debounced) so a page refresh
 * doesn't wipe what the user has typed. The resume upload is intentionally
 * NOT persisted — it's a confirmed file reference and re-uploading is the
 * safer recovery path. Password + OTP are never persisted. */

const STEP_KEYS = ["intro", "basics", "work", "motivation", "verify"];
const STEP_FIELDS = {
  intro: [],
  basics: ["name", "email", "phone"],
  work: ["portfolio", "experience"],
  motivation: ["motivation", "consent"],
  verify: ["password", "confirmPassword", "otp"]
};

const RESEND_COOLDOWN_SECONDS = 30;

const DRAFT_KEY = "shramdan:join-draft:v1";
const DRAFT_TTL_MS = 14 * 24 * 60 * 60_000;
const DRAFT_FIELDS = ["name", "email", "phone", "portfolio", "experience", "motivation"];
const DRAFT_DEBOUNCE_MS = 600;

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
    return parsed.values || null;
  } catch {
    return null;
  }
}

function writeDraft(values) {
  if (typeof window === "undefined") return;
  const slice = {};
  let anyFilled = false;
  for (const k of DRAFT_FIELDS) {
    const v = values?.[k];
    if (typeof v === "string" && v.trim()) {
      slice[k] = v;
      anyFilled = true;
    }
  }
  if (!anyFilled) {
    window.localStorage.removeItem(DRAFT_KEY);
    return;
  }
  try {
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ values: slice, savedAt: Date.now() })
    );
  } catch {
    // quota / serialization — best effort, swallow
  }
}

function clearDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRAFT_KEY);
}

export function ContributorForm({
  content,
  language = "np",
  eyebrow,
  intro,
  onSubmit,
  onRequestOtp,
  submitting = false
}) {
  const [form] = Form.useForm();
  const ms = content.multiStep;
  const joinSteps = ms.join.steps;
  const labels = content.join;
  const verifyCopy = labels.verify;
  const requiredRule = { required: true, message: content.messages.required };

  const [stepIndex, setStepIndex] = useState(0);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const draftLoadedRef = useRef(false);
  const debounceRef = useRef(null);

  // Resend cooldown tick for the verify step.
  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const id = window.setInterval(() => {
      setResendCooldown((n) => (n <= 1 ? 0 : n - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [resendCooldown]);

  // Restore draft on mount.
  useEffect(() => {
    if (draftLoadedRef.current) return;
    draftLoadedRef.current = true;
    const draft = readDraft();
    if (draft) {
      form.setFieldsValue(draft);
    }
  }, [form]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const scheduleDraftSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      writeDraft(form.getFieldsValue(DRAFT_FIELDS));
    }, DRAFT_DEBOUNCE_MS);
  }, [form]);

  const currentKey = STEP_KEYS[stepIndex];

  const stepDefs = STEP_KEYS.map((key) => ({
    key,
    title: joinSteps[key].title,
    heading: joinSteps[key].heading,
    intro: joinSteps[key].intro
  }));

  const goNext = async () => {
    const fields = STEP_FIELDS[currentKey];
    if (fields.length) {
      try {
        await form.validateFields(fields);
      } catch {
        return;
      }
    }
    // Leaving the motivation step emails the verification code before the
    // verify step renders. If the request fails (e.g. the email already has
    // an account), stay put — the page surfaces the backend message.
    if (currentKey === "motivation") {
      const email = form.getFieldValue("email");
      setRequestingOtp(true);
      try {
        const ok = await onRequestOtp?.(email);
        if (ok === false) return;
      } finally {
        setRequestingOtp(false);
      }
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    }
    setStepIndex((i) => i + 1);
  };

  const goBack = () => {
    setStepIndex((i) => Math.max(0, i - 1));
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    const email = form.getFieldValue("email");
    setRequestingOtp(true);
    try {
      const ok = await onRequestOtp?.(email);
      if (ok !== false) setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } finally {
      setRequestingOtp(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields(STEP_FIELDS.verify);
    } catch {
      return;
    }

    const values = form.getFieldsValue(true);
    const {
      consent: _consent,
      website: _website,
      confirmPassword: _confirmPassword,
      resume,
      otp,
      password,
      ...rest
    } = values;

    const payload = {
      ...rest,
      otp: String(otp || "").trim(),
      password,
      // Every applicant lands as a generic Shramdan member. Promotion to
      // specific lanes happens later through event participation.
      role: "VOLUNTEER",
      additionalInfo: "n/a",
      ...(resume?.id ? { resumeId: resume.id } : {})
    };

    const shouldReset = await onSubmit(payload);

    if (shouldReset !== false) {
      form.resetFields();
      clearDraft();
      setStepIndex(0);
      setResendCooldown(0);
    }
  };

  const isLastStep = currentKey === "verify";
  const introCopy = joinSteps.intro;

  return (
    <Form
      form={form}
      layout="vertical"
      component="div"
      preserve
      onValuesChange={scheduleDraftSave}
    >
      <Honeypot />

      <MultiStepShell
        steps={stepDefs}
        current={stepIndex}
        language={language}
        onBack={goBack}
        onNext={goNext}
        onSubmit={handleSubmit}
        nextLoading={(currentKey === "motivation" && requestingOtp) || (isLastStep && submitting)}
        nextLabel={
          currentKey === "intro"
            ? introCopy.cta
            : currentKey === "motivation"
              ? verifyCopy.sendCode
              : undefined
        }
        isSubmitStep={isLastStep}
        submitLabel={labels.submit}
        cardClassName={currentKey === "intro" ? "multi-step-shell-intro" : ""}
      >
        {currentKey === "intro" ? (
          <div className="multi-step-intro-card">
            {introCopy.imageSrc ? (
              <div className="multi-step-intro-hero">
                <Image
                  src={introCopy.imageSrc}
                  alt={introCopy.imageAlt || ""}
                  fill
                  sizes="(max-width: 720px) 100vw, 620px"
                  priority
                />
              </div>
            ) : null}
            {(introCopy.eyebrow || eyebrow) ? (
              <span className="eyebrow">{introCopy.eyebrow || eyebrow}</span>
            ) : null}
            {intro ? <p>{intro}</p> : null}
            {Array.isArray(introCopy.stats) && introCopy.stats.length ? (
              <div className="multi-step-intro-stats" aria-hidden="true">
                {introCopy.stats.map((s) => (
                  <span className="multi-step-intro-stat" key={`${s.value}-${s.label}`}>
                    <strong>{s.value}</strong>
                    <span>{s.label}</span>
                  </span>
                ))}
              </div>
            ) : null}
            {Array.isArray(introCopy.bullets) && introCopy.bullets.length ? (
              <ul>
                {introCopy.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {currentKey === "basics" ? (
          <>
            <Form.Item name="name" label={labels.name} rules={[requiredRule]}>
              <Input placeholder={content.placeholders.joinName} />
            </Form.Item>
            <Form.Item
              name="email"
              label={labels.email}
              rules={[requiredRule, { type: "email", message: content.messages.email }]}
            >
              <Input placeholder={content.placeholders.email} />
            </Form.Item>
            <Form.Item
              name="phone"
              label={labels.phone}
              rules={[requiredRule]}
            >
              <Input placeholder={content.placeholders.phone} inputMode="tel" autoComplete="tel" />
            </Form.Item>
          </>
        ) : null}

        {currentKey === "work" ? (
          <>
            <Form.Item name="portfolio" label={labels.portfolio}>
              <Input.TextArea
                rows={3}
                placeholder={content.placeholders.portfolio}
                autoSize={{ minRows: 3, maxRows: 6 }}
              />
            </Form.Item>
            <Form.Item name="resume" label={labels.resume} valuePropName="value">
              <PublicAttachmentField copy={labels.resumeUpload} />
            </Form.Item>
            <Form.Item name="experience" label={labels.experience}>
              <Input.TextArea
                rows={4}
                maxLength={500}
                showCount
                placeholder={content.placeholders.experience}
              />
            </Form.Item>
          </>
        ) : null}

        {currentKey === "motivation" ? (
          <>
            <Form.Item
              name="motivation"
              label={labels.motivation}
              rules={[requiredRule]}
            >
              <Input.TextArea
                rows={5}
                maxLength={500}
                showCount
                placeholder={content.placeholders.motivation}
              />
            </Form.Item>
            <Form.Item
              name="consent"
              valuePropName="checked"
              className="form-consent"
              rules={[
                {
                  validator: (_rule, value) =>
                    value
                      ? Promise.resolve()
                      : Promise.reject(new Error(labels.consent.required))
                }
              ]}
            >
              <Checkbox>
                {labels.consent.intro}{" "}
                <Link href="/terms" target="_blank" rel="noopener noreferrer">
                  {labels.consent.terms}
                </Link>
                {labels.consent.divider}
                <Link href="/privacy" target="_blank" rel="noopener noreferrer">
                  {labels.consent.privacy}
                </Link>
                {labels.consent.and}
                <Link href="/code-of-conduct" target="_blank" rel="noopener noreferrer">
                  {labels.consent.codeOfConduct}
                </Link>
                {labels.consent.suffix}
              </Checkbox>
            </Form.Item>
          </>
        ) : null}

        {currentKey === "verify" ? (
          <div className="signup-field signup-field-group">
            <p className="signup-phone-echo">
              {verifyCopy.sentTo} {form.getFieldValue("email")}
            </p>
            <Form.Item
              name="password"
              label={verifyCopy.password}
              rules={[requiredRule, { min: 6, message: verifyCopy.passwordShort }]}
            >
              <Input.Password
                size="large"
                placeholder={verifyCopy.passwordPlaceholder}
                autoComplete="new-password"
              />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label={verifyCopy.confirmPassword}
              dependencies={["password"]}
              rules={[
                requiredRule,
                ({ getFieldValue }) => ({
                  validator: (_rule, value) =>
                    !value || getFieldValue("password") === value
                      ? Promise.resolve()
                      : Promise.reject(new Error(verifyCopy.passwordMismatch))
                })
              ]}
            >
              <Input.Password
                size="large"
                placeholder={verifyCopy.confirmPasswordPlaceholder}
                autoComplete="new-password"
              />
            </Form.Item>
            <Form.Item
              name="otp"
              label={verifyCopy.otp}
              getValueFromEvent={(e) => e.target.value.replace(/\D/g, "").slice(0, 6)}
              rules={[requiredRule, { pattern: /^\d{6}$/, message: verifyCopy.otpInvalid }]}
            >
              <Input
                size="large"
                inputMode="numeric"
                maxLength={6}
                placeholder="••••••"
                autoComplete="one-time-code"
                className="signup-otp-input"
              />
            </Form.Item>
            <p className="signup-otp-expiry">{verifyCopy.otpExpiry}</p>
            <button
              type="button"
              className="signup-resend"
              onClick={handleResend}
              disabled={resendCooldown > 0 || requestingOtp}
            >
              {resendCooldown > 0
                ? verifyCopy.resendIn.replace("{n}", String(resendCooldown))
                : verifyCopy.resend}
            </button>
          </div>
        ) : null}
      </MultiStepShell>
    </Form>
  );
}
