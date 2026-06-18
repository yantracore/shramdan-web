"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { retractVoteOnIssue, voteOnIssue } from "@/lib/apiClient";
import { getAuthSession, subscribeAuthSession } from "@/lib/authSession";
import { buildLoginHref } from "@/lib/loginRedirect";
import { useToast } from "@/lib/toast";

export function useIssueVote({
  issueId,
  initialVoteCount,
  initialVoted,
  content
}) {
  const router = useRouter();
  const pathname = usePathname();
  const messageApi = useToast();
  const session = useSyncExternalStore(
    subscribeAuthSession,
    getAuthSession,
    () => null
  );
  const isAuthenticated = Boolean(session?.user);

  const [voted, setVoted] = useState(Boolean(initialVoted));
  const [voting, setVoting] = useState(false);
  const [voteCount, setVoteCount] = useState(initialVoteCount ?? 0);

  const handleVoteClick = useCallback(
    async (eventOrRole, maybeEvent) => {
      // Backward-compatible signature: handleVoteClick(event) OR
      // handleVoteClick(role, event) OR handleVoteClick({ voterRole,
      // eventRole }, event). When `eventOrRole` is a string we treat it as
      // the voter role; when it's a plain object carrying `voterRole` we
      // read role + eventRole from it; otherwise it's the click event. The
      // caller (the modal confirm) already prevented default.
      let voterRole = "INTERESTED";
      let eventRole;
      let event = maybeEvent;
      if (typeof eventOrRole === "string") {
        voterRole = eventOrRole;
      } else if (eventOrRole && typeof eventOrRole === "object" && "voterRole" in eventOrRole) {
        voterRole = eventOrRole.voterRole;
        eventRole = eventOrRole.eventRole;
      } else {
        event = eventOrRole;
      }
      if (event?.preventDefault) event.preventDefault();
      if (event?.stopPropagation) event.stopPropagation();

      if (!isAuthenticated) {
        router.push(buildLoginHref(pathname, "vote"));
        return;
      }
      if (voted || voting || !issueId) return;

      setVoting(true);
      setVoteCount((current) => current + 1);

      try {
        const response = await voteOnIssue(issueId, voterRole, eventRole);
        const serverCount = response?.data?.voteCount;
        if (typeof serverCount === "number") {
          setVoteCount(serverCount);
        }
        setVoted(true);
        messageApi.success(content.voteSuccess);
      } catch (error) {
        if (error?.errorCode === "ALREADY_VOTED" || error?.status === 409) {
          setVoted(true);
          setVoteCount((current) => Math.max(0, current - 1));
          messageApi.info(content.voteAlreadyVoted);
        } else if (error?.status === 403) {
          setVoteCount((current) => Math.max(0, current - 1));
          messageApi.error(content.voteForbidden);
        } else {
          setVoteCount((current) => Math.max(0, current - 1));
          messageApi.error(error?.message || content.voteError);
        }
      } finally {
        setVoting(false);
      }
    },
    [content, isAuthenticated, issueId, messageApi, pathname, router, voted, voting]
  );

  // Retract an existing vote. Backend only permits this while the issue is
  // still OPEN (409 otherwise), so we roll the optimistic decrement back and
  // keep the "voted" state when the withdrawal is rejected.
  const handleRetract = useCallback(
    async (event) => {
      if (event?.preventDefault) event.preventDefault();
      if (event?.stopPropagation) event.stopPropagation();

      if (!isAuthenticated) {
        router.push(buildLoginHref(pathname, "vote"));
        return;
      }
      if (!voted || voting || !issueId) return;

      setVoting(true);
      setVoteCount((current) => Math.max(0, current - 1));

      try {
        const response = await retractVoteOnIssue(issueId);
        const serverCount = response?.data?.voteCount;
        if (typeof serverCount === "number") {
          setVoteCount(serverCount);
        }
        setVoted(false);
        messageApi.success(content.voteWithdrawn);
      } catch (error) {
        if (error?.status === 404) {
          // Vote already gone server-side — the optimistic decrement was right.
          setVoted(false);
          return;
        }
        // Could not withdraw — roll the optimistic decrement back.
        setVoteCount((current) => current + 1);
        // The backend blocks un-voting once the issue leaves OPEN (e.g. it
        // crossed the vote threshold and became a scheduled event). Live it
        // returns 400 ISSUE_NOT_OPEN (the OpenAPI's 409 is a documentation
        // drift); handle both.
        if (error?.errorCode === "ISSUE_NOT_OPEN" || error?.status === 409) {
          messageApi.info(content.voteWithdrawNotOpen);
        } else {
          messageApi.error(error?.message || content.voteWithdrawError);
        }
      } finally {
        setVoting(false);
      }
    },
    [content, isAuthenticated, issueId, messageApi, pathname, router, voted, voting]
  );

  return {
    isAuthenticated,
    voteCount,
    voted,
    voting,
    handleVoteClick,
    handleRetract
  };
}
