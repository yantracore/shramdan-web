"use client";

import { Skeleton } from "antd";

export function CommentSkeleton({ rows = 3 }) {
  return (
    <ul className="comment-list comment-list-skeleton" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="comment-node comment-depth-0">
          <span className="comment-avatar comment-avatar-skeleton" aria-hidden="true" />
          <div className="comment-body">
            <Skeleton
              active
              paragraph={{ rows: 1, width: ["80%"] }}
              title={{ width: "30%" }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
