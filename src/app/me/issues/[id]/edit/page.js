"use client";

// /me/issues/[id]/edit — a member edits their OWN reported issue.
// Backend rule (PATCH /issues/{id}): only the original reporter, and only
// while the issue is still OPEN. We mirror that client-side: load the
// issue, block the form if it is not OPEN (or not the caller's), and PATCH
// with the authored locale so the backend re-translates the other language.
// Reuses the admin IssueForm with a localized `labels` set.

import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Empty, Spin } from "antd";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore
} from "react";
import { SiteShell } from "@/components/SiteShell";
import { AdminPanelHeading } from "@/components/admin/AdminPanelHeading";
import { IssueForm } from "@/components/admin/IssueForm";
import { getJson, patchJson } from "@/lib/apiClient";
import {
  ISSUE_CATEGORIES,
  formatEnum,
  getIssueCoverImageUrl,
  getResponseData,
  isImageUpload,
  localizeIssue
} from "@/lib/adminUtils";
import { copy } from "@/lib/siteContent";
import { usePreferences } from "@/app/providers";
import { getAuthSession, subscribeAuthSession } from "@/lib/authSession";
import { buildLoginHref } from "@/lib/loginRedirect";
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
  data.additionalImages = uploads
    .filter(isImageUpload)
    .filter((upload) => upload.id !== coverId && upload.url !== coverUrl)
    .map((upload) => ({ id: upload.id, url: upload.url }));

  return data;
}

const COPY = {
  np: {
    pageTitle: "समस्या सम्पादन",
    eyebrow: "मेरो योगदान",
    titleFallback: "समस्या सम्पादन",
    description: "आफ्नो समस्याको विवरण अद्यावधिक गर्नुहोस्।",
    back: "मेरा समस्याहरूमा फर्कने",
    notFound: "समस्या फेला परेन।",
    loadError: "समस्या लोड गर्न सकिएन।",
    retry: "फेरि प्रयास गर्ने",
    notOpenTitle: "यो समस्या अब सम्पादन गर्न मिल्दैन",
    notOpenBody: "OPEN रहेको समस्या मात्र सम्पादन गर्न सकिन्छ।",
    notOwnerTitle: "यो समस्या तपाईंको होइन",
    notOwnerBody: "आफूले उठाएको समस्या मात्र सम्पादन गर्न सकिन्छ।",
    saved: "समस्या अद्यावधिक भयो।",
    saveError: "समस्या अद्यावधिक गर्न सकिएन।",
    submit: "परिवर्तन सुरक्षित गर्ने",
    form: {
      cover: "मुख्य तस्वीर",
      coverRequired: "मुख्य तस्वीर आवश्यक छ।",
      additionalImages: "थप तस्वीरहरू (वैकल्पिक)",
      additionalImagesLocked:
        "तस्वीर सम्पादन अहिले उपलब्ध छैन — तपाईंका अन्य परिवर्तनहरू भने सुरक्षित हुन्छन्।",
      title: "शीर्षक",
      titleRequired: "शीर्षक आवश्यक छ।",
      titlePlaceholder: "समस्याको छोटो, स्पष्ट सारांश",
      titleMinChars: "शीर्षक अलि लामो बनाउनुहोस् — कम्तीमा {n} अक्षर।",
      titleMinWords: "शीर्षकमा कम्तीमा {n} शब्द राख्नुहोस्।",
      titleHint: "कम्तीमा {c} अक्षर र {w} शब्द।",
      description: "विवरण",
      descriptionRequired: "विवरण आवश्यक छ।",
      descriptionPlaceholder: "के भइरहेको छ, कसलाई असर परेको छ, र के परिवर्तन चाहिन्छ?",
      descriptionMinChars: "विवरण अलि विस्तृत बनाउनुहोस् — कम्तीमा {n} अक्षर।",
      descriptionMinWords: "विवरणमा कम्तीमा {n} शब्द लेख्नुहोस्।",
      descriptionHint: "कम्तीमा {c} अक्षर र {w} शब्द।",
      category: "वर्ग",
      categoryRequired: "वर्ग आवश्यक छ।",
      categoryPlaceholder: "वर्ग छान्नुहोस्",
      address: "ठेगाना",
      addressRequired: "ठेगाना आवश्यक छ।",
      addressPlaceholder: "लेकसाइड, पोखरा",
      addressFromMap: "नक्साको आधारमा सुझाव गरिएको — टोल वा निकटको चिनारीले मिल्ने गरी सच्याउन सकिन्छ।",
      location: "स्थान",
      locationRequired: "नक्सामा सही स्थान देखाउनुहोस्।",
      municipality: "नगरपालिका (वैकल्पिक)",
      municipalityPlaceholder: "पोखरा महानगरपालिका",
      ward: "वडा (वैकल्पिक)",
      wardPlaceholder: "६",
      cancel: "रद्द गर्ने"
    }
  },
  en: {
    pageTitle: "Edit issue",
    eyebrow: "My contributions",
    titleFallback: "Edit issue",
    description: "Update the details of your reported issue.",
    back: "Back to my issues",
    notFound: "Issue not found.",
    loadError: "Could not load issue.",
    retry: "Try again",
    notOpenTitle: "This issue can no longer be edited",
    notOpenBody: "Only an issue that is still OPEN can be edited.",
    notOwnerTitle: "This isn't your issue",
    notOwnerBody: "You can only edit an issue you reported yourself.",
    saved: "Issue updated.",
    saveError: "Could not update issue.",
    submit: "Save changes",
    form: {
      cover: "Cover image",
      coverRequired: "Cover image is required.",
      additionalImages: "Additional images (optional)",
      additionalImagesLocked:
        "Photo editing isn't available yet — your other changes still save.",
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
      municipality: "Municipality (optional)",
      municipalityPlaceholder: "Pokhara Metropolitan City",
      ward: "Ward (optional)",
      wardPlaceholder: "6",
      cancel: "Cancel"
    }
  }
};

function getReporterId(issue) {
  return issue?.reportedById || issue?.reportedBy?.id || issue?.reporter?.id || null;
}

export default function MeIssueEditPage() {
  const router = useRouter();
  const params = useParams();
  const issueId = params?.id;
  const toast = useToast();
  const { language } = usePreferences();
  const t = COPY[language] || COPY.np;

  const session = useSyncExternalStore(subscribeAuthSession, getAuthSession, () => null);
  const sessionResolved = typeof window !== "undefined";

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (sessionResolved && !session) {
      router.replace(buildLoginHref(`/me/issues/${issueId}/edit`));
    }
  }, [router, session, sessionResolved, issueId]);

  const loadIssue = useCallback(async () => {
    if (!issueId) return;
    setLoading(true);
    setLoadError("");

    try {
      const response = await getJson(`/issues/${issueId}`, { requireAuth: true });
      const data = getResponseData(response, null);
      if (!data) {
        setLoadError(t.notFound);
        setIssue(null);
        return;
      }
      setIssue(data);
    } catch (error) {
      setLoadError(error.message || t.loadError);
      setIssue(null);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issueId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadIssue();
  }, [loadIssue]);

  const localizedIssue = useMemo(
    () => (issue ? localizeIssue(issue, language) : null),
    [issue, language]
  );
  const initialValues = useMemo(
    () => (localizedIssue ? pickEditableFields(localizedIssue) : null),
    [localizedIssue]
  );

  const categoryOptions = useMemo(
    () =>
      ISSUE_CATEGORIES.map((value) => ({
        value,
        label: copy[language]?.issueNew?.categories?.[value] || formatEnum(value)
      })),
    [language]
  );

  // The map picker's own chrome (search, "my location", fullscreen) is already
  // localized in the public reporter copy — reuse it rather than re-translate.
  const formLabels = useMemo(
    () => ({ ...t.form, picker: copy[language]?.issueNew?.fields?.picker }),
    [t.form, language]
  );

  const reporterId = getReporterId(issue);
  const myId = session?.user?.id || null;
  const isOwner = !reporterId || !myId || reporterId === myId;
  const isOpen = issue?.status === "OPEN";

  const handleFinish = async (values) => {
    setSubmitting(true);

    // PATCH /issues/{id} now accepts `uploadIds` (shipped 2026-06-30), so the
    // additional-images set is editable. Mirror POST /issues: `uploadIds` is the
    // additional gallery (cover is carried separately via `coverImageId`). We
    // send the full current set so removals persist (replace semantics).
    const { cover, additionalImages, ...rest } = values;
    const originalCoverId = initialValues?.cover?.id || null;
    const nextCoverId = cover?.id || null;

    const payload = { ...rest };
    // PATCH /issues/{id} requires `language` whenever title or description is
    // part of the update — it tells the backend which locale the edited text
    // is in so it can re-translate. The member edits in the UI language.
    if ("title" in rest || "description" in rest) {
      payload.language = language === "np" ? "ne" : "en";
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
      toast.success(t.saved);
      router.push("/me/issues");
    } finally {
      setSubmitting(false);
    }
  };

  const heading = (
    <AdminPanelHeading
      eyebrow={t.eyebrow}
      title={localizedIssue?.title ? `${t.pageTitle}: ${localizedIssue.title}` : t.titleFallback}
      description={t.description}
      actions={
        <Link href="/me/issues">
          <Button icon={<ArrowLeftOutlined />}>{t.back}</Button>
        </Link>
      }
    />
  );

  let body;
  if (loading) {
    body = (
      <div className="admin-modal-loading">
        <Spin />
      </div>
    );
  } else if (loadError) {
    body = (
      <Empty description={loadError}>
        <Button onClick={loadIssue} type="primary">
          {t.retry}
        </Button>
      </Empty>
    );
  } else if (issue && !isOwner) {
    body = <Empty description={`${t.notOwnerTitle} — ${t.notOwnerBody}`} />;
  } else if (issue && !isOpen) {
    body = <Empty description={`${t.notOpenTitle} — ${t.notOpenBody}`} />;
  } else if (initialValues) {
    body = (
      <IssueForm
        initialValues={initialValues}
        submitting={submitting}
        submitLabel={t.submit}
        onSubmit={handleFinish}
        cancelHref="/me/issues"
        labels={formLabels}
        categoryOptions={categoryOptions}
        language={language}
        submitErrorMessage={t.saveError}
      />
    );
  }

  return (
    <SiteShell pageTitle={t.pageTitle}>
      <section className="page-section">
        <div className="admin-panel">
          {heading}
          {body}
        </div>
      </section>
    </SiteShell>
  );
}
