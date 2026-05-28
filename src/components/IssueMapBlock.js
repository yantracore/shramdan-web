"use client";

import dynamic from "next/dynamic";

function IssueMapSkeleton() {
  return (
    <div className="issue-map-skeleton" aria-busy="true" aria-hidden="true">
      <div className="issue-map-skeleton-shimmer" />
    </div>
  );
}

const IssueMapBlock = dynamic(() => import("./IssueMap"), {
  ssr: false,
  loading: IssueMapSkeleton
});

export default IssueMapBlock;
