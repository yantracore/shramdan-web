"use client";

import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Empty, Spin } from "antd";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { AdminPanelHeading } from "@/components/admin/AdminPanelHeading";
import { IssueForm } from "@/components/admin/IssueForm";
import { getJson, patchJson } from "@/lib/apiClient";
import {
  getIssueCoverImageUrl,
  getResponseData,
  isImageUpload,
  localizeIssue
} from "@/lib/adminUtils";
import { useToast } from "@/lib/toast";

const EDITABLE_FIELDS = [
  "title",
  "description",
  "category",
  "addressText",
  "latitude",
  "longitude",
  "provinceId",
  "districtId",
  "municipality",
  "ward"
];

function pickEditableFields(issue) {
  const data = EDITABLE_FIELDS.reduce((acc, key) => {
    if (issue?.[key] !== undefined && issue?.[key] !== null) {
      acc[key] = issue[key];
    }
    return acc;
  }, {});

  const coverUrl = getIssueCoverImageUrl(issue);
  const coverId = issue?.coverImageId || null;
  if (coverUrl || coverId) {
    data.cover = { id: coverId, url: coverUrl };
  }

  const uploads = Array.isArray(issue?.uploads) ? issue.uploads : [];
  const additionalImages = uploads
    .filter(isImageUpload)
    .filter((upload) => upload.id !== coverId && upload.url !== coverUrl)
    .map((upload) => ({ id: upload.id, url: upload.url }));
  data.additionalImages = additionalImages;

  return data;
}

export default function AdminIssueEditPage() {
  const router = useRouter();
  const params = useParams();
  const issueId = params?.id;
  const toast = useToast();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadIssue = useCallback(async () => {
    if (!issueId) return;
    setLoading(true);
    setLoadError("");

    try {
      const response = await getJson(`/issues/${issueId}`, { requireAuth: true });
      const data = getResponseData(response, null);
      if (!data) {
        setLoadError("Issue not found.");
        setIssue(null);
        return;
      }
      setIssue(data);
    } catch (error) {
      setLoadError(error.message || "Could not load issue.");
      setIssue(null);
    } finally {
      setLoading(false);
    }
  }, [issueId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadIssue();
  }, [loadIssue]);

  // The API returns title/description as a translations[] array, not as
  // top-level fields, so seed the form from the localized view. Admin is
  // EN-only, hence the "en" locale (mirrors the member edit page).
  const localizedIssue = useMemo(
    () => (issue ? localizeIssue(issue, "en") : null),
    [issue]
  );
  const initialValues = useMemo(
    () => (localizedIssue ? pickEditableFields(localizedIssue) : null),
    [localizedIssue]
  );

  const handleFinish = async (values) => {
    setSubmitting(true);

    // PATCH /issues/{id} now accepts `uploadIds` (shipped 2026-06-30), so the
    // additional-images set is editable. Mirror POST /issues: `uploadIds` is the
    // additional gallery (cover is carried separately via `coverImageId`). Send
    // the full current set so removals persist (replace semantics).
    const { cover, additionalImages, ...rest } = values;
    const originalCoverId = initialValues?.cover?.id || null;
    const nextCoverId = cover?.id || null;

    const payload = { ...rest };
    // PATCH /issues/{id} requires `language` whenever title or description
    // is part of the update — it tells the backend which locale the edited
    // text is in so it can re-translate. Admin is EN-only, so "en".
    if ("title" in rest || "description" in rest) {
      payload.language = "en";
    }
    if (nextCoverId !== originalCoverId) {
      payload.coverImageId = nextCoverId;
    }
    const nextUploadIds = (Array.isArray(additionalImages) ? additionalImages : [])
      .map((image) => image?.id)
      .filter(Boolean);
    const originalUploadIds = (Array.isArray(initialValues?.additionalImages)
      ? initialValues.additionalImages
      : [])
      .map((image) => image?.id)
      .filter(Boolean);
    const uploadsChanged =
      nextUploadIds.length !== originalUploadIds.length ||
      nextUploadIds.some((id, i) => id !== originalUploadIds[i]);
    if (uploadsChanged) {
      payload.uploadIds = nextUploadIds;
    }

    // No catch here: a failure (including backend validation) propagates into
    // IssueForm, which pins each error onto its field. `finally` still clears
    // the submitting state before the throw reaches the form.
    try {
      await patchJson(`/issues/${issueId}`, payload, { requireAuth: true });
      toast.success("Issue updated.");
      router.push("/admin/issues");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminShell title="Edit issue">
      <section className="admin-panel">
        <AdminPanelHeading
          eyebrow="Community issues"
          title={localizedIssue?.title ? `Edit: ${localizedIssue.title}` : "Edit issue"}
          description="Update issue details. Status changes go through the per-row status control on the issues list."
          actions={
            <Link href="/admin/issues">
              <Button icon={<ArrowLeftOutlined />}>Back to issues</Button>
            </Link>
          }
        />

        {loading ? (
          <div className="admin-modal-loading">
            <Spin />
          </div>
        ) : null}

        {!loading && loadError ? (
          <Empty description={loadError}>
            <Button onClick={loadIssue} type="primary">
              Try again
            </Button>
          </Empty>
        ) : null}

        {!loading && !loadError && initialValues ? (
          <IssueForm
            initialValues={initialValues}
            submitting={submitting}
            submitLabel="Save changes"
            onSubmit={handleFinish}
            submitErrorMessage="Could not update issue."
          />
        ) : null}
      </section>
    </AdminShell>
  );
}
