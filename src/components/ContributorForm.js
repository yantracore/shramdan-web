"use client";

import { SendOutlined } from "@ant-design/icons";
import { Button, Form, Input, Select } from "antd";
import { useEffect } from "react";
import { toSelectOptions } from "@/lib/siteContent";

export function ContributorForm({ content, initialRole, onSubmit, submitting = false }) {
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
        <Form.Item name="resumeUrl" label={labels.resumeUrl}>
          <Input placeholder={content.placeholders.resumeUrl} />
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
      <Button type="primary" htmlType="submit" size="large" icon={<SendOutlined />} loading={submitting} block>
        {labels.submit}
      </Button>
    </Form>
  );
}
