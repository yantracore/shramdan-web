"use client";

import {
  CheckCircleTwoTone,
  CloseCircleOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  SearchOutlined,
  UserOutlined
} from "@ant-design/icons";
import { Avatar, Button, Empty, Form, Input, Modal, Select, Switch, Table, Tag, message } from "antd";
import { useMemo, useState } from "react";
import { AdminResponsiveList } from "@/components/AdminResponsiveList";
import { AdminShell } from "@/components/AdminShell";
import { AdminFilters } from "@/components/admin/AdminFilters";
import { AdminListCard } from "@/components/admin/AdminListCard";
import { AdminPanelHeading } from "@/components/admin/AdminPanelHeading";
import { useAdminListResource } from "@/hooks/useAdminListResource";
import { patchJson } from "@/lib/apiClient";
import { formatDate, getListItems } from "@/lib/adminUtils";

// Fields the admin can edit via PATCH /users/{id} (shipped 2026-06-30).
const EDITABLE_USER_FIELDS = ["name", "username", "email", "phone", "city", "bio", "isVerified"];

const USER_ROLES = ["USER", "ADMIN"];
const ROLE_COLORS = { USER: "default", ADMIN: "green" };

const VERIFIED_OPTIONS = [
  { label: "Verified only", value: "true" },
  { label: "Unverified only", value: "false" }
];

const USERS_EXTRA_PARAMS = { limit: 50 };

function getUserInitials(user) {
  const source = (user?.name || user?.username || user?.email || "").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

function getDisplayName(user) {
  return user?.name || user?.username || user?.email || "—";
}

export default function AdminUsersPage() {
  const {
    items: users,
    loading: loadingUsers,
    error: usersError,
    filters,
    setFilter,
    refetch: fetchUsers
  } = useAdminListResource({
    path: "/users",
    initialFilters: {},
    extraParams: USERS_EXTRA_PARAMS,
    parseList: getListItems,
    errorMessage: "Could not load users."
  });

  const [messageApi, messageContext] = message.useMessage();
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editForm] = Form.useForm();

  const roleOptions = useMemo(
    () => USER_ROLES.map((role) => ({ label: role, value: role })),
    []
  );

  const openEdit = (user) => {
    setEditing(user);
    editForm.setFieldsValue({
      name: user.name ?? "",
      username: user.username ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      city: user.city ?? "",
      bio: user.bio ?? "",
      isVerified: Boolean(user.isVerified)
    });
  };

  const closeEdit = () => {
    setEditing(null);
    editForm.resetFields();
  };

  const submitEdit = async () => {
    let values;
    try {
      values = await editForm.validateFields();
    } catch {
      return;
    }
    // Send only fields that actually changed (avoids clobbering with empties).
    const payload = {};
    for (const key of EDITABLE_USER_FIELDS) {
      const next = values[key];
      const prev = editing?.[key];
      if (key === "isVerified") {
        if (Boolean(next) !== Boolean(prev)) payload[key] = Boolean(next);
      } else {
        const trimmed = typeof next === "string" ? next.trim() : next;
        if ((trimmed || "") !== (prev || "")) payload[key] = trimmed || null;
      }
    }
    if (Object.keys(payload).length === 0) {
      closeEdit();
      return;
    }
    setSaving(true);
    try {
      await patchJson(`/users/${editing.id}`, payload, { requireAuth: true });
      messageApi.success("User updated.");
      closeEdit();
      fetchUsers();
    } catch (err) {
      messageApi.error(err?.message || "Could not update user.");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: "User",
      dataIndex: "id",
      key: "user",
      render: (_, user) => (
        <div className="admin-user-row">
          <Avatar size={40} src={user.avatar || undefined} icon={<UserOutlined />}>
            {!user.avatar ? getUserInitials(user) : null}
          </Avatar>
          <div className="admin-applicant-cell">
            <strong>{getDisplayName(user)}</strong>
            {user.username ? <span>@{user.username}</span> : null}
          </div>
        </div>
      )
    },
    {
      title: "Contact",
      key: "contact",
      render: (_, user) => (
        <div className="admin-applicant-cell">
          {user.email ? (
            <span>
              <MailOutlined /> {user.email}
            </span>
          ) : null}
          {user.phone ? (
            <span>
              <PhoneOutlined /> {user.phone}
            </span>
          ) : null}
        </div>
      )
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role) => <Tag color={ROLE_COLORS[role] || "default"}>{role}</Tag>
    },
    {
      title: "Verified",
      dataIndex: "isVerified",
      key: "isVerified",
      render: (isVerified) =>
        isVerified ? (
          <Tag color="green" icon={<CheckCircleTwoTone twoToneColor="#52c41a" />}>
            Verified
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />}>Unverified</Tag>
        )
    },
    {
      title: "Sign-in",
      dataIndex: "isOAuthUser",
      key: "isOAuthUser",
      render: (isOAuthUser) => <Tag>{isOAuthUser ? "OAuth" : "Password"}</Tag>
    },
    {
      title: "Joined",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) => <span>{formatDate(createdAt) || "—"}</span>
    },
    {
      title: "",
      key: "actions",
      render: (_, user) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(user)}>
          Edit
        </Button>
      )
    }
  ];

  return (
    <AdminShell title="Users">
      {messageContext}
      <section className="admin-panel">
        <AdminPanelHeading
          eyebrow="Registered users"
          title="Users"
          description="Browse registered users, filter by role or verification, and search by name, email, username, or phone. Edit a user's profile details and verification with the Edit action."
          onRefresh={fetchUsers}
          refreshing={loadingUsers}
        />

        <AdminFilters>
          <Input
            allowClear
            onChange={(event) => setFilter("search", event.target.value || undefined)}
            placeholder="Search name, email, username, or phone"
            prefix={<SearchOutlined />}
            value={filters.search || ""}
          />
          <Select
            allowClear
            onChange={(value) => setFilter("role", value)}
            options={roleOptions}
            placeholder="Filter by role"
            value={filters.role}
          />
          <Select
            allowClear
            onChange={(value) => setFilter("isVerified", value)}
            options={VERIFIED_OPTIONS}
            placeholder="Verification"
            value={filters.isVerified}
          />
        </AdminFilters>

        {usersError ? <p className="admin-error-text">{usersError}</p> : null}

        <AdminResponsiveList
          ariaLabel="Users list"
          emptyDescription={usersError ? "Users could not be loaded." : "No users found."}
          isEmpty={users.length === 0}
          loading={loadingUsers}
          loadingLabel="Loading users..."
          table={
            <Table
              columns={columns}
              dataSource={users}
              locale={{
                emptyText: (
                  <Empty
                    description={usersError ? "Users could not be loaded." : "No users found."}
                  />
                )
              }}
              loading={loadingUsers}
              pagination={{ pageSize: 10 }}
              rowKey="id"
              scroll={{ x: 1080 }}
            />
          }
        >
          {users.map((user) => (
            <AdminListCard
              key={user.id}
              header={
                <>
                  <div className="admin-list-card-title">
                    <div className="admin-user-row">
                      <Avatar size={40} src={user.avatar || undefined} icon={<UserOutlined />}>
                        {!user.avatar ? getUserInitials(user) : null}
                      </Avatar>
                      <div>
                        <strong>{getDisplayName(user)}</strong>
                        {user.username ? <span>@{user.username}</span> : null}
                      </div>
                    </div>
                  </div>
                  <Tag color={ROLE_COLORS[user.role] || "default"}>{user.role}</Tag>
                </>
              }
              detail={
                <>
                  {user.email ? (
                    <p>
                      <MailOutlined /> {user.email}
                    </p>
                  ) : null}
                  {user.phone ? (
                    <p>
                      <PhoneOutlined /> {user.phone}
                    </p>
                  ) : null}
                  <p>
                    <strong>Verified:</strong> {user.isVerified ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Sign-in:</strong> {user.isOAuthUser ? "OAuth" : "Password"}
                  </p>
                  <p>
                    <strong>Joined:</strong> {formatDate(user.createdAt) || "—"}
                  </p>
                  <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(user)}>
                    Edit
                  </Button>
                </>
              }
            />
          ))}
        </AdminResponsiveList>
      </section>

      <Modal
        title={editing ? `Edit ${getDisplayName(editing)}` : "Edit user"}
        open={Boolean(editing)}
        onCancel={closeEdit}
        onOk={submitEdit}
        okText="Save changes"
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="Name" name="name">
            <Input placeholder="Full name" />
          </Form.Item>
          <Form.Item label="Username" name="username">
            <Input placeholder="username" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ type: "email", message: "Enter a valid email." }]}
          >
            <Input placeholder="name@example.com" />
          </Form.Item>
          <Form.Item label="Phone" name="phone">
            <Input placeholder="98XXXXXXXX" />
          </Form.Item>
          <Form.Item label="City" name="city">
            <Input placeholder="City" />
          </Form.Item>
          <Form.Item label="Bio" name="bio">
            <Input.TextArea rows={2} placeholder="Short bio" />
          </Form.Item>
          <Form.Item label="Verified" name="isVerified" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </AdminShell>
  );
}
