"use client";

import {
  CalendarOutlined,
  CheckCircleOutlined,
  EditOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  StopOutlined,
  ThunderboltOutlined,
  UserSwitchOutlined
} from "@ant-design/icons";
import {
  Button,
  DatePicker,
  Empty,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Space,
  Spin,
  Table,
  Tag
} from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminResponsiveList } from "@/components/AdminResponsiveList";
import { Form } from "@/components/AppForm";
import { AdminShell } from "@/components/AdminShell";
import { AdminFilters } from "@/components/admin/AdminFilters";
import { AdminListCard } from "@/components/admin/AdminListCard";
import { AdminPanelHeading } from "@/components/admin/AdminPanelHeading";
import { useAdminListResource } from "@/hooks/useAdminListResource";
import { cancelEvent, getJson, patchJson, postJson, updateEvent } from "@/lib/apiClient";
import {
  EVENT_RISK_COLORS,
  EVENT_RISK_LEVELS,
  EVENT_STATUSES,
  EVENT_STATUS_COLORS,
  LEADER_VOTING_STATUS_COLORS,
  buildEnumOptions,
  formatCoordinates,
  formatDate,
  formatEnum,
  getListItems,
  getResponseData
} from "@/lib/adminUtils";
import { useToast } from "@/lib/toast";

const EVENT_EXTRA_PARAMS = { limit: 100 };

const USER_SEARCH_LIMIT = 20;

export default function AdminEventsPage() {
  const messageApi = useToast();

  const {
    items: events,
    setItems: setEvents,
    loading: loadingEvents,
    error: eventError,
    filters,
    setFilter,
    refetch: fetchEvents
  } = useAdminListResource({
    path: "/events",
    initialFilters: {},
    extraParams: EVENT_EXTRA_PARAMS,
    parseList: getListItems,
    errorMessage: "Could not load events."
  });

  const statusOptions = useMemo(() => buildEnumOptions(EVENT_STATUSES), []);

  const [detailEvent, setDetailEvent] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [votingState, setVotingState] = useState(null);
  const [votingLoading, setVotingLoading] = useState(false);
  const [votingError, setVotingError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  const [leaderModalOpen, setLeaderModalOpen] = useState(false);
  const [leaderSearch, setLeaderSearch] = useState("");
  const [leaderResults, setLeaderResults] = useState([]);
  const [leaderSearching, setLeaderSearching] = useState(false);
  const [selectedLeaderId, setSelectedLeaderId] = useState("");

  const [tieBreakOpen, setTieBreakOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState("");

  const [editForm] = Form.useForm();
  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const riskLevelOptions = useMemo(() => buildEnumOptions(EVENT_RISK_LEVELS), []);

  const refreshDetail = useCallback(
    async (eventId) => {
      setDetailError("");
      setDetailLoading(true);
      try {
        const response = await getJson(`/events/${eventId}`, { requireAuth: true });
        const fullEvent = getResponseData(response, null);
        if (fullEvent) {
          setDetailEvent(fullEvent);
          setEvents((current) =>
            current.map((entry) => (entry.id === fullEvent.id ? { ...entry, ...fullEvent } : entry))
          );
        }
      } catch (error) {
        setDetailError(error.message || "Could not load event detail.");
      } finally {
        setDetailLoading(false);
      }
    },
    [setEvents]
  );

  const refreshVoting = useCallback(async (eventId) => {
    setVotingError("");
    setVotingLoading(true);
    try {
      const response = await getJson(`/events/${eventId}/leader-voting`, { requireAuth: true });
      setVotingState(getResponseData(response, null));
    } catch (error) {
      setVotingError(error.message || "Could not load leader-voting state.");
      setVotingState(null);
    } finally {
      setVotingLoading(false);
    }
  }, []);

  const openDetailModal = async (eventItem) => {
    setDetailEvent(eventItem);
    setVotingState(null);
    setVotingError("");
    await Promise.all([refreshDetail(eventItem.id), refreshVoting(eventItem.id)]);
  };

  const closeDetailModal = () => {
    setDetailEvent(null);
    setDetailError("");
    setDetailLoading(false);
    setVotingState(null);
    setVotingError("");
    setVotingLoading(false);
  };

  useEffect(() => {
    if (!leaderModalOpen) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLeaderSearching(true);
      try {
        const params = { limit: USER_SEARCH_LIMIT, isVerified: true };
        if (leaderSearch) params.search = leaderSearch;
        const response = await getJson("/users", { params, requireAuth: true });
        if (cancelled) return;
        setLeaderResults(getListItems(response));
      } catch (error) {
        if (!cancelled) {
          messageApi.error(error.message || "Could not search users.");
        }
      } finally {
        if (!cancelled) setLeaderSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [leaderModalOpen, leaderSearch, messageApi]);

  const openLeaderModal = () => {
    setSelectedLeaderId(detailEvent?.eventLeaderId || "");
    setLeaderSearch("");
    setLeaderResults([]);
    setLeaderModalOpen(true);
  };

  const closeLeaderModal = () => {
    setLeaderModalOpen(false);
    setSelectedLeaderId("");
    setLeaderSearch("");
  };

  const handleAssignLeader = async () => {
    if (!detailEvent || !selectedLeaderId) return;
    setActionLoading("assignLeader");
    try {
      await patchJson(
        `/events/${detailEvent.id}/leader`,
        { eventLeaderId: selectedLeaderId },
        { requireAuth: true }
      );
      messageApi.success("Event leader updated.");
      closeLeaderModal();
      await Promise.all([refreshDetail(detailEvent.id), refreshVoting(detailEvent.id)]);
    } catch (error) {
      messageApi.error(error.message || "Could not assign event leader.");
    } finally {
      setActionLoading("");
    }
  };

  const openTieBreak = () => {
    setSelectedCandidateId("");
    setTieBreakOpen(true);
  };

  const closeTieBreak = () => {
    setTieBreakOpen(false);
    setSelectedCandidateId("");
  };

  const handleTieBreak = async () => {
    if (!detailEvent || !selectedCandidateId) return;
    setActionLoading("tieBreak");
    try {
      await patchJson(
        `/events/${detailEvent.id}/leader-voting/tie-break`,
        { candidateId: selectedCandidateId },
        { requireAuth: true }
      );
      messageApi.success("Leader voting tie resolved.");
      closeTieBreak();
      await Promise.all([refreshDetail(detailEvent.id), refreshVoting(detailEvent.id)]);
    } catch (error) {
      messageApi.error(error.message || "Could not resolve tie.");
    } finally {
      setActionLoading("");
    }
  };

  const handleSettle = async () => {
    if (!detailEvent) return;
    setActionLoading("settle");
    try {
      await postJson(`/events/${detailEvent.id}/leader-voting/settle`, {}, { requireAuth: true });
      messageApi.success("Leader voting settled.");
      await Promise.all([refreshDetail(detailEvent.id), refreshVoting(detailEvent.id)]);
    } catch (error) {
      messageApi.error(error.message || "Could not settle voting.");
    } finally {
      setActionLoading("");
    }
  };

  const openEdit = () => {
    if (!detailEvent) return;
    editForm.setFieldsValue({
      scheduledAt: detailEvent.scheduledAt ? dayjs(detailEvent.scheduledAt) : null,
      durationMinutes: detailEvent.durationMinutes ?? null,
      meetupAddress: detailEvent.meetupAddress ?? "",
      meetupLatitude: detailEvent.meetupLatitude ?? null,
      meetupLongitude: detailEvent.meetupLongitude ?? null,
      meetupNotes: detailEvent.meetupNotes ?? "",
      coordinationLink: detailEvent.coordinationLink ?? "",
      whatToBring: detailEvent.whatToBring ?? "",
      planningNotes: detailEvent.planningNotes ?? "",
      riskLevel: detailEvent.riskLevel ?? undefined
    });
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    editForm.resetFields();
  };

  // PATCH /events/{id} is a partial update; compactPayload drops empty fields,
  // so this edits/sets values but cannot clear an existing field to blank.
  const handleEditSave = async () => {
    if (!detailEvent) return;
    let values;
    try {
      values = await editForm.validateFields();
    } catch {
      return;
    }
    const payload = {
      ...values,
      scheduledAt: values.scheduledAt ? values.scheduledAt.toISOString() : undefined
    };
    setActionLoading("edit");
    try {
      await updateEvent(detailEvent.id, payload);
      messageApi.success("Event logistics updated.");
      closeEdit();
      await refreshDetail(detailEvent.id);
    } catch (error) {
      messageApi.error(error.message || "Could not update event.");
    } finally {
      setActionLoading("");
    }
  };

  const openCancel = () => {
    setCancelReason("");
    setCancelOpen(true);
  };

  const closeCancel = () => {
    setCancelOpen(false);
    setCancelReason("");
  };

  const handleCancelEvent = async () => {
    if (!detailEvent) return;
    setActionLoading("cancel");
    try {
      await cancelEvent(detailEvent.id, cancelReason.trim() || undefined);
      messageApi.success("Event cancelled.");
      closeCancel();
      await refreshDetail(detailEvent.id);
    } catch (error) {
      messageApi.error(error.message || "Could not cancel event.");
    } finally {
      setActionLoading("");
    }
  };

  const handleDateFilter = (key, value) => {
    setFilter(key, value ? value.toISOString() : undefined);
  };

  const columns = [
    {
      title: "Event",
      dataIndex: "id",
      key: "id",
      render: (_, eventItem) => (
        <div className="admin-applicant-cell">
          <strong>{eventItem.meetupAddress || "Event " + eventItem.id.slice(0, 8)}</strong>
          {eventItem.scheduledAt ? (
            <span>
              <CalendarOutlined /> {formatDate(eventItem.scheduledAt)}
            </span>
          ) : (
            <span>Not scheduled</span>
          )}
        </div>
      )
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag color={EVENT_STATUS_COLORS[status]}>{formatEnum(status)}</Tag>
    },
    {
      title: "Risk",
      dataIndex: "riskLevel",
      key: "riskLevel",
      render: (riskLevel) =>
        riskLevel ? (
          <Tag color={EVENT_RISK_COLORS[riskLevel]}>{formatEnum(riskLevel)}</Tag>
        ) : (
          <span>—</span>
        )
    },
    {
      title: "Leader",
      dataIndex: "eventLeaderId",
      key: "eventLeaderId",
      render: (_, eventItem) => {
        const leader = eventItem.eventLeader;
        if (leader?.name) return <span>{leader.name}</span>;
        if (eventItem.eventLeaderId) return <span className="admin-mono">{eventItem.eventLeaderId.slice(0, 8)}…</span>;
        return <Tag color="default">Unassigned</Tag>;
      }
    },
    {
      title: "Attendees",
      dataIndex: "attendeeCount",
      key: "attendeeCount",
      render: (attendeeCount) => <span>{attendeeCount ?? "—"}</span>
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, eventItem) => (
        <Button icon={<EyeOutlined />} onClick={() => openDetailModal(eventItem)}>
          View detail
        </Button>
      )
    }
  ];

  const detailUploads = Array.isArray(detailEvent?.uploads) ? detailEvent.uploads : [];
  const detailIssue = detailEvent?.issue ?? null;
  const detailLeader = detailEvent?.eventLeader ?? null;

  const votingStatus = votingState?.status ?? null;
  const votingCandidates = Array.isArray(votingState?.candidates) ? votingState.candidates : [];
  const canTieBreak = votingStatus === "PENDING_ADMIN";
  const canSettle = votingStatus === "OPEN" || votingStatus === "PENDING_ADMIN";

  return (
    <AdminShell title="Events">
      <section className="admin-panel">
        <AdminPanelHeading
          eyebrow="Cleanup events"
          title="Events"
          description="Track scheduled and completed cleanup events, assign event leaders, and resolve leader-voting ties."
          onRefresh={fetchEvents}
          refreshing={loadingEvents}
        />

        <AdminFilters>
          <Select
            allowClear
            onChange={(value) => setFilter("status", value)}
            options={statusOptions}
            placeholder="Filter by status"
            value={filters.status}
          />
          <DatePicker
            onChange={(value) => handleDateFilter("fromDate", value)}
            placeholder="From date"
            showTime
          />
          <DatePicker
            onChange={(value) => handleDateFilter("toDate", value)}
            placeholder="To date"
            showTime
          />
        </AdminFilters>

        {eventError ? <p className="admin-error-text">{eventError}</p> : null}

        <AdminResponsiveList
          ariaLabel="Events list"
          emptyDescription={eventError ? "Events could not be loaded." : "No events found."}
          isEmpty={events.length === 0}
          loading={loadingEvents}
          loadingLabel="Loading events..."
          table={
            <Table
              columns={columns}
              dataSource={events}
              locale={{
                emptyText: (
                  <Empty
                    description={eventError ? "Events could not be loaded." : "No events found."}
                  />
                )
              }}
              loading={loadingEvents}
              pagination={{ pageSize: 8 }}
              rowKey="id"
              scroll={{ x: 1080 }}
            />
          }
        >
          {events.map((eventItem) => (
            <AdminListCard
              key={eventItem.id}
              header={
                <>
                  <div className="admin-list-card-title">
                    <strong>{eventItem.meetupAddress || "Event " + eventItem.id.slice(0, 8)}</strong>
                    {eventItem.scheduledAt ? (
                      <span>
                        <CalendarOutlined /> {formatDate(eventItem.scheduledAt)}
                      </span>
                    ) : (
                      <span>Not scheduled</span>
                    )}
                  </div>
                  <Tag color={EVENT_STATUS_COLORS[eventItem.status]}>
                    {formatEnum(eventItem.status)}
                  </Tag>
                </>
              }
              detail={
                <>
                  {eventItem.riskLevel ? (
                    <p>
                      <strong>Risk:</strong> {formatEnum(eventItem.riskLevel)}
                    </p>
                  ) : null}
                  <p>
                    <strong>Leader:</strong>{" "}
                    {eventItem.eventLeader?.name
                      ? eventItem.eventLeader.name
                      : eventItem.eventLeaderId
                      ? eventItem.eventLeaderId.slice(0, 8) + "…"
                      : "Unassigned"}
                  </p>
                  {eventItem.attendeeCount != null ? (
                    <p>
                      <strong>Attendees:</strong> {eventItem.attendeeCount}
                    </p>
                  ) : null}
                </>
              }
              actions={
                <Button icon={<EyeOutlined />} onClick={() => openDetailModal(eventItem)}>
                  View detail
                </Button>
              }
            />
          ))}
        </AdminResponsiveList>
      </section>

      <Modal
        footer={null}
        onCancel={closeDetailModal}
        open={Boolean(detailEvent)}
        title={detailEvent ? "Event detail" : ""}
        width={720}
      >
        {detailLoading ? (
          <div className="admin-modal-loading">
            <Spin />
          </div>
        ) : null}

        {detailError ? <p className="admin-error-text">{detailError}</p> : null}

        {detailEvent && !detailLoading ? (
          <div className="admin-modal-body">
            <div className="admin-modal-tags">
              <Tag color={EVENT_STATUS_COLORS[detailEvent.status]}>
                {formatEnum(detailEvent.status)}
              </Tag>
              {detailEvent.riskLevel ? (
                <Tag color={EVENT_RISK_COLORS[detailEvent.riskLevel]}>
                  {formatEnum(detailEvent.riskLevel)} risk
                </Tag>
              ) : null}
              {detailEvent.scheduledAt ? (
                <Tag icon={<CalendarOutlined />}>{formatDate(detailEvent.scheduledAt)}</Tag>
              ) : null}
            </div>

            <Space wrap className="admin-modal-actions">
              <Button icon={<EditOutlined />} onClick={openEdit} disabled={detailLoading}>
                Edit logistics
              </Button>
              <Button
                danger
                icon={<StopOutlined />}
                onClick={openCancel}
                disabled={
                  detailLoading ||
                  detailEvent.status === "CANCELLED" ||
                  detailEvent.status === "COMPLETED"
                }
              >
                Cancel event
              </Button>
            </Space>

            {detailIssue?.title ? (
              <div className="admin-modal-section">
                <strong>Linked issue</strong>
                <p className="admin-modal-description">{detailIssue.title}</p>
                {detailIssue.addressText ? (
                  <p>
                    <EnvironmentOutlined /> {detailIssue.addressText}
                  </p>
                ) : null}
              </div>
            ) : null}

            <dl className="admin-modal-meta">
              {detailEvent.meetupAddress ? (
                <>
                  <dt>Meetup</dt>
                  <dd>{detailEvent.meetupAddress}</dd>
                </>
              ) : null}
              {detailEvent.meetupNotes ? (
                <>
                  <dt>Meetup notes</dt>
                  <dd>{detailEvent.meetupNotes}</dd>
                </>
              ) : null}
              {detailEvent.durationMinutes ? (
                <>
                  <dt>Duration</dt>
                  <dd>{detailEvent.durationMinutes} min</dd>
                </>
              ) : null}
              {detailEvent.meetupLatitude != null && detailEvent.meetupLongitude != null ? (
                <>
                  <dt>Coordinates</dt>
                  <dd>
                    {formatCoordinates(detailEvent.meetupLatitude, detailEvent.meetupLongitude)}
                  </dd>
                </>
              ) : null}
              {detailEvent.planningNotes ? (
                <>
                  <dt>Planning notes</dt>
                  <dd>{detailEvent.planningNotes}</dd>
                </>
              ) : null}
              {detailEvent.completedAt ? (
                <>
                  <dt>Completed at</dt>
                  <dd>{formatDate(detailEvent.completedAt)}</dd>
                </>
              ) : null}
              {detailEvent.resultSummary ? (
                <>
                  <dt>Result summary</dt>
                  <dd>{detailEvent.resultSummary}</dd>
                </>
              ) : null}
              {detailEvent.attendeeCount != null ? (
                <>
                  <dt>Attendees</dt>
                  <dd>{detailEvent.attendeeCount}</dd>
                </>
              ) : null}
              <dt>Leader</dt>
              <dd>
                {detailLeader?.name
                  ? `${detailLeader.name}${detailLeader.email ? ` (${detailLeader.email})` : ""}`
                  : detailEvent.eventLeaderId
                  ? detailEvent.eventLeaderId
                  : "Unassigned"}
              </dd>
            </dl>

            <div className="admin-modal-section">
              <div className="admin-modal-section-heading">
                <strong>Leader voting</strong>
                {votingStatus ? (
                  <Tag color={LEADER_VOTING_STATUS_COLORS[votingStatus]}>
                    {formatEnum(votingStatus)}
                  </Tag>
                ) : null}
              </div>
              {votingLoading ? <Spin size="small" /> : null}
              {votingError ? <p className="admin-error-text">{votingError}</p> : null}
              {votingState && !votingLoading ? (
                <>
                  {votingState.closesAt ? (
                    <p>
                      <strong>Closes at:</strong> {formatDate(votingState.closesAt)}
                    </p>
                  ) : null}
                  {votingState.adminTieBreakClosesAt ? (
                    <p>
                      <strong>Admin tie-break closes:</strong>{" "}
                      {formatDate(votingState.adminTieBreakClosesAt)}
                    </p>
                  ) : null}
                  {votingCandidates.length > 0 ? (
                    <ul className="admin-candidate-list">
                      {votingCandidates.map((candidate) => (
                        <li key={candidate.id}>
                          <span>
                            <strong>{candidate.name || candidate.username || candidate.id}</strong>
                            {candidate.username ? (
                              <span className="admin-muted"> @{candidate.username}</span>
                            ) : null}
                          </span>
                          <Tag>{candidate.voteCount ?? 0} votes</Tag>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="admin-muted">No candidates yet.</p>
                  )}
                </>
              ) : null}

              <Space wrap>
                <Button
                  icon={<UserSwitchOutlined />}
                  onClick={openLeaderModal}
                  disabled={detailLoading}
                >
                  Assign leader
                </Button>
                <Button
                  icon={<CheckCircleOutlined />}
                  onClick={openTieBreak}
                  disabled={!canTieBreak || votingCandidates.length === 0}
                >
                  Tie-break voting
                </Button>
                <Popconfirm
                  title="Settle leader voting?"
                  description="Only acts when the voting deadline has passed."
                  okText="Settle now"
                  onConfirm={handleSettle}
                  disabled={!canSettle}
                >
                  <Button
                    icon={<ThunderboltOutlined />}
                    loading={actionLoading === "settle"}
                    disabled={!canSettle}
                  >
                    Settle voting
                  </Button>
                </Popconfirm>
              </Space>
            </div>

            {detailUploads.length > 0 ? (
              <div className="admin-modal-uploads">
                <strong>Result uploads</strong>
                <ul>
                  {detailUploads.map((upload) => (
                    <li key={upload.id || upload.url}>
                      <a href={upload.url} rel="noreferrer" target="_blank">
                        {upload.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        confirmLoading={actionLoading === "assignLeader"}
        okButtonProps={{ disabled: !selectedLeaderId }}
        okText="Assign leader"
        onCancel={closeLeaderModal}
        onOk={handleAssignLeader}
        open={leaderModalOpen}
        title="Assign event leader"
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Select
            allowClear
            filterOption={false}
            loading={leaderSearching}
            notFoundContent={leaderSearching ? <Spin size="small" /> : <Empty />}
            onChange={(value) => setSelectedLeaderId(value)}
            onSearch={(value) => setLeaderSearch(value)}
            options={leaderResults.map((user) => ({
              label: `${user.name || user.username || user.email}${
                user.email ? ` — ${user.email}` : ""
              }`,
              value: user.id
            }))}
            placeholder="Search verified users by name, email, or phone"
            showSearch
            style={{ width: "100%" }}
            value={selectedLeaderId || undefined}
          />
          <p className="admin-muted">
            Only verified users can be assigned. Use the search to find by name, email, username, or
            phone.
          </p>
        </Space>
      </Modal>

      <Modal
        confirmLoading={actionLoading === "tieBreak"}
        okButtonProps={{ disabled: !selectedCandidateId }}
        okText="Resolve tie"
        onCancel={closeTieBreak}
        onOk={handleTieBreak}
        open={tieBreakOpen}
        title="Tie-break leader voting"
      >
        {votingCandidates.length === 0 ? (
          <Empty description="No tied candidates to pick from." />
        ) : (
          <Radio.Group
            onChange={(eventItem) => setSelectedCandidateId(eventItem.target.value)}
            value={selectedCandidateId}
          >
            <Space direction="vertical">
              {votingCandidates.map((candidate) => (
                <Radio key={candidate.id} value={candidate.id}>
                  <strong>{candidate.name || candidate.username || candidate.id}</strong>
                  <span className="admin-muted"> — {candidate.voteCount ?? 0} votes</span>
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        )}
      </Modal>

      <Modal
        confirmLoading={actionLoading === "edit"}
        okText="Save changes"
        onCancel={closeEdit}
        onOk={handleEditSave}
        open={editOpen}
        title="Edit event logistics"
        width={640}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="Scheduled at" name="scheduledAt">
            <DatePicker showTime style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            label="Duration (minutes)"
            name="durationMinutes"
            rules={[{ type: "number", min: 1, message: "At least 1 minute." }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Risk level" name="riskLevel">
            <Select allowClear options={riskLevelOptions} placeholder="Select risk level" />
          </Form.Item>
          <Form.Item label="Meetup address" name="meetupAddress">
            <Input />
          </Form.Item>
          <Space style={{ display: "flex" }} align="start">
            <Form.Item label="Latitude" name="meetupLatitude" style={{ flex: 1 }}>
              <InputNumber step={0.000001} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Longitude" name="meetupLongitude" style={{ flex: 1 }}>
              <InputNumber step={0.000001} style={{ width: "100%" }} />
            </Form.Item>
          </Space>
          <Form.Item label="Meetup notes" name="meetupNotes">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            label="Coordination link"
            name="coordinationLink"
            rules={[{ type: "url", message: "Enter a valid URL." }]}
          >
            <Input placeholder="https://…" />
          </Form.Item>
          <Form.Item label="What to bring" name="whatToBring">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="Planning notes" name="planningNotes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        confirmLoading={actionLoading === "cancel"}
        okButtonProps={{ danger: true }}
        okText="Cancel event"
        cancelText="Keep event"
        onCancel={closeCancel}
        onOk={handleCancelEvent}
        open={cancelOpen}
        title="Cancel this event?"
      >
        <p className="admin-muted">
          Participants are notified. Add an optional reason — it rides along in the notification.
        </p>
        <Input.TextArea
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder="Reason (optional)…"
          maxLength={1000}
          rows={3}
          showCount
        />
      </Modal>
    </AdminShell>
  );
}
