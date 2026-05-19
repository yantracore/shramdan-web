"use client";

import { DeleteOutlined, EditOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Empty, Form, Input, Modal, Popconfirm, Select, Table, Tag, message } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { deleteJson, getJson, patchJson } from "@/lib/apiClient";
import { copy } from "@/lib/siteContent";

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

export default function AdminApplicationsPage() {
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

  const fetchApplications = useCallback(async () => {
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
  }, [filters, messageApi]);

  useEffect(() => {
    const fetchTimer = window.setTimeout(() => {
      void fetchApplications();
    }, 0);

    return () => {
      window.clearTimeout(fetchTimer);
    };
  }, [fetchApplications]);

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
        currentApplications.map((item) => (item.id === application.id ? updatedApplication : item))
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

  const columns = [
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
          okButtonProps={{ danger: true }}
          okText="Delete"
          onConfirm={() => handleDeleteApplication(application)}
        >
          <Button danger icon={<DeleteOutlined />} loading={updatingApplicationId === application.id}>
            Delete
          </Button>
        </Popconfirm>
      )
    }
  ];

  return (
    <AdminShell title="Applications" subtitle="Review and manage contributor applications.">
      {contextHolder}
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <span className="eyebrow">First CRUD</span>
            <h2>Applications</h2>
            <p>Review contributor applications and manage their onboarding state.</p>
          </div>
          <Button icon={<ReloadOutlined />} loading={loadingApplications} onClick={fetchApplications}>
            Refresh
          </Button>
        </div>

        <div className="admin-filters">
          <Select
            allowClear
            onChange={(value) => handleFilterChange("role", value)}
            options={roleOptions}
            placeholder="Filter by role"
            value={filters.role}
          />
          <Select
            allowClear
            onChange={(value) => handleFilterChange("status", value)}
            options={statusOptions}
            placeholder="Filter by status"
            value={filters.status}
          />
        </div>

        {applicationError ? <p className="admin-error-text">{applicationError}</p> : null}

        <Table
          columns={columns}
          dataSource={applications}
          expandable={{
            expandedRowRender: (application) => (
              <div className="admin-row-detail">
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
                    <a href={application.portfolio} rel="noreferrer" target="_blank">
                      {application.portfolio}
                    </a>
                  </p>
                ) : null}
                {application.resumeUrl ? (
                  <p>
                    <strong>Resume:</strong>{" "}
                    <a href={application.resumeUrl} rel="noreferrer" target="_blank">
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
                  applicationError ? "Applications could not be loaded." : "No applications found."
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
        confirmLoading={savingNotes}
        okText="Save notes"
        onCancel={() => setNotesApplication(null)}
        onOk={handleSaveNotes}
        open={Boolean(notesApplication)}
        title={notesApplication ? `Admin notes: ${notesApplication.name}` : "Admin notes"}
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
    </AdminShell>
  );
}
