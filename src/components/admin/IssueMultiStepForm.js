"use client";

import { Input, InputNumber, Select } from "antd";
import { useMemo, useState } from "react";
import { Form } from "@/components/AppForm";
import { IssueCoverUpload } from "@/components/admin/IssueCoverUpload";
import { IssueImagesUpload } from "@/components/admin/IssueImagesUpload";
import { MultiStepShell } from "@/components/MultiStepShell";
import {
  ISSUE_CATEGORIES,
  ISSUE_STEP_FIELDS,
  ISSUE_STEP_FIELD_MAP,
  buildEnumOptions
} from "@/lib/adminUtils";
import { useStepFormErrors } from "@/hooks/useStepFormErrors";
import { useToast } from "@/lib/toast";

/* Admin create-issue form — multi-step counterpart to the legacy IssueForm.
 *
 * Used by /admin/issues/create. The /admin/issues/[id]/edit page still
 * uses the legacy single-form IssueForm — editing a record is best done in
 * one screen rather than walked through five. */

const STEP_KEYS = ["cover", "basics", "place", "admin", "review"];
const STEP_FIELDS = {
  cover: ["cover"],
  basics: ["title", "description"],
  place: ["addressText", "latitude", "longitude"],
  admin: ["category"],
  review: []
};

// Which step renders each field — so a backend validation error can jump back
// to the step holding the offending field (incl. the optional inputs that
// aren't part of the per-step gate above).
const FIELD_STEP = {
  cover: 0,
  title: 1,
  description: 1,
  addressText: 2,
  latitude: 2,
  longitude: 2,
  category: 3,
  municipality: 3,
  ward: 3,
  additionalImages: 3
};

const coverImageValidator = (_, cover) =>
  cover?.id || cover?.url
    ? Promise.resolve()
    : Promise.reject(new Error("Cover image is required."));

export function IssueMultiStepForm({
  copy,
  onSubmit,
  submitting = false,
  submitLabel = "Create issue"
}) {
  const [form] = Form.useForm();
  const toast = useToast();
  const [stepIndex, setStepIndex] = useState(0);
  const { applyApiErrors, clearFieldErrors } = useStepFormErrors({
    form,
    stepIndex,
    setStepIndex,
    fieldStep: FIELD_STEP
  });
  const stepCopy = copy.multiStep.issueAdmin.steps;
  const categoryOptions = useMemo(() => buildEnumOptions(ISSUE_CATEGORIES), []);

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

  const goNext = async () => {
    const fields = STEP_FIELDS[currentKey];
    if (fields.length) {
      try {
        await form.validateFields(fields);
      } catch {
        return;
      }
    }
    setStepIndex((i) => i + 1);
  };

  const goBack = () => setStepIndex((i) => Math.max(0, i - 1));

  const handleSubmit = async () => {
    try {
      const allFields = Object.values(STEP_FIELDS).flat();
      await form.validateFields(allFields);
    } catch {
      return;
    }
    const values = form.getFieldsValue(true);
    // The parent's onSubmit performs the API call and THROWS on failure; catch
    // here so backend validation lands inline on the right field — jumping back
    // to the step that field lives on — instead of only a toast.
    try {
      await onSubmit(values);
    } catch (error) {
      applyApiErrors(error, {
        fieldMap: ISSUE_STEP_FIELD_MAP,
        knownFields: ISSUE_STEP_FIELDS,
        toast,
        fallbackMessage: "Could not save issue."
      });
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      component="div"
      initialValues={{ category: "ROADSIDE" }}
      onValuesChange={clearFieldErrors}
      preserve
    >
      <MultiStepShell
        steps={stepDefs}
        current={stepIndex}
        language="en"
        onBack={goBack}
        onNext={goNext}
        onSubmit={handleSubmit}
        nextLoading={submitting && isLast}
        isSubmitStep={isLast}
        submitLabel={submitLabel}
      >
        {currentKey === "cover" ? (
          <>
            <Form.Item
              name="cover"
              label="Cover image"
              required
              rules={[{ validator: coverImageValidator }]}
              valuePropName="value"
            >
              <IssueCoverUpload />
            </Form.Item>
          </>
        ) : null}

        {currentKey === "basics" ? (
          <>
            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: "Title is required." }]}
            >
              <Input autoFocus maxLength={140} placeholder="Short, specific summary of the issue" />
            </Form.Item>
            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: "Description is required." }]}
            >
              <Input.TextArea
                rows={6}
                maxLength={2000}
                showCount
                placeholder="What is happening, who is affected, and what needs to change?"
              />
            </Form.Item>
          </>
        ) : null}

        {currentKey === "place" ? (
          <>
            <Form.Item
              name="addressText"
              label="Address"
              rules={[{ required: true, message: "Address is required." }]}
            >
              <Input placeholder="Lakeside, Pokhara" />
            </Form.Item>
            <Form.Item
              name="latitude"
              label="Latitude"
              rules={[
                { required: true, message: "Latitude is required." },
                { type: "number", min: -90, max: 90, message: "Latitude must be between -90 and 90." }
              ]}
            >
              <InputNumber style={{ width: "100%" }} step={0.0001} placeholder="28.2130" />
            </Form.Item>
            <Form.Item
              name="longitude"
              label="Longitude"
              rules={[
                { required: true, message: "Longitude is required." },
                { type: "number", min: -180, max: 180, message: "Longitude must be between -180 and 180." }
              ]}
            >
              <InputNumber style={{ width: "100%" }} step={0.0001} placeholder="83.9570" />
            </Form.Item>
          </>
        ) : null}

        {currentKey === "admin" ? (
          <>
            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: "Category is required." }]}
            >
              <Select options={categoryOptions} placeholder="Select category" />
            </Form.Item>
            <Form.Item name="municipality" label="Municipality (optional)">
              <Input placeholder="Pokhara Metropolitan City" />
            </Form.Item>
            <Form.Item name="ward" label="Ward (optional)">
              <Input placeholder="6" />
            </Form.Item>
            <Form.Item
              name="additionalImages"
              label="Additional images (optional)"
              valuePropName="value"
            >
              <IssueImagesUpload />
            </Form.Item>
          </>
        ) : null}

        {currentKey === "review" ? <AdminReview form={form} /> : null}
      </MultiStepShell>
    </Form>
  );
}

function AdminReview({ form }) {
  const v = form.getFieldsValue(true);
  const photos = Array.isArray(v.additionalImages) ? v.additionalImages.length : 0;
  return (
    <dl className="multi-step-review">
      <div className="multi-step-review-row">
        <dt>Title</dt>
        <dd>{v.title || "—"}</dd>
      </div>
      <div className="multi-step-review-row">
        <dt>Description</dt>
        <dd>{v.description || "—"}</dd>
      </div>
      <div className="multi-step-review-row">
        <dt>Category</dt>
        <dd>{v.category || "—"}</dd>
      </div>
      <div className="multi-step-review-row">
        <dt>Address</dt>
        <dd>{v.addressText || "—"}</dd>
      </div>
      <div className="multi-step-review-row">
        <dt>Coordinates</dt>
        <dd>
          {Number.isFinite(v.latitude) && Number.isFinite(v.longitude)
            ? `${v.latitude}, ${v.longitude}`
            : "—"}
        </dd>
      </div>
      <div className="multi-step-review-row">
        <dt>Municipality</dt>
        <dd>{v.municipality || "—"}</dd>
      </div>
      <div className="multi-step-review-row">
        <dt>Ward</dt>
        <dd>{v.ward || "—"}</dd>
      </div>
      <div className="multi-step-review-row">
        <dt>Extra photos</dt>
        <dd>{photos > 0 ? `${photos} photo${photos === 1 ? "" : "s"}` : "—"}</dd>
      </div>
    </dl>
  );
}
