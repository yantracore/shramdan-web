"use client";

import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Form, Input, InputNumber, Select } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { AdminPanelHeading } from "@/components/admin/AdminPanelHeading";
import { postJson } from "@/lib/apiClient";
import { ISSUE_CATEGORIES, buildEnumOptions } from "@/lib/adminUtils";
import { useToast } from "@/lib/toast";

export default function AdminIssueCreatePage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  const categoryOptions = useMemo(() => buildEnumOptions(ISSUE_CATEGORIES), []);

  const handleFinish = async (values) => {
    setSubmitting(true);

    try {
      await postJson("/issues", values, { requireAuth: true });
      toast.success("Issue created.");
      router.push("/admin/issues");
    } catch (error) {
      toast.error(error.message || "Could not create issue.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminShell title="Create issue">
      <section className="admin-panel">
        <AdminPanelHeading
          eyebrow="Community issues"
          title="Create issue"
          description="Report a new community issue on behalf of a verified contributor. All required fields must match the public issue contract."
          actions={
            <Link href="/admin/issues">
              <Button icon={<ArrowLeftOutlined />}>Back to issues</Button>
            </Link>
          }
        />

        <Form
          form={form}
          layout="vertical"
          className="admin-form"
          onFinish={handleFinish}
          initialValues={{ category: "ROADSIDE" }}
        >
          <div className="admin-form-grid">
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
            <Link href="/admin/issues">
              <Button>Cancel</Button>
            </Link>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={submitting}
            >
              Create issue
            </Button>
          </div>
        </Form>
      </section>
    </AdminShell>
  );
}
