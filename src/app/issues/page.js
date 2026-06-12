import { Suspense } from "react";
import IssuesListClient from "./IssuesListClient";

export default function IssuesListPage() {
  return (
    <Suspense fallback={null}>
      <IssuesListClient />
    </Suspense>
  );
}
