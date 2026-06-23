"use client";

import { SaveOutlined } from "@ant-design/icons";
import { Button, Input, Select } from "antd";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Form } from "@/components/AppForm";
import { IssueCoverUpload } from "@/components/admin/IssueCoverUpload";
import { IssueImagesUpload } from "@/components/admin/IssueImagesUpload";
import IssueLocationPickerBlock from "@/components/IssueLocationPickerBlock";
import {
  ISSUE_CATEGORIES,
  ISSUE_FORM_FIELDS,
  ISSUE_FORM_FIELD_MAP,
  buildEnumOptions
} from "@/lib/adminUtils";
import { applyApiErrorsToForm } from "@/lib/formErrors";
import { buildIssueTextRules } from "@/lib/issueFormValidation";
import { useToast } from "@/lib/toast";

// English defaults keep the admin control center (EN-only) behaving exactly
// as before when no `labels` prop is passed. Member-facing surfaces pass a
// localized `labels` object (and optionally `categoryOptions`) so the same
// form renders bilingually without forking the component.
const DEFAULT_LABELS = {
  cover: "Cover image",
  coverRequired: "Cover image is required.",
  additionalImages: "Additional images (optional)",
  title: "Title",
  titleRequired: "Title is required.",
  titlePlaceholder: "Short, specific summary of the issue",
  titleMinChars: "Make the title a bit longer — at least {n} characters.",
  titleMinWords: "Use at least {n} words in the title.",
  titleHint: "At least {c} characters and {w} words.",
  description: "Description",
  descriptionRequired: "Description is required.",
  descriptionPlaceholder: "What is happening, who is affected, and what needs to change?",
  descriptionMinChars: "Add a bit more detail — at least {n} characters.",
  descriptionMinWords: "Use at least {n} words in the description.",
  descriptionHint: "At least {c} characters and {w} words.",
  category: "Category",
  categoryRequired: "Category is required.",
  categoryPlaceholder: "Select category",
  address: "Address",
  addressRequired: "Address is required.",
  addressPlaceholder: "Lakeside, Pokhara",
  addressFromMap: "Suggested from the map — refine with a tole or nearby landmark.",
  location: "Location",
  locationRequired: "Drop a pin on the map to set the location.",
  picker: {
    searchPlaceholder: "Search a place (e.g. Tarakeshwar, Kathmandu)",
    searchClear: "Clear search",
    searchLoading: "Searching...",
    searchEmpty: "No matches found.",
    hint: "Tap on the map to drop a pin, or use search to navigate.",
    useMyLocation: "My location",
    detecting: "Detecting...",
    locationDenied: "Browser denied permission — tap on the map to drop a pin.",
    locationUnsupported:
      "Your browser does not support location services — tap on the map to drop a pin.",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit fullscreen",
    region: {
      provinceLabel: "Province",
      provincePlaceholder: "Select province",
      districtLabel: "District",
      districtPlaceholder: "Select district",
      resolving: "Detecting province / district..."
    }
  },
  municipality: "Municipality (optional)",
  municipalityPlaceholder: "Pokhara Metropolitan City",
  ward: "Ward (optional)",
  wardPlaceholder: "6",
  cancel: "Cancel",
  // Shown on the additional-images field while photo editing is deferred —
  // PATCH /issues rejects uploadIds (see docs/api-requirements/issues.md).
  additionalImagesLocked:
    "Photo editing isn't available yet — your other changes still save."
};

export function IssueForm({
  initialValues,
  onSubmit,
  submitting = false,
  submitLabel = "Save",
  cancelHref = "/admin/issues",
  labels,
  categoryOptions,
  language = "en",
  submitErrorMessage,
  extraImagesLocked = false
}) {
  const [form] = Form.useForm();
  const toast = useToast();
  const L = useMemo(() => ({ ...DEFAULT_LABELS, ...(labels || {}) }), [labels]);
  const categorySelectOptions = useMemo(
    () => categoryOptions || buildEnumOptions(ISSUE_CATEGORIES),
    [categoryOptions]
  );
  // Same min char/word floors + hints the public reporter enforces, localized
  // via the merged labels. See lib/issueFormValidation.js.
  const issueTextRules = useMemo(() => buildIssueTextRules(L, language), [L, language]);

  const [locationError, setLocationError] = useState(null);
  // The address is already authored on every edit surface, so treat it as
  // user-owned from the start — dragging the pin must not silently overwrite
  // a saved address. We only auto-fill when the field came in empty.
  const addressTouchedRef = useRef(Boolean(initialValues?.addressText));

  // The form speaks `location: { lat, lng }` to the map picker, but the API
  // contract (and the parent pages) speak `latitude` / `longitude`. Seed the
  // picker from the stored coordinates on the way in...
  const formInitialValues = useMemo(() => {
    const base = initialValues || { category: "ROADSIDE" };
    const lat = Number(base.latitude);
    const lng = Number(base.longitude);
    return Number.isFinite(lat) && Number.isFinite(lng)
      ? {
          ...base,
          location: {
            lat,
            lng,
            provinceId: base.provinceId ?? null,
            districtId: base.districtId ?? null
          }
        }
      : base;
  }, [initialValues]);

  const coverImageValidator = useMemo(
    () => (_, cover) =>
      cover?.url ? Promise.resolve() : Promise.reject(new Error(L.coverRequired)),
    [L.coverRequired]
  );

  const locationValidator = useMemo(
    () => (_, location) =>
      location && Number.isFinite(location.lat) && Number.isFinite(location.lng)
        ? Promise.resolve()
        : Promise.reject(new Error(L.locationRequired)),
    [L.locationRequired]
  );

  useEffect(() => {
    if (formInitialValues) {
      form.setFieldsValue(formInitialValues);
      addressTouchedRef.current = Boolean(formInitialValues.addressText);
    }
  }, [form, formInitialValues]);

  const handleAddressSuggestion = (suggested) => {
    if (addressTouchedRef.current || !suggested) return;
    form.setFieldsValue({ addressText: suggested });
  };

  const handleAddressFieldChange = () => {
    addressTouchedRef.current = true;
  };

  // ...and translate `location` back into `latitude` / `longitude` on the way
  // out, so neither the API payload nor the parent pages ever see `location`.
  // The parent's onSubmit performs the API call and THROWS on failure; we catch
  // here so backend validation errors land inline on the right field (the map
  // pin counts as the `location` field) instead of only a toast.
  const handleFinish = async (values) => {
    const { location, ...rest } = values;
    if (location && Number.isFinite(location.lat) && Number.isFinite(location.lng)) {
      rest.latitude = location.lat;
      rest.longitude = location.lng;
      // Province + district ride along inside `location` (resolved from the
      // pin); hand them to the API as top-level ids. Null → compactPayload
      // drops them and the backend re-resolves from the coordinates.
      rest.provinceId = location.provinceId ?? null;
      rest.districtId = location.districtId ?? null;
    }
    try {
      await onSubmit(rest);
    } catch (error) {
      applyApiErrorsToForm(form, error, {
        fieldMap: ISSUE_FORM_FIELD_MAP,
        knownFields: ISSUE_FORM_FIELDS,
        toast,
        fallbackMessage: submitErrorMessage
      });
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      className="admin-form"
      onFinish={handleFinish}
      initialValues={formInitialValues}
    >
      <div className="admin-form-grid">
        <Form.Item
          className="admin-form-wide"
          name="cover"
          label={L.cover}
          required
          rules={[{ validator: coverImageValidator }]}
          valuePropName="value"
        >
          <IssueCoverUpload />
        </Form.Item>

        <Form.Item
          className="admin-form-wide"
          name="additionalImages"
          label={L.additionalImages}
          extra={extraImagesLocked ? L.additionalImagesLocked : undefined}
          valuePropName="value"
        >
          <IssueImagesUpload disabled={extraImagesLocked} />
        </Form.Item>

        <Form.Item
          className="admin-form-wide"
          name="title"
          label={L.title}
          extra={issueTextRules.titleHint}
          validateFirst
          rules={issueTextRules.titleRules}
        >
          <Input maxLength={140} placeholder={L.titlePlaceholder} />
        </Form.Item>

        <Form.Item
          className="admin-form-wide"
          name="description"
          label={L.description}
          extra={issueTextRules.descriptionHint}
          validateFirst
          rules={issueTextRules.descriptionRules}
        >
          <Input.TextArea
            rows={6}
            maxLength={2000}
            showCount
            placeholder={L.descriptionPlaceholder}
          />
        </Form.Item>

        <Form.Item
          name="category"
          label={L.category}
          rules={[{ required: true, message: L.categoryRequired }]}
        >
          <Select options={categorySelectOptions} placeholder={L.categoryPlaceholder} />
        </Form.Item>

        <Form.Item
          className="admin-form-wide"
          name="location"
          label={L.location}
          required
          rules={[{ validator: locationValidator }]}
        >
          <FormLocationField
            language={language}
            labels={L.picker}
            onAddressSuggestion={handleAddressSuggestion}
            onLocationError={setLocationError}
          />
        </Form.Item>
        {locationError ? (
          <p className="admin-form-wide new-issue-location-error">{locationError}</p>
        ) : null}

        <Form.Item
          className="admin-form-wide"
          name="addressText"
          label={L.address}
          extra={L.addressFromMap}
          rules={[{ required: true, whitespace: true, message: L.addressRequired }]}
        >
          <Input placeholder={L.addressPlaceholder} onChange={handleAddressFieldChange} />
        </Form.Item>

        <Form.Item name="municipality" label={L.municipality}>
          <Input placeholder={L.municipalityPlaceholder} />
        </Form.Item>

        <Form.Item name="ward" label={L.ward}>
          <Input placeholder={L.wardPlaceholder} />
        </Form.Item>
      </div>

      <div className="admin-form-actions">
        <Link href={cancelHref}>
          <Button>{L.cancel}</Button>
        </Link>
        <Button
          type="primary"
          htmlType="submit"
          icon={<SaveOutlined />}
          loading={submitting}
        >
          {submitLabel}
        </Button>
      </div>
    </Form>
  );
}

// Bridges the antd Form.Item value/onChange contract to the Leaflet picker,
// which is loaded client-side only (see IssueLocationPickerBlock).
function FormLocationField({ value, onChange, ...rest }) {
  return <IssueLocationPickerBlock value={value} onChange={onChange} {...rest} />;
}
