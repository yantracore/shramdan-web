"use client";

import {
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  FormOutlined,
  LogoutOutlined,
  MessageOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import {
  Button,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Spin,
  Table,
  Tag,
  message
} from "antd";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { SiteShell } from "@/components/SiteShell";
import { deleteJson, getJson, patchJson } from "@/lib/apiClient";
import { clearAuthSession, getAuthSession, isAdminUser, subscribeAuthSession } from "@/lib/authSession";
import { copy } from "@/lib/siteContent";

const adminModules = [
  {
    icon: <FormOutlined />,
    label: "Applications",
    status: "First CRUD",
    body: "Review contributor applications, update statuses, write admin notes, and remove spam entries."
  },
  {
    icon: <MessageOutlined />,
    label: "Feedback",
    status: "CRUD",
    body: "Review public feedback, update status, reply as admin, and close resolved conversations."
  },
  {
    icon: <FileTextOutlined />,
    label: "Issues and events",
    status: "Later",
    body: "Wait for finalized backend contracts before managing community issues, events, incidents, and roles."
  }
];

const applicationStatuses = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "ONBOARDING",
  "ACTIVE",
  "REJECTED"
];

const feedbackStatuses = ["NEW", "REVIEWED", "IN_PROGRESS", "RESOLVED", "CLOSED"];

function formatEnum(value) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getResponseData(response, fallback) {
  return response?.data ?? fallback;
}

export default function AdminPage() {
  const router = useRouter();
  const session = useSyncExternalStore(subscribeAuthSession, getAuthSession, () => null);
  const [messageApi, contextHolder] = message.useMessage();
  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [applicationError, setApplicationError] = useState("");
  const [filters, setFilters] = useState({});
  const [updatingApplicationId, setUpdatingApplicationId] = useState("");
  const [notesForm] = Form.useForm();
  const [notesApplication, setNotesApplication] = useState(null);
  const [savingNotes, setSavingNotes] = useState(false);
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackFilters, setFeedbackFilters] = useState({});
  const [updatingFeedbackId, setUpdatingFeedbackId] = useState("");
  const [replyForm] = Form.useForm();
  const [replyFeedback, setReplyFeedback] = useState(null);
  const [savingReply, setSavingReply] = useState(false);
  const roleOptions = useMemo(() => copy.en.options.applicationRoles, []);
  const feedbackTypeOptions = useMemo(() => copy.en.options.feedbackTypes, []);
  const statusOptions = useMemo(
    () => applicationStatuses.map((status) => ({ label: formatEnum(status), value: status })),
    []
  );
  const feedbackStatusOptions = useMemo(
    () => feedbackStatuses.map((status) => ({ label: formatEnum(status), value: status })),
    []
  );

  useEffect(() => {
    if (!session) {
      router.replace("/login");
      return;
    }

    if (!isAdminUser(session.user)) {
      clearAuthSession();
      router.replace("/login");
    }
  }, [router, session]);

  const fetchApplications = useCallback(async () => {
    if (!session || !isAdminUser(session.user)) {
      return;
    }

    setLoadingApplications(true);
    setApplicationError("");

    try {
      const response = await getJson("/applications", {
        params: filters,
        requireAuth: true
      });
      setApplications(getResponseData(response, []));
    } catch (error) {
      setApplicationError(error.message || "Could not load applications.");
      messageApi.error(error.message || "Could not load applications.");
    } finally {
      setLoadingApplications(false);
    }
  }, [filters, messageApi, session]);

  useEffect(() => {
    const fetchTimer = window.setTimeout(() => {
      void fetchApplications();
    }, 0);

    return () => {
      window.clearTimeout(fetchTimer);
    };
  }, [fetchApplications]);

  const fetchFeedback = useCallback(async () => {
    if (!session || !isAdminUser(session.user)) {
      return;
    }

    setLoadingFeedback(true);
    setFeedbackError("");

    try {
      const response = await getJson("/feedback", {
        params: feedbackFilters,
        requireAuth: true
      });
      setFeedbackItems(getResponseData(response, []));
    } catch (error) {
      setFeedbackError(error.message || "Could not load feedback.");
      messageApi.error(error.message || "Could not load feedback.");
    } finally {
      setLoadingFeedback(false);
    }
  }, [feedbackFilters, messageApi, session]);

  useEffect(() => {
    const fetchTimer = window.setTimeout(() => {
      void fetchFeedback();
    }, 0);

    return () => {
      window.clearTimeout(fetchTimer);
    };
  }, [fetchFeedback]);

  const handleLogout = () => {
    clearAuthSession();
    router.replace("/login");
  };

  const handleFilterChange = (key, value) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value
    }));
  };

  const handleFeedbackFilterChange = (key, value) => {
    setFeedbackFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value
    }));
  };

  const handleStatusChange = async (application, status) => {
    setUpdatingApplicationId(application.id);

    try {
      const response = await patchJson(
        `/applications/${application.id}/status`,
        { status },
        { requireAuth: true }
      );
      const updatedApplication = getResponseData(response, application);

      setApplications((currentApplications) =>
        currentApplications.map((item) =>
          item.id === application.id ? updatedApplication : item
        )
      );
      messageApi.success("Application status updated.");
    } catch (error) {
      messageApi.error(error.message || "Could not update status.");
    } finally {
      setUpdatingApplicationId("");
    }
  };

  const openNotesModal = (application) => {
    setNotesApplication(application);
    notesForm.setFieldsValue({ adminNotes: application.adminNotes ?? "" });
  };

  const handleSaveNotes = async () => {
    const values = await notesForm.validateFields();
    setSavingNotes(true);

    try {
      const response = await patchJson(
        `/applications/${notesApplication.id}/notes`,
        values,
        { requireAuth: true }
      );
      const updatedApplication = getResponseData(response, notesApplication);

      setApplications((currentApplications) =>
        currentApplications.map((item) =>
          item.id === notesApplication.id ? updatedApplication : item
        )
      );
      setNotesApplication(null);
      notesForm.resetFields();
      messageApi.success("Admin notes saved.");
    } catch (error) {
      messageApi.error(error.message || "Could not save notes.");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDeleteApplication = async (application) => {
    setUpdatingApplicationId(application.id);

    try {
      await deleteJson(`/applications/${application.id}`, { requireAuth: true });
      setApplications((currentApplications) =>
        currentApplications.filter((item) => item.id !== application.id)
      );
      messageApi.success("Application deleted.");
    } catch (error) {
      messageApi.error(error.message || "Could not delete application.");
    } finally {
      setUpdatingApplicationId("");
    }
  };

  const handleFeedbackStatusChange = async (feedback, status) => {
    setUpdatingFeedbackId(feedback.id);

    try {
      const response = await patchJson(
        `/feedback/${feedback.id}/status`,
        { status },
        { requireAuth: true }
      );
      const updatedFeedback = getResponseData(response, feedback);

      setFeedbackItems((currentItems) =>
        currentItems.map((item) => (item.id === feedback.id ? updatedFeedback : item))
      );
      messageApi.success("Feedback status updated.");
    } catch (error) {
      messageApi.error(error.message || "Could not update feedback status.");
    } finally {
      setUpdatingFeedbackId("");
    }
  };

  const openReplyModal = (feedback) => {
    setReplyFeedback(feedback);
    replyForm.setFieldsValue({ adminReply: feedback.adminReply ?? "" });
  };

  const handleSaveReply = async () => {
    const values = await replyForm.validateFields();
    setSavingReply(true);

    try {
      const response = await patchJson(
        `/feedback/${replyFeedback.id}/reply`,
        values,
        { requireAuth: true }
      );
      const updatedFeedback = getResponseData(response, replyFeedback);

      setFeedbackItems((currentItems) =>
        currentItems.map((item) => (item.id === replyFeedback.id ? updatedFeedback : item))
      );
      setReplyFeedback(null);
      replyForm.resetFields();
      messageApi.success("Admin reply saved.");
    } catch (error) {
      messageApi.error(error.message || "Could not save admin reply.");
    } finally {
      setSavingReply(false);
    }
  };

  const handleDeleteFeedback = async (feedback) => {
    setUpdatingFeedbackId(feedback.id);

    try {
      await deleteJson(`/feedback/${feedback.id}`, { requireAuth: true });
      setFeedbackItems((currentItems) => currentItems.filter((item) => item.id !== feedback.id));
      messageApi.success("Feedback deleted.");
    } catch (error) {
      messageApi.error(error.message || "Could not delete feedback.");
    } finally {
      setUpdatingFeedbackId("");
    }
  };

  const applicationColumns = [
    {
      title: "Applicant",
      dataIndex: "name",
      key: "name",
      render: (_, application) => (
        <div className="admin-applicant-cell">
          <strong>{application.name}</strong>
          <span>{application.email}</span>
          {application.phone ? <span>{application.phone}</span> : null}
        </div>
      )
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role) => <Tag>{formatEnum(role)}</Tag>
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status, application) => (
        <Select
          className="admin-status-select"
          loading={updatingApplicationId === application.id}
          onChange={(nextStatus) => handleStatusChange(application, nextStatus)}
          options={statusOptions}
          value={status}
        />
      )
    },
    {
      title: "Motivation",
      dataIndex: "motivation",
      key: "motivation",
      render: (motivation) => <p className="admin-table-note">{motivation}</p>
    },
    {
      title: "Notes",
      dataIndex: "adminNotes",
      key: "adminNotes",
      render: (adminNotes, application) => (
        <Button icon={<EditOutlined />} onClick={() => openNotesModal(application)}>
          {adminNotes ? "Edit notes" : "Add notes"}
        </Button>
      )
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, application) => (
        <Popconfirm
          title="Delete this application?"
          okText="Delete"
          okButtonProps={{ danger: true }}
          onConfirm={() => handleDeleteApplication(application)}
        >
          <Button danger icon={<DeleteOutlined />} loading={updatingApplicationId === application.id}>
            Delete
          </Button>
        </Popconfirm>
      )
    }
  ];

  const feedbackColumns = [
    {
      title: "Sender",
      dataIndex: "name",
      key: "name",
      render: (_, feedback) => (
        <div className="admin-applicant-cell">
          <strong>{feedback.name}</strong>
          <span>{feedback.email}</span>
        </div>
      )
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type) => <Tag>{formatEnum(type)}</Tag>
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status, feedback) => (
        <Select
          className="admin-status-select"
          loading={updatingFeedbackId === feedback.id}
          onChange={(nextStatus) => handleFeedbackStatusChange(feedback, nextStatus)}
          options={feedbackStatusOptions}
          value={status}
        />
      )
    },
    {
      title: "Message",
      dataIndex: "message",
      key: "message",
      render: (feedbackMessage) => <p className="admin-table-note">{feedbackMessage}</p>
    },
    {
      title: "Reply",
      dataIndex: "adminReply",
      key: "adminReply",
      render: (adminReply, feedback) => (
        <Button icon={<EditOutlined />} onClick={() => openReplyModal(feedback)}>
          {adminReply ? "Edit reply" : "Add reply"}
        </Button>
      )
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, feedback) => (
        <Popconfirm
          title="Delete this feedback?"
          okText="Delete"
          okButtonProps={{ danger: true }}
          onConfirm={() => handleDeleteFeedback(feedback)}
        >
          <Button danger icon={<DeleteOutlined />} loading={updatingFeedbackId === feedback.id}>
            Delete
          </Button>
        </Popconfirm>
      )
    }
  ];

  if (!session || !isAdminUser(session.user)) {
    return (
      <SiteShell>
        <section className="page-section admin-loading">
          <Spin size="large" />
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      {contextHolder}
      <section className="page-section admin-section">
        <div className="admin-hero">
          <div>
            <span className="eyebrow">Control Center</span>
            <h1>Admin Control Center</h1>
            <p>Manage Shramdan operations from one place.</p>
          </div>
          <div className="admin-session-card">
            <span>Signed in as</span>
            <strong>{session.user.email}</strong>
            <Button icon={<LogoutOutlined />} onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        <div className="admin-module-grid">
          {adminModules.map((module) => (
            <article className="content-card admin-module-card" key={module.label}>
              <span className="admin-module-icon" aria-hidden="true">
                {module.icon}
              </span>
              <div>
                <div className="admin-module-heading">
                  <h2>{module.label}</h2>
                  <Tag color={module.status === "First CRUD" ? "green" : "default"}>
                    {module.status}
                  </Tag>
                </div>
                <p>{module.body}</p>
              </div>
            </article>
          ))}
        </div>

        <section className="content-card admin-applications-panel" aria-labelledby="admin-applications-title">
          <div className="admin-panel-heading">
            <div>
              <span className="eyebrow">First CRUD</span>
              <h2 id="admin-applications-title">Applications</h2>
              <p>Review contributor applications and manage their onboarding state.</p>
            </div>
            <Button icon={<ReloadOutlined />} onClick={fetchApplications} loading={loadingApplications}>
              Refresh
            </Button>
          </div>

          <div className="admin-filters">
            <Select
              allowClear
              options={roleOptions}
              placeholder="Filter by role"
              value={filters.role}
              onChange={(value) => handleFilterChange("role", value)}
            />
            <Select
              allowClear
              options={statusOptions}
              placeholder="Filter by status"
              value={filters.status}
              onChange={(value) => handleFilterChange("status", value)}
            />
          </div>

          {applicationError ? <p className="admin-error-text">{applicationError}</p> : null}

          <Table
            columns={applicationColumns}
            dataSource={applications}
            expandable={{
              expandedRowRender: (application) => (
                <div className="admin-application-detail">
                  {application.experience ? (
                    <p>
                      <strong>Experience:</strong> {application.experience}
                    </p>
                  ) : null}
                  {application.additionalInfo ? (
                    <p>
                      <strong>Additional info:</strong> {application.additionalInfo}
                    </p>
                  ) : null}
                  {application.portfolio ? (
                    <p>
                      <strong>Portfolio:</strong>{" "}
                      <a href={application.portfolio} target="_blank" rel="noreferrer">
                        {application.portfolio}
                      </a>
                    </p>
                  ) : null}
                  {application.resumeUrl ? (
                    <p>
                      <strong>Resume:</strong>{" "}
                      <a href={application.resumeUrl} target="_blank" rel="noreferrer">
                        {application.resumeUrl}
                      </a>
                    </p>
                  ) : null}
                  {application.adminNotes ? (
                    <p>
                      <strong>Admin notes:</strong> {application.adminNotes}
                    </p>
                  ) : null}
                </div>
              )
            }}
            locale={{
              emptyText: (
                <Empty
                  description={
                    applicationError
                      ? "Applications could not be loaded."
                      : "No applications found."
                  }
                />
              )
            }}
            loading={loadingApplications}
            pagination={{ pageSize: 8 }}
            rowKey="id"
            scroll={{ x: 980 }}
          />
        </section>

        <section className="content-card admin-applications-panel" aria-labelledby="admin-feedback-title">
          <div className="admin-panel-heading">
            <div>
              <span className="eyebrow">Feedback</span>
              <h2 id="admin-feedback-title">Feedback</h2>
              <p>Review public messages, update review state, and save admin replies.</p>
            </div>
            <Button icon={<ReloadOutlined />} onClick={fetchFeedback} loading={loadingFeedback}>
              Refresh
            </Button>
          </div>

          <div className="admin-filters">
            <Select
              allowClear
              options={feedbackTypeOptions}
              placeholder="Filter by type"
              value={feedbackFilters.type}
              onChange={(value) => handleFeedbackFilterChange("type", value)}
            />
            <Select
              allowClear
              options={feedbackStatusOptions}
              placeholder="Filter by status"
              value={feedbackFilters.status}
              onChange={(value) => handleFeedbackFilterChange("status", value)}
            />
          </div>

          {feedbackError ? <p className="admin-error-text">{feedbackError}</p> : null}

          <Table
            columns={feedbackColumns}
            dataSource={feedbackItems}
            expandable={{
              expandedRowRender: (feedback) => (
                <div className="admin-application-detail">
                  {feedback.experienceRating ? (
                    <p>
                      <strong>Experience rating:</strong> {feedback.experienceRating}/5
                    </p>
                  ) : null}
                  {feedback.screenshot ? (
                    <p>
                      <strong>Screenshot:</strong>{" "}
                      <a href={feedback.screenshot} target="_blank" rel="noreferrer">
                        {feedback.screenshot}
                      </a>
                    </p>
                  ) : null}
                  {feedback.adminReply ? (
                    <p>
                      <strong>Admin reply:</strong> {feedback.adminReply}
                    </p>
                  ) : null}
                </div>
              )
            }}
            locale={{
              emptyText: (
                <Empty
                  description={
                    feedbackError ? "Feedback could not be loaded." : "No feedback found."
                  }
                />
              )
            }}
            loading={loadingFeedback}
            pagination={{ pageSize: 8 }}
            rowKey="id"
            scroll={{ x: 980 }}
          />
        </section>

        <Modal
          title={notesApplication ? `Admin notes: ${notesApplication.name}` : "Admin notes"}
          open={Boolean(notesApplication)}
          okText="Save notes"
          confirmLoading={savingNotes}
          onCancel={() => setNotesApplication(null)}
          onOk={handleSaveNotes}
        >
          <Form form={notesForm} layout="vertical">
            <Form.Item
              label="Admin notes"
              name="adminNotes"
              rules={[{ required: true, message: "Admin notes cannot be empty." }]}
            >
              <Input.TextArea rows={5} />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={replyFeedback ? `Admin reply: ${replyFeedback.name}` : "Admin reply"}
          open={Boolean(replyFeedback)}
          okText="Save reply"
          confirmLoading={savingReply}
          onCancel={() => setReplyFeedback(null)}
          onOk={handleSaveReply}
        >
          <Form form={replyForm} layout="vertical">
            <Form.Item
              label="Admin reply"
              name="adminReply"
              rules={[{ required: true, message: "Admin reply cannot be empty." }]}
            >
              <Input.TextArea rows={5} />
            </Form.Item>
          </Form>
        </Modal>
      </section>
    </SiteShell>
  );
}
