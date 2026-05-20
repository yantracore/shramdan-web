"use client";

export function AdminListCard({ header, control, note, detail, actions }) {
  return (
    <article className="admin-list-card">
      {header ? <div className="admin-list-card-header">{header}</div> : null}
      {control ? <div className="admin-list-card-control">{control}</div> : null}
      {note ? <p className="admin-list-card-note">{note}</p> : null}
      {detail ? <div className="admin-list-card-detail">{detail}</div> : null}
      {actions ? <div className="admin-list-card-actions">{actions}</div> : null}
    </article>
  );
}
