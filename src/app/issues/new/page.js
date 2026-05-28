"use client";

import { EnvironmentOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Form, Input, InputNumber, Select, Spin, Tag } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePreferences } from "@/app/providers";
import { IssueCoverUpload } from "@/components/admin/IssueCoverUpload";
import { SiteShell } from "@/components/SiteShell";
import { postJson } from "@/lib/apiClient";
import { ISSUE_CATEGORIES } from "@/lib/adminUtils";
import { getAuthSession } from "@/lib/authSession";
import { copy } from "@/lib/siteContent";
import { useToast } from "@/lib/toast";

const NEW_ISSUE_PATH = "/issues/new";

const coverImageValidator = (message) => (_rule, cover) =>
  cover?.id ? Promise.resolve() : Promise.reject(new Error(message));

export default function NewIssuePage() {
  const router = useRouter();
  const { language } = usePreferences();
  const t = copy[language] ?? copy.np;
  const labels = t.issueNew;
  const fields = labels.fields;
  const messageApi = useToast();
  const [form] = Form.useForm();
  const [authChecked, setAuthChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [showManualCoords, setShowManualCoords] = useState(false);

  useEffect(() => {
    const session = getAuthSession();

    if (!session?.user) {
      messageApi.info(labels.authRequiredMessage);
      router.replace(`/login?next=${encodeURIComponent(NEW_ISSUE_PATH)}`);
      return;
    }

    setAuthChecked(true);
  }, [router, messageApi, labels.authRequiredMessage]);

  const categoryOptions = ISSUE_CATEGORIES.map((value) => ({
    value,
    label: labels.categories[value] ?? value
  }));

  const handleDetectLocation = () => {
    if (typeof window === "undefined" || !navigator?.geolocation) {
      setLocationError(fields.locationUnsupported);
      setShowManualCoords(true);
      return;
    }

    setDetecting(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setFieldsValue({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6))
        });
        setLocationDetected(true);
        setDetecting(false);
      },
      () => {
        setLocationError(fields.locationDenied);
        setShowManualCoords(true);
        setDetecting(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleSubmit = async (values) => {
    const cover = values.cover;
    const payload = {
      title: values.title,
      description: values.description,
      category: values.category,
      addressText: values.addressText,
      latitude: values.latitude,
      longitude: values.longitude,
      coverImageId: cover.id
    };

    setSubmitting(true);

    try {
      const response = await postJson("/issues", payload, { requireAuth: true });
      messageApi.success(labels.successMessage);
      const newId = response?.data?.id ?? response?.id;

      if (newId) {
        router.push(`/issues/${newId}`);
      } else {
        router.push("/issues");
      }
    } catch (error) {
      messageApi.error(error.message || t.messages.submitError);
    } finally {
      setSubmitting(false);
    }
  };

  if (!authChecked) {
    return (
      <SiteShell pageTitle={labels.title}>
        <section className="page-section">
          <div className="content-card" style={{ display: "grid", placeItems: "center", padding: 64 }}>
            <Spin size="large" />
          </div>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell pageTitle={labels.title}>
      <section className="page-section new-issue-section">
        <Form
          form={form}
          layout="vertical"
          className="content-card form-card new-issue-form"
          initialValues={{ category: "ROADSIDE" }}
          onFinish={handleSubmit}
        >
          <header className="form-card-heading">
            <span className="eyebrow">{labels.eyebrow}</span>
            <h1>{labels.title}</h1>
            <p>{labels.intro}</p>
          </header>

          <Form.Item
            name="cover"
            label={fields.cover}
            required
            valuePropName="value"
            rules={[{ validator: coverImageValidator(fields.coverRequired) }]}
          >
            <IssueCoverUpload />
          </Form.Item>

          <Form.Item
            name="title"
            label={fields.title}
            rules={[{ required: true, message: fields.titleRequired }]}
          >
            <Input maxLength={140} placeholder={fields.titlePlaceholder} />
          </Form.Item>

          <Form.Item
            name="description"
            label={fields.description}
            rules={[{ required: true, message: fields.descriptionRequired }]}
          >
            <Input.TextArea
              rows={6}
              maxLength={2000}
              showCount
              placeholder={fields.descriptionPlaceholder}
            />
          </Form.Item>

          <Form.Item
            name="category"
            label={fields.category}
            rules={[{ required: true, message: fields.categoryRequired }]}
          >
            <Select options={categoryOptions} placeholder={fields.categoryPlaceholder} />
          </Form.Item>

          <Form.Item
            name="addressText"
            label={fields.address}
            rules={[{ required: true, message: fields.addressRequired }]}
          >
            <Input placeholder={fields.addressPlaceholder} />
          </Form.Item>

          <div className="new-issue-location-block">
            <div className="new-issue-location-header">
              <span className="ant-form-item-label">
                <label>{fields.location}</label>
              </span>
              {locationDetected ? (
                <Tag color="green" icon={<EnvironmentOutlined />}>
                  {fields.locationDetected}
                </Tag>
              ) : null}
            </div>
            <div className="new-issue-location-actions">
              <Button
                icon={<EnvironmentOutlined />}
                loading={detecting}
                onClick={handleDetectLocation}
              >
                {detecting ? fields.locationDetecting : fields.locationDetect}
              </Button>
              {!showManualCoords ? (
                <Button type="link" onClick={() => setShowManualCoords(true)}>
                  {fields.locationManualToggle}
                </Button>
              ) : null}
            </div>
            {locationError ? (
              <p className="new-issue-location-error">{locationError}</p>
            ) : null}
          </div>

          <div
            className="new-issue-coords-grid"
            style={{ display: showManualCoords || locationDetected ? "grid" : "none" }}
          >
            <Form.Item
              name="latitude"
              label={fields.latitude}
              rules={[
                { required: true, message: fields.latitudeRequired },
                { type: "number", min: -90, max: 90, message: fields.latitudeRange }
              ]}
            >
              <InputNumber style={{ width: "100%" }} step={0.0001} placeholder="28.2130" />
            </Form.Item>
            <Form.Item
              name="longitude"
              label={fields.longitude}
              rules={[
                { required: true, message: fields.longitudeRequired },
                { type: "number", min: -180, max: 180, message: fields.longitudeRange }
              ]}
            >
              <InputNumber style={{ width: "100%" }} step={0.0001} placeholder="83.9570" />
            </Form.Item>
          </div>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            icon={<SendOutlined />}
            loading={submitting}
            block
          >
            {labels.submit}
          </Button>
        </Form>
      </section>
    </SiteShell>
  );
}
