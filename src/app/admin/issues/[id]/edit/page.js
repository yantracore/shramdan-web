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
import { getFirstIssueImage, getResponseData } from "@/lib/adminUtils";
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

  const coverImage = getFirstIssueImage(issue);
  if (coverImage) {
    data.cover = { id: coverImage.id, url: coverImage.url };
  }

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

  const initialValues = useMemo(() => (issue ? pickEditableFields(issue) : null), [issue]);

  const handleFinish = async (values) => {
    setSubmitting(true);

    const { cover, ...rest } = values;
    const originalCoverId = initialValues?.cover?.id || null;
    const nextCoverId = cover?.id || null;

    const payload = { ...rest };
    if (nextCoverId !== originalCoverId) {
      payload.uploadIds = nextCoverId ? [nextCoverId] : [];
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
