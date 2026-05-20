"use client";

import { Select } from "antd";

export function AdminStatusSelect({ value, options, loading, onChange }) {
  return (
    <Select
      className="admin-status-select"
      loading={loading}
      onChange={onChange}
      options={options}
      value={value}
    />
  );
}
