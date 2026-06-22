"use client";

// VideoUploadPanel — roadmap 7.3.
// Surface for Photographer / Livestreamer / Leader role on a
// completed event to attach a long-form recap video. Demo mode
// simulates the upload + appends to event.videos array. Real flow
// would three-step through /uploads/presign + R2 PUT +
// /events/{id}/videos POST.

import { CheckCircleFilled, UploadOutlined, VideoCameraOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, Upload } from "antd";
import { useState } from "react";
import { useToast } from "@/lib/toast";

const isDemoId = (id) => typeof id === "string" && id.startsWith("demo-");

const COPY = {
  np: {
    eyebrow: "रेकर्डिङ अपलोड",
    title: "अभियानको लामो भिडियो",
    intro:
      "लाइभस्ट्रिमरले रेकर्ड गरेको ३० मिनेट+ को सम्पादित भिडियो यहाँ अपलोड गर्नुहोस्। यो अभियान पृष्ठ र /stories मा देखिनेछ।",
    titleLabel: "भिडियो शीर्षक",
    titlePlaceholder: "उदाहरण: गुह्येश्वरी सरसफाइ — पूर्ण वर्णन",
    descriptionLabel: "विवरण",
    descriptionPlaceholder:
      "के देखिन्छ, कति लम्बाइ, कुन भागहरू समावेश छन्।",
    videoFileLabel: "भिडियो फाइल",
    videoFileHint: "MP4 वा MOV, अधिकतम ५०० MB।",
    chooseFileCta: "फाइल छान्ने",
    submitCta: "अपलोड गर्ने",
    requiredField: "अनिवार्य",
    successToast: "भिडियो अपलोड भयो।",
    demoSuccessToast: "डेमो मा भिडियो दर्ता भयो (स्थानीय)।",
    errorToast: "अपलोड गर्न सकिएन। फेरि प्रयास गर्नुहोस्।",
    existingHeading: "अहिलेसम्म दर्ता",
    countSuffix: "{n} भिडियो"
  },
  en: {
    eyebrow: "Footage upload",
    title: "Event long-form video",
    intro:
      "Upload the edited 30+ minute footage from the livestreamer. It will appear on the event page and in /stories.",
    titleLabel: "Video title",
    titlePlaceholder: "e.g. Guheshwari cleanup — full recap",
    descriptionLabel: "Description",
    descriptionPlaceholder:
      "What's in it, how long, which segments are covered.",
    videoFileLabel: "Video file",
    videoFileHint: "MP4 or MOV, up to 500 MB.",
    chooseFileCta: "Choose file",
    submitCta: "Upload",
    requiredField: "Required",
    successToast: "Video uploaded.",
    demoSuccessToast: "Video recorded in demo (local only).",
    errorToast: "Could not upload. Please try again.",
    existingHeading: "Already attached",
    countSuffix: "{n} videos"
  }
};

export function VideoUploadPanel({ event, language = "np", canUpload, onChanged }) {
  const t = COPY[language] || COPY.np;
  const messageApi = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const videos = Array.isArray(event?.videos) ? event.videos : [];

  if (!canUpload && videos.length === 0) return null;

  const handleSubmit = async (values) => {
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const optimistic = {
      id: `vid-${Date.now()}`,
      title: values.title.trim(),
      description: values.description ? values.description.trim() : "",
      filename: values.video?.[0]?.name || "footage.mp4",
      createdAt: new Date().toISOString()
    };
    setSubmitting(false);
    form.resetFields();
    if (isDemoId(event?.id)) {
      messageApi.success(t.demoSuccessToast);
    } else {
      messageApi.success(t.successToast);
    }
    onChanged?.({ ...event, videos: [optimistic, ...videos] });
  };

  return (
    <section className="video-upload-panel" aria-labelledby="video-upload-title">
      <header className="video-upload-header">
        <span className="eyebrow">
          <VideoCameraOutlined aria-hidden="true" /> {t.eyebrow}
        </span>
        <h2 id="video-upload-title">{t.title}</h2>
        <p>{t.intro}</p>
      </header>

      {videos.length > 0 ? (
        <div className="video-upload-existing">
          <span className="video-upload-existing-label">
            {t.existingHeading} · {t.countSuffix.replace("{n}", videos.length)}
          </span>
          <ul className="video-upload-list">
            {videos.map((video) => (
              <li key={video.id} className="video-upload-item">
                <CheckCircleFilled aria-hidden="true" />
                <div>
                  <strong>{video.title}</strong>
                  {video.description ? <p>{video.description}</p> : null}
                  <span className="video-upload-item-meta">{video.filename}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {canUpload ? (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={submitting}
          className="video-upload-form"
        >
          <Form.Item
            label={t.titleLabel}
            name="title"
            rules={[{ required: true, message: t.requiredField }]}
          >
            <Input placeholder={t.titlePlaceholder} maxLength={140} />
          </Form.Item>
          <Form.Item label={t.descriptionLabel} name="description">
            <Input.TextArea
              rows={3}
              placeholder={t.descriptionPlaceholder}
              maxLength={500}
              showCount
            />
          </Form.Item>
          <Form.Item
            label={t.videoFileLabel}
            name="video"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList || [])}
            help={t.videoFileHint}
            rules={[{ required: true, message: t.requiredField }]}
          >
            <Upload beforeUpload={() => false} maxCount={1} accept="video/mp4,video/quicktime">
              <Button icon={<UploadOutlined />}>{t.chooseFileCta}</Button>
            </Upload>
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting} size="large">
            {t.submitCta}
          </Button>
        </Form>
      ) : null}
    </section>
  );
}
