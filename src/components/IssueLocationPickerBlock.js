"use client";

import dynamic from "next/dynamic";

function PickerSkeleton() {
  return (
    <div className="location-picker-skeleton" aria-busy="true" aria-hidden="true">
      <div className="location-picker-skeleton-shimmer" />
    </div>
  );
}

const IssueLocationPickerBlock = dynamic(() => import("./IssueLocationPicker"), {
  ssr: false,
  loading: PickerSkeleton
});

export default IssueLocationPickerBlock;
