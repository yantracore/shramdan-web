"use client";

import { MessageOutlined } from "@ant-design/icons";
import { Button, Form, Input, Rate, Select } from "antd";
import { toSelectOptions } from "@/lib/siteContent";

export function FeedbackForm({ content, onSubmit, submitting = false }) {
  const [form] = Form.useForm();
  const labels = content.feedback;
  const requiredRule = { required: true, message: content.messages.required };

  const handleFinish = async (values) => {
    const shouldReset = await onSubmit(values);

    if (shouldReset !== false) {
      form.resetFields();
    }
  };

  return (
    <Form form={form} layout="vertical" className="content-card form-card" onFinish={handleFinish}>
      <div className="form-grid">
        <Form.Item name="name" label={labels.name} rules={[requiredRule]}>
          <Input placeholder={content.placeholders.name} />
        </Form.Item>
        <Form.Item
          name="email"
          label={labels.email}
          rules={[requiredRule, { type: "email", message: content.messages.email }]}
        >
          <Input placeholder={content.placeholders.email} />
        </Form.Item>
        <Form.Item name="type" label={labels.type} rules={[requiredRule]}>
          <Select
            placeholder={content.placeholders.feedbackType}
            options={toSelectOptions(content.options.feedbackTypes)}
          />
        </Form.Item>
        <Form.Item name="experienceRating" label={labels.experienceRating}>
          <Rate />
        </Form.Item>
        <Form.Item name="message" label={labels.message} className="wide-field" rules={[requiredRule]}>
          <Input.TextArea rows={6} maxLength={1000} showCount placeholder={content.placeholders.feedback} />
        </Form.Item>
        <Form.Item name="screenshot" label={labels.screenshot} className="wide-field">
          <Input placeholder={content.placeholders.screenshot} />
        </Form.Item>
      </div>
      <Button type="primary" htmlType="submit" size="large" icon={<MessageOutlined />} loading={submitting} block>
        {labels.submit}
      </Button>
    </Form>
  );
}
