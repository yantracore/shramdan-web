import { Suspense } from "react";
import EventsListClient from "./EventsListClient";

export default function EventsListPage() {
  return (
    <Suspense fallback={null}>
      <EventsListClient />
    </Suspense>
  );
}
