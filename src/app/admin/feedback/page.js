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
import { FEEDBACK_STATUSES, buildEnumOptions, formatEnum } from "@/lib/adminUtils";
import { useAdminEditModal } from "@/hooks/useAdminEditModal";
import { useAdminItemMutation } from "@/hooks/useAdminItemMutation";
import { useAdminListResource } from "@/hooks/useAdminListResource";
import { useToast } from "@/lib/toast";

export default function AdminFeedbackPage() {
  const messageApi = useToast();
  const {
    items: feedbackItems,
    setItems: setFeedbackItems,
    loading: loadingFeedback,
    error: feedbackError,
    filters,
    setFilter,
    refetch: fetchFeedback
  } = useAdminListResource({
    path: "/feedback",
    errorMessage: "Could not load feedback.",
    onError: (msg) => messageApi.error(msg)
  });

  const { updatingId, patchStatus, patchField, deleteItem } = useAdminItemMutation({
    messageApi,
    setItems: setFeedbackItems
  });

  const replyModal = useAdminEditModal({
    fieldName: "adminReply",
    save: (item, values) =>
      patchField({
        path: `/feedback/${item.id}/reply`,
        item,
        body: values,
        errorMsg: "Could not save admin reply."
      }),
    messageApi,
    successMsg: "Admin reply saved.",
    errorMsg: "Could not save admin reply."
  });

  const feedbackTypeOptions = useMemo(() => copy.en.options.feedbackTypes, []);
  const feedbackStatusOptions = useMemo(() => buildEnumOptions(FEEDBACK_STATUSES), []);

  const handleStatusChange = (feedback, status) =>
    patchStatus({
      path: `/feedback/${feedback.id}/status`,
      item: feedback,
      body: { status },
      successMsg: "Feedback status updated.",
      errorMsg: "Could not update feedback status."
    });

  const handleDeleteFeedback = (feedback) =>
    deleteItem({
      path: `/feedback/${feedback.id}`,
      item: feedback,
      successMsg: "Feedback deleted.",
      errorMsg: "Could not delete feedback."
    });

  const columns = [
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
        <AdminStatusSelect
          value={status}
          options={feedbackStatusOptions}
          loading={updatingId === feedback.id}
          onChange={(nextStatus) => handleStatusChange(feedback, nextStatus)}
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
        <Button icon={<EditOutlined />} onClick={() => replyModal.openFor(feedback)}>
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
          okButtonProps={{ danger: true }}
          okText="Delete"
          onConfirm={() => handleDeleteFeedback(feedback)}
        >
          <Button danger icon={<DeleteOutlined />} loading={updatingId === feedback.id}>
            Delete
          </Button>
        </Popconfirm>
      )
    }
  ];

  const renderFeedbackDetail = (feedback) => (
    <>
      {feedback.experienceRating ? (
        <p>
          <strong>Experience rating:</strong> {feedback.experienceRating}/5
        </p>
      ) : null}
      {feedback.screenshot ? (
        <p>
          <strong>Screenshot:</strong>{" "}
          <a href={feedback.screenshot} rel="noreferrer" target="_blank">
            {feedback.screenshot}
          </a>
        </p>
      ) : null}
      {feedback.adminReply ? (
        <p>
          <strong>Admin reply:</strong> {feedback.adminReply}
        </p>
      ) : null}
    </>
  );

  return (
    <AdminShell title="Feedback">
      <section className="admin-panel">
        <AdminPanelHeading
          eyebrow="Feedback"
          title="Feedback"
          description="Review public messages, update review state, and save admin replies."
          onRefresh={fetchFeedback}
          refreshing={loadingFeedback}
        />

        <AdminFilters>
          <Select
            allowClear
            onChange={(value) => setFilter("type", value)}
            options={feedbackTypeOptions}
            placeholder="Filter by type"
            value={filters.type}
          />
          <Select
            allowClear
            onChange={(value) => setFilter("status", value)}
            options={feedbackStatusOptions}
            placeholder="Filter by status"
            value={filters.status}
          />
        </AdminFilters>

        {feedbackError ? <p className="admin-error-text">{feedbackError}</p> : null}

        <AdminResponsiveList
          ariaLabel="Feedback list"
          emptyDescription={feedbackError ? "Feedback could not be loaded." : "No feedback found."}
          isEmpty={feedbackItems.length === 0}
          loading={loadingFeedback}
          loadingLabel="Loading feedback..."
          table={
            <Table
              columns={columns}
              dataSource={feedbackItems}
              expandable={{
                expandedRowRender: (feedback) => (
                  <div className="admin-row-detail">{renderFeedbackDetail(feedback)}</div>
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
          }
        >
          {feedbackItems.map((feedback) => (
            <AdminListCard
              key={feedback.id}
              header={
                <>
                  <div className="admin-list-card-title">
                    <strong>{feedback.name}</strong>
                    <span>{feedback.email}</span>
                  </div>
                  <Tag>{formatEnum(feedback.type)}</Tag>
                </>
              }
              control={
                <>
                  <span>Status</span>
                  <AdminStatusSelect
                    value={feedback.status}
                    options={feedbackStatusOptions}
                    loading={updatingId === feedback.id}
                    onChange={(nextStatus) => handleStatusChange(feedback, nextStatus)}
                  />
                </>
              }
              note={feedback.message}
              detail={renderFeedbackDetail(feedback)}
              actions={
                <>
                  <Button icon={<EditOutlined />} onClick={() => replyModal.openFor(feedback)}>
                    {feedback.adminReply ? "Edit reply" : "Add reply"}
                  </Button>
                  <Popconfirm
                    title="Delete this feedback?"
                    okButtonProps={{ danger: true }}
                    okText="Delete"
                    onConfirm={() => handleDeleteFeedback(feedback)}
                  >
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      loading={updatingId === feedback.id}
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
        confirmLoading={replyModal.saving}
        okText="Save reply"
        onCancel={replyModal.close}
        onOk={replyModal.handleOk}
        open={replyModal.open}
        title={replyModal.item ? `Admin reply: ${replyModal.item.name}` : "Admin reply"}
      >
        <Form form={replyModal.form} layout="vertical">
          <Form.Item
            label="Admin reply"
            name="adminReply"
            rules={[{ required: true, message: "Admin reply cannot be empty." }]}
          >
            <Input.TextArea rows={5} />
          </Form.Item>
        </Form>
      </Modal>
    </AdminShell>
  );
}
