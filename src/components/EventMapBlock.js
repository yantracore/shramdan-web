"use client";

import dynamic from "next/dynamic";

function EventMapSkeleton() {
  return (
    <div className="issue-map-skeleton" aria-busy="true" aria-hidden="true">
      <div className="issue-map-skeleton-shimmer" />
    </div>
  );
}

const EventMapBlock = dynamic(() => import("./EventMap"), {
  ssr: false,
  loading: EventMapSkeleton
});

export default EventMapBlock;
