"use client";

import { Checkbox, Input } from "antd";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Form } from "@/components/AppForm";
import { Honeypot } from "@/components/Honeypot";
import { MultiStepShell } from "@/components/MultiStepShell";
import { PublicAttachmentField } from "@/components/PublicAttachmentField";
import {
  RoleLaneSelector,
  ROLE_LANE_VALUES,
  SKIP_PORTFOLIO_LANE
} from "@/components/RoleLaneSelector";

/* Multi-step contributor application — five steps:
 *
 *   0. intro       (just an "Apply" CTA, no fields)
 *   1. basics      (name, email, phone)
 *   2. role        (3-lane selector)
 *   3. work        (portfolio, resume, experience) — SKIPPED if lane = EVENT_PARTICIPATION
 *   4. motivation  (motivation textarea + consent + submit)
 *
 * `additionalInfo` is no longer in the UI; it's sent as "n/a" until the
 * backend marks it optional. `role` on the payload carries the lane enum
 * (EVENT_PARTICIPATION / DEVELOPMENT / COMPANY_MANAGEMENT) — see
 * docs/api-requirements/applications.md for the reconciliation note. */

const STEP_KEYS = ["intro", "basics", "role", "work", "motivation"];
const STEP_FIELDS = {
  intro: [],
  basics: ["name", "email", "phone"],
  role: ["role"],
  work: ["portfolio", "resume", "experience"],
  motivation: ["motivation", "consent"]
};

export function ContributorForm({
  content,
  language = "np",
  eyebrow,
  title,
  intro,
  initialRole,
  onSubmit,
  submitting = false
}) {
  const [form] = Form.useForm();
  const ms = content.multiStep;
  const joinSteps = ms.join.steps;
  const labels = content.join;
  const requiredRule = { required: true, message: content.messages.required };

  const [stepIndex, setStepIndex] = useState(0);
  const [history, setHistory] = useState([0]);
  const [selectedLane, setSelectedLane] = useState(
    ROLE_LANE_VALUES.includes(initialRole) ? initialRole : undefined
  );

  const stepDefs = useMemo(
    () =>
      STEP_KEYS.map((key) => ({
        key,
        title: joinSteps[key].title,
        heading: joinSteps[key].heading,
        intro: joinSteps[key].intro
      })),
    [joinSteps]
  );

  const currentKey = STEP_KEYS[stepIndex];
  const skipWork = selectedLane === SKIP_PORTFOLIO_LANE;

  const goNext = async () => {
    const fields = STEP_FIELDS[currentKey];

    if (currentKey === "role") {
      if (!selectedLane) {
        form.setFields([
          { name: "role", errors: [joinSteps.role.required] }
        ]);
        return;
      }
      form.setFieldsValue({ role: selectedLane });
      form.setFields([{ name: "role", errors: [] }]);
    }

    if (fields.length) {
      try {
        await form.validateFields(fields);
      } catch {
        return;
      }
    }

    let nextIndex = stepIndex + 1;
    if (STEP_KEYS[nextIndex] === "work" && skipWork) {
      nextIndex += 1;
    }
    setStepIndex(nextIndex);
    setHistory((h) => [...h, nextIndex]);
  };

  const goBack = () => {
    setHistory((h) => {
      if (h.length <= 1) return h;
      const next = h.slice(0, -1);
      setStepIndex(next[next.length - 1]);
      return next;
    });
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields(STEP_FIELDS.motivation);
    } catch {
      return;
    }

    const values = form.getFieldsValue(true);
    const { consent: _consent, website: _website, resume, ...rest } = values;

    const payload = {
      ...rest,
      role: selectedLane,
      additionalInfo: "n/a",
      ...(resume?.id ? { resumeId: resume.id } : {})
    };

    const shouldReset = await onSubmit(payload);

    if (shouldReset !== false) {
      form.resetFields();
      setSelectedLane(undefined);
      setStepIndex(0);
      setHistory([0]);
    }
  };

  const handleLaneChange = (next) => {
    setSelectedLane(next);
    form.setFieldsValue({ role: next });
    form.setFields([{ name: "role", errors: [] }]);
  };

  const isLastStep = currentKey === "motivation";

  return (
    <Form form={form} layout="vertical" component="div" preserve>
      {/* role registers as a hidden form field so the existing validation
          plumbing works without exposing the legacy <Select>. */}
      <Form.Item name="role" hidden>
        <Input type="hidden" />
      </Form.Item>
      <Honeypot />

      <MultiStepShell
        steps={stepDefs}
        current={stepIndex}
        language={language}
        onBack={goBack}
        onNext={goNext}
        onSubmit={handleSubmit}
        nextLoading={submitting && isLastStep}
        nextLabel={currentKey === "intro" ? joinSteps.intro.cta : undefined}
        isSubmitStep={isLastStep}
        submitLabel={labels.submit}
      >
        {currentKey === "intro" ? (
          <div className="multi-step-intro-card">
            {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
            {intro ? <p>{intro}</p> : null}
            <ul>
              {joinSteps.intro.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {currentKey === "basics" ? (
          <>
            <Form.Item name="name" label={labels.name} rules={[requiredRule]}>
              <Input autoFocus placeholder={content.placeholders.joinName} />
            </Form.Item>
            <Form.Item
              name="email"
              label={labels.email}
              rules={[requiredRule, { type: "email", message: content.messages.email }]}
            >
              <Input placeholder={content.placeholders.email} />
            </Form.Item>
            <Form.Item name="phone" label={labels.phone}>
              <Input placeholder={content.placeholders.phone} />
            </Form.Item>
          </>
        ) : null}

        {currentKey === "role" ? (
          <>
            <RoleLaneSelector
              value={selectedLane}
              onChange={handleLaneChange}
              copy={ms.lanes}
              pickLabel={ms.lanes.pickLabel}
            />
            <Form.Item
              shouldUpdate
              noStyle
            >
              {() => {
                const err = form.getFieldError("role");
                return err && err.length ? (
                  <p className="role-lane-card-error" role="alert">
                    {err[0]}
                  </p>
                ) : null;
              }}
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
                autoFocus
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
      </MultiStepShell>
    </Form>
  );
}
