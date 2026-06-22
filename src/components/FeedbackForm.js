"use client";

import { MessageOutlined } from "@ant-design/icons";
import { Button, Input, Rate, Select } from "antd";
import { Form } from "@/components/AppForm";
import { Honeypot } from "@/components/Honeypot";
import { PublicAttachmentField } from "@/components/PublicAttachmentField";
import { applyApiErrorsToForm } from "@/lib/formErrors";
import { toSelectOptions } from "@/lib/siteContent";
import { useToast } from "@/lib/toast";

// Real, rendered field names — a backend key outside this set surfaces at the
// form level (toast) rather than on a field that never renders.
const FEEDBACK_FIELDS = ["name", "email", "type", "experienceRating", "message", "screenshot"];

export function FeedbackForm({ content, eyebrow, title, intro, onSubmit, submitting = false }) {
  const [form] = Form.useForm();
  const toast = useToast();
  const labels = content.feedback;
  const requiredRule = { required: true, message: content.messages.required };

  // The parent's onSubmit performs the API call and THROWS on failure; catch
  // here so backend validation lands inline on the matching field.
  const handleFinish = async (values) => {
    try {
      const shouldReset = await onSubmit(values);
      if (shouldReset !== false) {
        form.resetFields();
      }
    } catch (error) {
      applyApiErrorsToForm(form, error, {
        knownFields: FEEDBACK_FIELDS,
        toast,
        fallbackMessage: content.messages.submitError
      });
    }
  };

  return (
    <Form form={form} layout="vertical" className="content-card form-card" onFinish={handleFinish}>
      {(eyebrow || title || intro) && (
        <header className="form-card-heading">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          {title && <h1>{title}</h1>}
          {intro && <p>{intro}</p>}
        </header>
      )}
      <div className="form-grid">
        <Form.Item name="name" label={labels.name} rules={[requiredRule]}>
          <Input autoFocus placeholder={content.placeholders.name} />
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
        <Form.Item name="screenshot" label={labels.screenshot} className="wide-field" valuePropName="value">
          <PublicAttachmentField copy={labels.screenshotUpload} />
        </Form.Item>
      </div>
      <Honeypot />
      <Button type="primary" htmlType="submit" size="large" icon={<MessageOutlined />} loading={submitting} block>
        {labels.submit}
      </Button>
    </Form>
  );
}
