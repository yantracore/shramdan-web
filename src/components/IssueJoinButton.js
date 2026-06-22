"use client";

// Primary CTA shown on an EVENT_SCHEDULED issue — once voting has closed and a
// campaign is scheduled, the action is no longer "support" but "join".
//
// The real join machinery already lives on the event (the role-picker modal in
// EventJoinPanel → POST /events/{id}/participants). So when the backend links
// the issue to its event (see getIssueEventId), this routes straight there and
// reuses that working flow — no separate "join on issue" endpoint is needed.
// Until that link ships, the button is present (the page reads correctly) but
// explains it's almost ready. It upgrades itself the day the field lands.

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
  language = "np",
  size,
  type = "primary",
  className,
  block = false
}) {
  const t = COPY[language] || COPY.np;
  const messageApi = useToast();
  const eventId = getIssueEventId(issue);

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
