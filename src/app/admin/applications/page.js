"use client";

import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Empty, Form, Input, Modal, Popconfirm, Select, Table, Tag } from "antd";
import { useMemo } from "react";
import { AdminResponsiveList } from "@/components/AdminResponsiveList";
import { AdminShell } from "@/components/AdminShell";
import { AdminFilters } from "@/components/admin/AdminFilters";
import { AdminListCard } from "@/components/admin/AdminListCard";
import { AdminPanelHeading } from "@/components/admin/AdminPanelHeading";
import { AdminStatusSelect } from "@/components/admin/AdminStatusSelect";
import { copy } from "@/lib/siteContent";
import { APPLICATION_STATUSES, buildEnumOptions, formatEnum } from "@/lib/adminUtils";
import { useAdminEditModal } from "@/hooks/useAdminEditModal";
import { useAdminItemMutation } from "@/hooks/useAdminItemMutation";
import { useAdminListResource } from "@/hooks/useAdminListResource";
import { useToast } from "@/lib/toast";

export default function AdminApplicationsPage() {
  const messageApi = useToast();
  const {
    items: applications,
    setItems: setApplications,
    loading: loadingApplications,
    error: applicationError,
    filters,
    setFilter,
    refetch: fetchApplications
  } = useAdminListResource({
    path: "/applications",
    errorMessage: "Could not load applications.",
    onError: (msg) => messageApi.error(msg)
  });

  const { updatingId, patchStatus, patchField, deleteItem } = useAdminItemMutation({
    messageApi,
    setItems: setApplications
  });

  const notesModal = useAdminEditModal({
    fieldName: "adminNotes",
    save: (item, values) =>
      patchField({
        path: `/applications/${item.id}/notes`,
        item,
        body: values,
        errorMsg: "Could not save notes."
      }),
    messageApi,
    successMsg: "Admin notes saved.",
    errorMsg: "Could not save notes."
  });

  const roleOptions = useMemo(() => copy.en.options.applicationRoles, []);
  const statusOptions = useMemo(() => buildEnumOptions(APPLICATION_STATUSES), []);

  const handleStatusChange = (application, status) =>
    patchStatus({
      path: `/applications/${application.id}/status`,
      item: application,
      body: { status },
      successMsg: "Application status updated.",
      errorMsg: "Could not update status."
    });

  const handleDeleteApplication = (application) =>
    deleteItem({
      path: `/applications/${application.id}`,
      item: application,
      successMsg: "Application deleted.",
      errorMsg: "Could not delete application."
    });

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
        <AdminStatusSelect
          value={status}
          options={statusOptions}
          loading={updatingId === application.id}
          onChange={(nextStatus) => handleStatusChange(application, nextStatus)}
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
        <Button icon={<EditOutlined />} onClick={() => notesModal.openFor(application)}>
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
          <Button danger icon={<DeleteOutlined />} loading={updatingId === application.id}>
            Delete
          </Button>
        </Popconfirm>
      )
    }
  ];

  const renderApplicationDetail = (application) => (
    <>
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
    </>
  );

  return (
    <AdminShell title="Applications">
      <section className="admin-panel">
        <AdminPanelHeading
          eyebrow="First CRUD"
          title="Applications"
          description="Review contributor applications and manage their onboarding state."
          onRefresh={fetchApplications}
          refreshing={loadingApplications}
        />

        <AdminFilters>
          <Select
            allowClear
            onChange={(value) => setFilter("role", value)}
            options={roleOptions}
            placeholder="Filter by role"
            value={filters.role}
          />
          <Select
            allowClear
            onChange={(value) => setFilter("status", value)}
            options={statusOptions}
            placeholder="Filter by status"
            value={filters.status}
          />
        </AdminFilters>

        {applicationError ? <p className="admin-error-text">{applicationError}</p> : null}

        <AdminResponsiveList
          ariaLabel="Applications list"
          emptyDescription={
            applicationError ? "Applications could not be loaded." : "No applications found."
          }
          isEmpty={applications.length === 0}
          loading={loadingApplications}
          loadingLabel="Loading applications..."
          table={
            <Table
              columns={columns}
              dataSource={applications}
              expandable={{
                expandedRowRender: (application) => (
                  <div className="admin-row-detail">{renderApplicationDetail(application)}</div>
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
          }
        >
          {applications.map((application) => (
            <AdminListCard
              key={application.id}
              header={
                <>
                  <div className="admin-list-card-title">
                    <strong>{application.name}</strong>
                    <span>{application.email}</span>
                    {application.phone ? <span>{application.phone}</span> : null}
                  </div>
                  <Tag>{formatEnum(application.role)}</Tag>
                </>
              }
              control={
                <>
                  <span>Status</span>
                  <AdminStatusSelect
                    value={application.status}
                    options={statusOptions}
                    loading={updatingId === application.id}
                    onChange={(nextStatus) => handleStatusChange(application, nextStatus)}
                  />
                </>
              }
              note={application.motivation}
              detail={renderApplicationDetail(application)}
              actions={
                <>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => notesModal.openFor(application)}
                  >
                    {application.adminNotes ? "Edit notes" : "Add notes"}
                  </Button>
                  <Popconfirm
                    title="Delete this application?"
                    okButtonProps={{ danger: true }}
                    okText="Delete"
                    onConfirm={() => handleDeleteApplication(application)}
                  >
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      loading={updatingId === application.id}
                    >
                      Delete
                    </Button>
                  </Popconfirm>
                </>
              }
            />
          ))}
        </AdminResponsiveList>
      </section>

      <Modal
        confirmLoading={notesModal.saving}
        okText="Save notes"
        onCancel={notesModal.close}
        onOk={notesModal.handleOk}
        open={notesModal.open}
        title={notesModal.item ? `Admin notes: ${notesModal.item.name}` : "Admin notes"}
      >
        <Form form={notesModal.form} layout="vertical">
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
