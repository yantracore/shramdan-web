"use client";

// Primary CTA shown on an EVENT_SCHEDULED issue — once voting has closed and a
// campaign is scheduled, the action is no longer "support" but "join".
//
// The real join machinery already lives on the event (the role-picker modal in
// EventJoinPanel → POST /events/{id}/participants). So once we know the issue's
// event id, this routes straight there and reuses that working flow — no
// separate "join on issue" endpoint is needed (voting the issue is impossible
// past OPEN: POST /issues/{id}/vote returns 400 ISSUE_NOT_OPEN once promoted).
//
// The id can arrive three ways, in order of preference:
//   1. `eventId` prop — the detail page resolves it via resolveEventForIssue
//      (interim client-side `issueId` match, since the issue read omits it).
//   2. an embedded link on the issue itself (getIssueEventId) — the day the
//      backend lands `issue.event` / `issue.eventId`, this lights up for free.
//   3. neither → keep the CTA honest with an "almost ready" cue instead of a
//      dead button.

import { UserAddOutlined } from "@ant-design/icons";
import { Button } from "antd";
import Link from "next/link";
import { useToast } from "@/lib/toast";
import { getIssueEventId } from "@/lib/issueActions";

const COPY = {
  np: {
    label: "जोडिनुहोस्",
    soon: "अभियानको तालिका तय भइसक्यो — जोडिने सुविधा छिट्टै सक्रिय हुन्छ।"
  },
  en: {
    label: "Join",
    soon: "This campaign is scheduled — joining opens shortly."
  }
};

export function IssueJoinButton({
  issue,
  eventId: eventIdProp = null,
  language = "np",
  size,
  type = "primary",
  className,
  block = false
}) {
  const t = COPY[language] || COPY.np;
  const messageApi = useToast();
  // Resolved id from the page wins; fall back to any link embedded on the issue.
  const eventId = eventIdProp || getIssueEventId(issue);

  const button = (
    <Button
      block={block}
      className={className}
      icon={<UserAddOutlined />}
      size={size}
      type={type}
      onClick={
        eventId
          ? undefined
          : (event) => {
              // No event link yet → keep the CTA honest instead of dead.
              event.preventDefault();
              event.stopPropagation();
              messageApi.info(t.soon);
            }
      }
    >
      {t.label}
    </Button>
  );

  if (!eventId) return button;

  return (
    <Link
      href={`/events/${encodeURIComponent(eventId)}`}
      style={block ? { display: "block", width: "100%" } : undefined}
    >
      {button}
    </Link>
  );
}
