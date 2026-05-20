"use client";

import { DeleteOutlined, EditOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Empty, Form, Input, Modal, Popconfirm, Select, Table, Tag, message } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminResponsiveList } from "@/components/AdminResponsiveList";
import { AdminShell } from "@/components/AdminShell";
import { deleteJson, getJson, patchJson } from "@/lib/apiClient";
import { copy } from "@/lib/siteContent";

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

export default function AdminFeedbackPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackFilters, setFeedbackFilters] = useState({});
  const [updatingFeedbackId, setUpdatingFeedbackId] = useState("");
  const [replyForm] = Form.useForm();
  const [replyFeedback, setReplyFeedback] = useState(null);
  const [savingReply, setSavingReply] = useState(false);
  const feedbackTypeOptions = useMemo(() => copy.en.options.feedbackTypes, []);
  const feedbackStatusOptions = useMemo(
    () => feedbackStatuses.map((status) => ({ label: formatEnum(status), value: status })),
    []
  );

  const fetchFeedback = useCallback(async () => {
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
  }, [feedbackFilters, messageApi]);

  useEffect(() => {
    const fetchTimer = window.setTimeout(() => {
      void fetchFeedback();
    }, 0);

    return () => {
      window.clearTimeout(fetchTimer);
    };
  }, [fetchFeedback]);

  const handleFilterChange = (key, value) => {
    setFeedbackFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value
    }));
  };

  const handleStatusChange = async (feedback, status) => {
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
        <Select
          className="admin-status-select"
          loading={updatingFeedbackId === feedback.id}
          onChange={(nextStatus) => handleStatusChange(feedback, nextStatus)}
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
          okButtonProps={{ danger: true }}
          okText="Delete"
          onConfirm={() => handleDeleteFeedback(feedback)}
        >
          <Button danger icon={<DeleteOutlined />} loading={updatingFeedbackId === feedback.id}>
            Delete
          </Button>
        </Popconfirm>
      )
    }
  ];

  return (
    <AdminShell title="Feedback" subtitle="Review public messages and save admin replies.">
      {contextHolder}
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <span className="eyebrow">Feedback</span>
            <h2>Feedback</h2>
            <p>Review public messages, update review state, and save admin replies.</p>
          </div>
          <Button icon={<ReloadOutlined />} loading={loadingFeedback} onClick={fetchFeedback}>
            Refresh
          </Button>
        </div>

        <div className="admin-filters">
          <Select
            allowClear
            onChange={(value) => handleFilterChange("type", value)}
            options={feedbackTypeOptions}
            placeholder="Filter by type"
            value={feedbackFilters.type}
          />
          <Select
            allowClear
            onChange={(value) => handleFilterChange("status", value)}
            options={feedbackStatusOptions}
            placeholder="Filter by status"
            value={feedbackFilters.status}
          />
        </div>

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
                  <div className="admin-row-detail">
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
                  </div>
                )
              }}
              locale={{
                emptyText: (
                  <Empty
                    description={feedbackError ? "Feedback could not be loaded." : "No feedback found."}
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
            <article className="admin-list-card" key={feedback.id}>
              <div className="admin-list-card-header">
                <div className="admin-list-card-title">
                  <strong>{feedback.name}</strong>
                  <span>{feedback.email}</span>
                </div>
                <Tag>{formatEnum(feedback.type)}</Tag>
              </div>

              <div className="admin-list-card-control">
                <span>Status</span>
                <Select
                  className="admin-status-select"
                  loading={updatingFeedbackId === feedback.id}
                  onChange={(nextStatus) => handleStatusChange(feedback, nextStatus)}
                  options={feedbackStatusOptions}
                  value={feedback.status}
                />
              </div>

              <p className="admin-list-card-note">{feedback.message}</p>

              <div className="admin-list-card-detail">
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
              </div>

              <div className="admin-list-card-actions">
                <Button icon={<EditOutlined />} onClick={() => openReplyModal(feedback)}>
                  {feedback.adminReply ? "Edit reply" : "Add reply"}
                </Button>
                <Popconfirm
                  title="Delete this feedback?"
                  okButtonProps={{ danger: true }}
                  okText="Delete"
                  onConfirm={() => handleDeleteFeedback(feedback)}
                >
                  <Button danger icon={<DeleteOutlined />} loading={updatingFeedbackId === feedback.id}>
                    Delete
                  </Button>
                </Popconfirm>
              </div>
            </article>
          ))}
        </AdminResponsiveList>
      </section>

      <Modal
        confirmLoading={savingReply}
        okText="Save reply"
        onCancel={() => setReplyFeedback(null)}
        onOk={handleSaveReply}
        open={Boolean(replyFeedback)}
        title={replyFeedback ? `Admin reply: ${replyFeedback.name}` : "Admin reply"}
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
    </AdminShell>
  );
}
