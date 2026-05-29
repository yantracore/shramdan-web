"use client";

import { SendOutlined } from "@ant-design/icons";
import { Button, Form, Input, Select, Spin } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { usePreferences } from "@/app/providers";
import { IssueCoverUpload } from "@/components/admin/IssueCoverUpload";
import { IssueImagesUpload } from "@/components/admin/IssueImagesUpload";
import IssueLocationPickerBlock from "@/components/IssueLocationPickerBlock";
import { SiteShell } from "@/components/SiteShell";
import { postJson } from "@/lib/apiClient";
import { ISSUE_CATEGORIES } from "@/lib/adminUtils";
import { getAuthSession } from "@/lib/authSession";
import { copy } from "@/lib/siteContent";
import { useToast } from "@/lib/toast";

const NEW_ISSUE_PATH = "/issues/new";

const coverImageValidator = (message) => (_rule, cover) =>
  cover?.id ? Promise.resolve() : Promise.reject(new Error(message));

const locationValidator = (message) => (_rule, location) => {
  if (
    location &&
    Number.isFinite(location.lat) &&
    Number.isFinite(location.lng)
  ) {
    return Promise.resolve();
  }
  return Promise.reject(new Error(message));
};

function FormLocationField({ value, onChange, ...rest }) {
  return (
    <IssueLocationPickerBlock value={value} onChange={onChange} {...rest} />
  );
}

export default function NewIssuePage() {
  const router = useRouter();
  const { language } = usePreferences();
  const t = copy[language] ?? copy.np;
  const labels = t.issueNew;
  const fields = labels.fields;
  const pickerLabels = fields.picker;
  const messageApi = useToast();
  const [form] = Form.useForm();
  const [authChecked, setAuthChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const addressTouchedRef = useRef(false);

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

  const handleAddressSuggestion = (suggested) => {
    if (addressTouchedRef.current) return;
    if (!suggested) return;
    form.setFieldsValue({ addressText: suggested });
  };

  const handleAddressFieldChange = () => {
    addressTouchedRef.current = true;
  };

  const handleSubmit = async (values) => {
    const cover = values.cover;
    const location = values.location || {};
    const additionalImages = Array.isArray(values.additionalImages)
      ? values.additionalImages
      : [];
    const payload = {
      title: values.title,
      description: values.description,
      category: values.category,
      addressText: values.addressText,
      latitude: location.lat,
      longitude: location.lng,
      coverImageId: cover.id
    };
    if (additionalImages.length) {
      payload.uploadIds = additionalImages.map((image) => image.id);
    }

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
            name="additionalImages"
            label={fields.additionalImages}
            valuePropName="value"
          >
            <IssueImagesUpload />
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
            name="location"
            label={fields.location}
            rules={[{ validator: locationValidator(fields.locationRequired) }]}
          >
            <FormLocationField
              language={language}
              labels={pickerLabels}
              onAddressSuggestion={handleAddressSuggestion}
              onLocationError={setLocationError}
            />
          </Form.Item>
          {locationError ? (
            <p className="new-issue-location-error">{locationError}</p>
          ) : null}

          <Form.Item
            name="addressText"
            label={fields.address}
            extra={fields.addressFromMap}
            rules={[{ required: true, message: fields.addressRequired }]}
          >
            <Input
              placeholder={fields.addressPlaceholder}
              onChange={handleAddressFieldChange}
            />
          </Form.Item>

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
