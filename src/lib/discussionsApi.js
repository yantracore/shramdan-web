// src/lib/discussionsApi.js
// Real API client for discussions. Degrades gracefully on 404 / 501
// by falling back to the demo-mode stub helpers — same pattern as
// EventJoinPanel, ReminderCadencePanel, ContributionIntentPanel.
//
// Backend contracts: docs/api-requirements/discussions.md

import { postJson, deleteJson } from '@/lib/apiClient';
import {
  demoPostTopic,
  demoPostMessage,
  demoCastVote,
  demoWithdrawVote,
} from '@/lib/discussionsStub';

const GRACEFUL_STATUSES = new Set([404, 501, 0]);

function isGraceful(err) {
  if (!err) return false;
  const status = err?.status ?? err?.statusCode ?? 0;
  return GRACEFUL_STATUSES.has(status) || err?.message?.includes('fetch');
}

export async function apiPostTopic({ kind, title, body, anonymous = false, linkedEntity = null }, { isDemoId } = {}) {
  if (isDemoId) {
    return demoPostTopic({ kind, title, body, anonymous, linkedEntity });
  }
  try {
    return await postJson('/discussions', { kind, title, body, anonymous, linkedEntity }, { requireAuth: true });
  } catch (err) {
    if (isGraceful(err)) return demoPostTopic({ kind, title, body, anonymous, linkedEntity });
    throw err;
  }
}

export async function apiPostMessage(topicSlug, { body, anonymous = false }, { isDemoId } = {}) {
  if (isDemoId) {
    return demoPostMessage(topicSlug, { body, anonymous });
  }
  try {
    return await postJson(`/discussions/${topicSlug}/messages`, { body, anonymous }, { requireAuth: true });
  } catch (err) {
    if (isGraceful(err)) return demoPostMessage(topicSlug, { body, anonymous });
    throw err;
  }
}

export async function apiCastVote(topicSlug, { isDemoId } = {}) {
  if (isDemoId) return demoCastVote(topicSlug);
  try {
    return await postJson(`/discussions/${topicSlug}/votes`, {}, { requireAuth: true });
  } catch (err) {
    if (isGraceful(err)) return demoCastVote(topicSlug);
    throw err;
  }
}

export async function apiWithdrawVote(topicSlug, { isDemoId } = {}) {
  if (isDemoId) return demoWithdrawVote(topicSlug);
  try {
    return await deleteJson(`/discussions/${topicSlug}/votes`, { requireAuth: true });
  } catch (err) {
    if (isGraceful(err)) return demoWithdrawVote(topicSlug);
    throw err;
  }
}
