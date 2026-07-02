"use client";

import { CheckCircleOutlined } from "@ant-design/icons";
import { Button, DatePicker, Form, Input, Modal } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { postJson } from "@/lib/apiClient";
import { useToast } from "@/lib/toast";

const isDemoId = (id) => typeof id === "string" && id.startsWith("demo-");

export function LeaderCompleteEditor({ event, content, onSaved }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const messageApi = useToast();

  const initialValues = {
    resultSummary: event?.resultSummary || "",
    completedAt: event?.completedAt ? dayjs(event.completedAt) : dayjs()
  };

  const handleOpen = () => {
    form.resetFields();
    form.setFieldsValue(initialValues);
    setOpen(true);
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      const completedAtIso = (values.completedAt || dayjs()).toISOString();
      const payload = {
        resultSummary: values.resultSummary.trim(),
        completedAt: completedAtIso
      };

      if (isDemoId(event?.id)) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        messageApi.success(content.demoSuccessToast || content.successToast);
        setOpen(false);
        onSaved?.({
          ...event,
          status: "COMPLETED",
          completedAt: completedAtIso,
          resultSummary: payload.resultSummary
        });
        return;
      }

      await postJson(`/events/${event.id}/complete`, payload, {
        requireAuth: true
      });

      messageApi.success(content.successToast);
      setOpen(false);
      onSaved?.();
    } catch (error) {
      const status = error?.status;
      if (status === 403) {
        messageApi.error(content.forbiddenToast);
      } else if (status === 409) {
        messageApi.error(content.conflictToast);
      } else {
        messageApi.error(error?.message || content.errorToast);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        type="primary"
        icon={<CheckCircleOutlined />}
        onClick={handleOpen}
        className="leader-complete-cta"
      >
        {content.openCta}
      </Button>

      <Modal
        open={open}
        title={content.modalTitle}
        onCancel={() => (saving ? null : setOpen(false))}
        confirmLoading={saving}
        okText={content.submit}
        cancelText={content.cancel}
        onOk={() => form.submit()}
        width={640}
      >
        <p className="leader-complete-intro">{content.intro}</p>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={initialValues}
          className="admin-form leader-complete-form"
          disabled={saving}
        >
          <Form.Item
            label={content.completedAtLabel}
            name="completedAt"
            help={content.completedAtHelp}
            rules={[
              { required: true, message: content.completedAtRequired },
              {
                validator: (_, value) =>
                  !value || !value.isAfter(dayjs())
                    ? Promise.resolve()
                    : Promise.reject(new Error(content.completedAtPast))
              }
            ]}
          >
            <DatePicker
              showTime={{ format: "HH:mm" }}
              format="YYYY-MM-DD HH:mm"
              placeholder={content.completedAtPlaceholder}
              style={{ width: "100%" }}
              disabledDate={(current) => current && current.isAfter(dayjs())}
            />
          </Form.Item>

          <Form.Item
            label={content.resultSummaryLabel}
            name="resultSummary"
            help={content.resultSummaryHelp}
            rules={[
              { required: true, whitespace: true, message: content.resultSummaryRequired },
              { min: 12, message: content.resultSummaryTooShort }
            ]}
          >
            <Input.TextArea
              rows={5}
              placeholder={content.resultSummaryPlaceholder}
              maxLength={2000}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
