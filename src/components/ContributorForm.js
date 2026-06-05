"use client";

import { SendOutlined } from "@ant-design/icons";
import { Button, Checkbox, Input, Select } from "antd";
import Link from "next/link";
import { useEffect } from "react";
import { Form } from "@/components/AppForm";
import { Honeypot } from "@/components/Honeypot";
import { PublicAttachmentField } from "@/components/PublicAttachmentField";
import { toSelectOptions } from "@/lib/siteContent";

export function ContributorForm({ content, eyebrow, title, intro, initialRole, onSubmit, submitting = false }) {
  const [form] = Form.useForm();
  const labels = content.join;
  const requiredRule = { required: true, message: content.messages.required };

  useEffect(() => {
    if (initialRole) {
      form.setFieldsValue({ role: initialRole });
    }
  }, [form, initialRole]);

  const handleFinish = async (values) => {
    const shouldReset = await onSubmit(values);

    if (shouldReset !== false) {
      form.resetFields();
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      className="content-card form-card"
      initialValues={initialRole ? { role: initialRole } : undefined}
      onFinish={handleFinish}
    >
      {(eyebrow || title || intro) && (
        <header className="form-card-heading">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          {title && <h1>{title}</h1>}
          {intro && <p>{intro}</p>}
        </header>
      )}
      <div className="form-grid">
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
        <Form.Item name="role" label={labels.role} rules={[requiredRule]}>
          <Select
            placeholder={content.placeholders.role}
            options={toSelectOptions(content.options.applicationRoles)}
          />
        </Form.Item>
        <Form.Item name="portfolio" label={labels.portfolio}>
          <Input placeholder={content.placeholders.portfolio} />
        </Form.Item>
        <Form.Item name="resume" label={labels.resume} className="wide-field" valuePropName="value">
          <PublicAttachmentField copy={labels.resumeUpload} />
        </Form.Item>
        <Form.Item name="experience" label={labels.experience} className="wide-field">
          <Input.TextArea rows={4} maxLength={500} showCount placeholder={content.placeholders.experience} />
        </Form.Item>
        <Form.Item name="motivation" label={labels.motivation} className="wide-field" rules={[requiredRule]}>
          <Input.TextArea rows={4} maxLength={500} showCount placeholder={content.placeholders.motivation} />
        </Form.Item>
        <Form.Item name="additionalInfo" label={labels.additionalInfo} className="wide-field">
          <Input.TextArea rows={3} maxLength={300} showCount placeholder={content.placeholders.additionalInfo} />
        </Form.Item>
      </div>
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
      <Honeypot />
      <Button type="primary" htmlType="submit" size="large" icon={<SendOutlined />} loading={submitting} block>
        {labels.submit}
      </Button>
    </Form>
  );
}
