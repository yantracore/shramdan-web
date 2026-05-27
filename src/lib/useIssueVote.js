"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { voteOnIssue } from "@/lib/apiClient";
import { getAuthSession, subscribeAuthSession } from "@/lib/authSession";
import { useToast } from "@/lib/toast";

export function useIssueVote({ issueId, initialVoteCount, content }) {
  const router = useRouter();
  const messageApi = useToast();
  const session = useSyncExternalStore(
    subscribeAuthSession,
    getAuthSession,
    () => null
  );
  const isAuthenticated = Boolean(session?.user);

  const [voted, setVoted] = useState(false);
  const [voting, setVoting] = useState(false);
  const [voteCount, setVoteCount] = useState(initialVoteCount ?? 0);

  const handleVoteClick = useCallback(
    async (event) => {
      if (event?.preventDefault) event.preventDefault();
      if (event?.stopPropagation) event.stopPropagation();

      if (!isAuthenticated) {
        router.push("/login");
        return;
      }
      if (voted || voting || !issueId) return;

      setVoting(true);
      setVoteCount((current) => current + 1);

      try {
        const response = await voteOnIssue(issueId);
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
    [content, isAuthenticated, issueId, messageApi, router, voted, voting]
  );

  return {
    isAuthenticated,
    voteCount,
    voted,
    voting,
    handleVoteClick
  };
}
