"use client";

import { ScheduleOutlined } from "@ant-design/icons";
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal
} from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { patchJson } from "@/lib/apiClient";
import { useToast } from "@/lib/toast";

const COORD_PATTERN = /^-?\d+(\.\d+)?$/;

export function LeaderScheduleEditor({ event, content, onSaved }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const messageApi = useToast();

  const issueLat = event?.issue?.latitude;
  const issueLng = event?.issue?.longitude;

  const initialValues = {
    scheduledAt: event?.scheduledAt ? dayjs(event.scheduledAt) : null,
    durationMinutes: event?.durationMinutes ?? undefined,
    meetupAddress:
      event?.meetupAddress || event?.issue?.addressText || "",
    meetupNotes: event?.meetupNotes || "",
    meetupLatitude:
      event?.meetupLatitude != null
        ? String(event.meetupLatitude)
        : issueLat != null
          ? String(issueLat)
          : "",
    meetupLongitude:
      event?.meetupLongitude != null
        ? String(event.meetupLongitude)
        : issueLng != null
          ? String(issueLng)
          : "",
    planningNotes: event?.planningNotes || ""
  };

  const handleOpen = () => {
    form.resetFields();
    form.setFieldsValue(initialValues);
    setOpen(true);
  };

  const handleUseIssueLocation = () => {
    form.setFieldsValue({
      meetupAddress: event?.issue?.addressText || "",
      meetupLatitude: issueLat != null ? String(issueLat) : "",
      meetupLongitude: issueLng != null ? String(issueLng) : ""
    });
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      const payload = {
        scheduledAt: values.scheduledAt.toISOString()
      };
      if (values.durationMinutes != null && values.durationMinutes !== "") {
        payload.durationMinutes = Number(values.durationMinutes);
      }
      if (values.meetupAddress) payload.meetupAddress = values.meetupAddress.trim();
      if (values.meetupNotes) payload.meetupNotes = values.meetupNotes.trim();
      if (values.planningNotes) payload.planningNotes = values.planningNotes.trim();
      if (values.meetupLatitude) payload.meetupLatitude = Number(values.meetupLatitude);
      if (values.meetupLongitude) payload.meetupLongitude = Number(values.meetupLongitude);

      await patchJson(`/events/${event.id}/schedule`, payload, {
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
        icon={<ScheduleOutlined />}
        onClick={handleOpen}
        className="leader-schedule-cta"
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
        <p className="leader-schedule-intro">{content.intro}</p>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={initialValues}
          className="admin-form leader-schedule-form"
          disabled={saving}
        >
          <Form.Item
            label={content.scheduledAtLabel}
            name="scheduledAt"
            rules={[
              { required: true, message: content.scheduledAtRequired },
              {
                validator: (_, value) =>
                  !value || value.isAfter(dayjs())
                    ? Promise.resolve()
                    : Promise.reject(new Error(content.scheduledAtFuture))
              }
            ]}
          >
            <DatePicker
              showTime={{ format: "HH:mm" }}
              format="YYYY-MM-DD HH:mm"
              placeholder={content.scheduledAtPlaceholder}
              style={{ width: "100%" }}
              disabledDate={(current) => current && current.isBefore(dayjs().startOf("day"))}
            />
          </Form.Item>

          <Form.Item
            label={content.durationLabel}
            name="durationMinutes"
            help={content.durationHelp}
          >
            <InputNumber
              min={15}
              max={24 * 60}
              step={15}
              placeholder={content.durationPlaceholder}
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item label={content.meetupAddressLabel} name="meetupAddress">
            <Input placeholder={content.meetupAddressPlaceholder} maxLength={240} />
          </Form.Item>

          <Form.Item label={content.meetupNotesLabel} name="meetupNotes">
            <Input.TextArea
              rows={2}
              placeholder={content.meetupNotesPlaceholder}
              maxLength={500}
              showCount
            />
          </Form.Item>

          <div className="leader-schedule-coords">
            <Form.Item
              label={content.latitudeLabel}
              name="meetupLatitude"
              rules={[
                {
                  pattern: COORD_PATTERN,
                  message: content.coordsInvalid
                }
              ]}
            >
              <Input placeholder="28.213" inputMode="decimal" />
            </Form.Item>
            <Form.Item
              label={content.longitudeLabel}
              name="meetupLongitude"
              rules={[
                {
                  pattern: COORD_PATTERN,
                  message: content.coordsInvalid
                }
              ]}
            >
              <Input placeholder="83.957" inputMode="decimal" />
            </Form.Item>
          </div>

          {(issueLat != null && issueLng != null) ? (
            <Button
              size="small"
              type="link"
              onClick={handleUseIssueLocation}
              className="leader-schedule-use-issue"
            >
              {content.useIssueLocation}
            </Button>
          ) : null}

          <Form.Item
            label={content.planningNotesLabel}
            name="planningNotes"
            help={content.planningNotesHelp}
          >
            <Input.TextArea
              rows={3}
              placeholder={content.planningNotesPlaceholder}
              maxLength={2000}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
