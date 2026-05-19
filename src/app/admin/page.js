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
    status: "Next",
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
  const roleOptions = useMemo(() => copy.en.options.applicationRoles, []);
  const statusOptions = useMemo(
    () => applicationStatuses.map((status) => ({ label: formatEnum(status), value: status })),
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
      </section>
    </SiteShell>
  );
}
