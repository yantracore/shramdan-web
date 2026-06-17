"use client";

import { SaveOutlined } from "@ant-design/icons";
import { Button, Input, InputNumber, Select } from "antd";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { Form } from "@/components/AppForm";
import { IssueCoverUpload } from "@/components/admin/IssueCoverUpload";
import { IssueImagesUpload } from "@/components/admin/IssueImagesUpload";
import { ISSUE_CATEGORIES, buildEnumOptions } from "@/lib/adminUtils";

// English defaults keep the admin control center (EN-only) behaving exactly
// as before when no `labels` prop is passed. Member-facing surfaces pass a
// localized `labels` object (and optionally `categoryOptions`) so the same
// form renders bilingually without forking the component.
const DEFAULT_LABELS = {
  cover: "Cover image",
  coverRequired: "Cover image is required.",
  additionalImages: "Additional images (optional)",
  title: "Title",
  titleRequired: "Title is required.",
  titlePlaceholder: "Short, specific summary of the issue",
  description: "Description",
  descriptionRequired: "Description is required.",
  descriptionPlaceholder: "What is happening, who is affected, and what needs to change?",
  category: "Category",
  categoryRequired: "Category is required.",
  categoryPlaceholder: "Select category",
  address: "Address",
  addressRequired: "Address is required.",
  addressPlaceholder: "Lakeside, Pokhara",
  latitude: "Latitude",
  latitudeRequired: "Latitude is required.",
  latitudeRange: "Latitude must be between -90 and 90.",
  longitude: "Longitude",
  longitudeRequired: "Longitude is required.",
  longitudeRange: "Longitude must be between -180 and 180.",
  municipality: "Municipality (optional)",
  municipalityPlaceholder: "Pokhara Metropolitan City",
  ward: "Ward (optional)",
  wardPlaceholder: "6",
  cancel: "Cancel"
};

export function IssueForm({
  initialValues,
  onSubmit,
  submitting = false,
  submitLabel = "Save",
  cancelHref = "/admin/issues",
  labels,
  categoryOptions
}) {
  const [form] = Form.useForm();
  const L = useMemo(() => ({ ...DEFAULT_LABELS, ...(labels || {}) }), [labels]);
  const categorySelectOptions = useMemo(
    () => categoryOptions || buildEnumOptions(ISSUE_CATEGORIES),
    [categoryOptions]
  );

  const coverImageValidator = useMemo(
    () => (_, cover) =>
      cover?.url ? Promise.resolve() : Promise.reject(new Error(L.coverRequired)),
    [L.coverRequired]
  );

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [form, initialValues]);

  return (
    <Form
      form={form}
      layout="vertical"
      className="admin-form"
      onFinish={onSubmit}
      initialValues={initialValues || { category: "ROADSIDE" }}
    >
      <div className="admin-form-grid">
        <Form.Item
          className="admin-form-wide"
          name="cover"
          label={L.cover}
          required
          rules={[{ validator: coverImageValidator }]}
          valuePropName="value"
        >
          <IssueCoverUpload />
        </Form.Item>

        <Form.Item
          className="admin-form-wide"
          name="additionalImages"
          label={L.additionalImages}
          valuePropName="value"
        >
          <IssueImagesUpload />
        </Form.Item>

        <Form.Item
          className="admin-form-wide"
          name="title"
          label={L.title}
          rules={[{ required: true, message: L.titleRequired }]}
        >
          <Input maxLength={140} placeholder={L.titlePlaceholder} />
        </Form.Item>

        <Form.Item
          className="admin-form-wide"
          name="description"
          label={L.description}
          rules={[{ required: true, message: L.descriptionRequired }]}
        >
          <Input.TextArea
            rows={6}
            maxLength={2000}
            showCount
            placeholder={L.descriptionPlaceholder}
          />
        </Form.Item>

        <Form.Item
          name="category"
          label={L.category}
          rules={[{ required: true, message: L.categoryRequired }]}
        >
          <Select options={categorySelectOptions} placeholder={L.categoryPlaceholder} />
        </Form.Item>

        <Form.Item
          className="admin-form-wide"
          name="addressText"
          label={L.address}
          rules={[{ required: true, message: L.addressRequired }]}
        >
          <Input placeholder={L.addressPlaceholder} />
        </Form.Item>

        <Form.Item
          name="latitude"
          label={L.latitude}
          rules={[
            { required: true, message: L.latitudeRequired },
            { type: "number", min: -90, max: 90, message: L.latitudeRange }
          ]}
        >
          <InputNumber style={{ width: "100%" }} step={0.0001} placeholder="28.2130" />
        </Form.Item>

        <Form.Item
          name="longitude"
          label={L.longitude}
          rules={[
            { required: true, message: L.longitudeRequired },
            { type: "number", min: -180, max: 180, message: L.longitudeRange }
          ]}
        >
          <InputNumber style={{ width: "100%" }} step={0.0001} placeholder="83.9570" />
        </Form.Item>

        <Form.Item name="municipality" label={L.municipality}>
          <Input placeholder={L.municipalityPlaceholder} />
        </Form.Item>

        <Form.Item name="ward" label={L.ward}>
          <Input placeholder={L.wardPlaceholder} />
        </Form.Item>
      </div>

      <div className="admin-form-actions">
        <Link href={cancelHref}>
          <Button>{L.cancel}</Button>
        </Link>
        <Button
          type="primary"
          htmlType="submit"
          icon={<SaveOutlined />}
          loading={submitting}
        >
          {submitLabel}
        </Button>
      </div>
    </Form>
  );
}
