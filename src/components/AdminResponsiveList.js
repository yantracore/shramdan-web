"use client";

import { Empty } from "antd";

export function AdminResponsiveList({
  ariaLabel,
  children,
  emptyDescription,
  isEmpty,
  loading,
  loadingLabel,
  table
}) {
  return (
    <>
      <div className="admin-table-view">{table}</div>
      <div className="admin-list-view" aria-label={ariaLabel}>
        {loading ? <p className="admin-list-state">{loadingLabel}</p> : null}
        {!loading && isEmpty ? <Empty description={emptyDescription} /> : null}
        {children}
      </div>
    </>
  );
}
