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
  isImageUpload
} from "@/lib/adminUtils";
import { useToast } from "@/lib/toast";

const EDITABLE_FIELDS = [
  "title",
  "description",
  "category",
  "addressText",
  "latitude",
  "longitude",
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
  if (coverUrl) {
    data.cover = { url: coverUrl };
  }

  const uploads = Array.isArray(issue?.uploads) ? issue.uploads : [];
  const additionalImages = uploads
    .filter(isImageUpload)
    .filter((upload) => upload.url !== coverUrl)
    .map((upload) => ({ id: upload.id, url: upload.url }));
  data.additionalImages = additionalImages;

  return data;
}

function sameIdSet(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
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

  const initialValues = useMemo(() => (issue ? pickEditableFields(issue) : null), [issue]);

  const handleFinish = async (values) => {
    setSubmitting(true);

    const { cover, additionalImages, ...rest } = values;
    const originalCoverUrl = initialValues?.cover?.url || null;
    const nextCoverUrl = cover?.url || null;

    const payload = { ...rest };
    if (nextCoverUrl !== originalCoverUrl) {
      payload.coverImage = nextCoverUrl;
    }

    const originalIds = (initialValues?.additionalImages || []).map((image) => image.id);
    const nextIds = Array.isArray(additionalImages)
      ? additionalImages.map((image) => image.id)
      : [];
    if (!sameIdSet(originalIds, nextIds)) {
      payload.uploadIds = nextIds;
    }

    try {
      await patchJson(`/issues/${issueId}`, payload, { requireAuth: true });
      toast.success("Issue updated.");
      router.push("/admin/issues");
    } catch (error) {
      toast.error(error.message || "Could not update issue.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminShell title="Edit issue">
      <section className="admin-panel">
        <AdminPanelHeading
          eyebrow="Community issues"
          title={issue?.title ? `Edit: ${issue.title}` : "Edit issue"}
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
          />
        ) : null}
      </section>
    </AdminShell>
  );
}
