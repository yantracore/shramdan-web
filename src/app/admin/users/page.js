"use client";

import {
  CheckCircleTwoTone,
  CloseCircleOutlined,
  MailOutlined,
  PhoneOutlined,
  SearchOutlined,
  UserOutlined
} from "@ant-design/icons";
import { Avatar, Empty, Input, Select, Table, Tag } from "antd";
import { useMemo } from "react";
import { AdminResponsiveList } from "@/components/AdminResponsiveList";
import { AdminShell } from "@/components/AdminShell";
import { AdminFilters } from "@/components/admin/AdminFilters";
import { AdminListCard } from "@/components/admin/AdminListCard";
import { AdminPanelHeading } from "@/components/admin/AdminPanelHeading";
import { useAdminListResource } from "@/hooks/useAdminListResource";
import { formatDate, getListItems } from "@/lib/adminUtils";

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

  const roleOptions = useMemo(
    () => USER_ROLES.map((role) => ({ label: role, value: role })),
    []
  );

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
    }
  ];

  return (
    <AdminShell title="Users">
      <section className="admin-panel">
        <AdminPanelHeading
          eyebrow="Registered users"
          title="Users"
          description="Browse registered users, filter by role or verification, and search by name, email, username, or phone. Read-only — role changes will land once the backend mutation is wired."
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
                </>
              }
            />
          ))}
        </AdminResponsiveList>
      </section>
    </AdminShell>
  );
}
