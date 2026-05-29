"use client";

import { SaveOutlined } from "@ant-design/icons";
import { Button, Input, InputNumber, Select } from "antd";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { Form } from "@/components/AppForm";
import { IssueCoverUpload } from "@/components/admin/IssueCoverUpload";
import { IssueImagesUpload } from "@/components/admin/IssueImagesUpload";
import { ISSUE_CATEGORIES, buildEnumOptions } from "@/lib/adminUtils";

const coverImageValidator = (_, cover) =>
  cover?.url
    ? Promise.resolve()
    : Promise.reject(new Error("Cover image is required."));

export function IssueForm({
  initialValues,
  onSubmit,
  submitting = false,
  submitLabel = "Save",
  cancelHref = "/admin/issues"
}) {
  const [form] = Form.useForm();
  const categoryOptions = useMemo(() => buildEnumOptions(ISSUE_CATEGORIES), []);

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
          label="Cover image"
          required
          rules={[{ validator: coverImageValidator }]}
          valuePropName="value"
        >
          <IssueCoverUpload />
        </Form.Item>

        <Form.Item
          className="admin-form-wide"
          name="additionalImages"
          label="Additional images (optional)"
          valuePropName="value"
        >
          <IssueImagesUpload />
        </Form.Item>

        <Form.Item
          className="admin-form-wide"
          name="title"
          label="Title"
          rules={[{ required: true, message: "Title is required." }]}
        >
          <Input maxLength={140} placeholder="Short, specific summary of the issue" />
        </Form.Item>

        <Form.Item
          className="admin-form-wide"
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

        <Form.Item
          name="category"
          label="Category"
          rules={[{ required: true, message: "Category is required." }]}
        >
          <Select options={categoryOptions} placeholder="Select category" />
        </Form.Item>

        <Form.Item
          className="admin-form-wide"
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

        <Form.Item name="municipality" label="Municipality (optional)">
          <Input placeholder="Pokhara Metropolitan City" />
        </Form.Item>

        <Form.Item name="ward" label="Ward (optional)">
          <Input placeholder="6" />
        </Form.Item>
      </div>

      <div className="admin-form-actions">
        <Link href={cancelHref}>
          <Button>Cancel</Button>
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
