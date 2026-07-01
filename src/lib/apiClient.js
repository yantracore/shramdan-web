import {
  clearAuthSession,
  expireAuthSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  setAuthSession
} from "@/lib/authSession";
import { reportApiDown, reportApiUp } from "@/lib/apiHealth";

// Staging (active). Temporary devtunnel z0n76c1j-3000 is retired.
const FALLBACK_API_BASE_URL = "https://backend.shramdan.org/api/v1";

function normalizeApiBaseUrl(baseUrl) {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");

  if (/\/api$/i.test(normalizedBaseUrl)) {
    return `${normalizedBaseUrl}/v1`;
  }

  return normalizedBaseUrl;
}

export const API_BASE_URL = normalizeApiBaseUrl(
  process.env.NEXT_PUBLIC_API_BASE_URL || FALLBACK_API_BASE_URL
);

export class ApiError extends Error {
  constructor(message, { errorCode, status, data } = {}) {
    super(message);
    this.name = "ApiError";
    this.errorCode = errorCode;
    this.status = status;
    this.data = data;
  }
}

export function compactPayload(values) {
  return Object.fromEntries(
    Object.entries(values).flatMap(([key, value]) => {
      if (value === undefined || value === null) {
        return [];
      }

      const normalizedValue = typeof value === "string" ? value.trim() : value;

      if (normalizedValue === "") {
        return [];
      }

      return [[key, normalizedValue]];
    })
  );
}

function createApiUrl(path, params) {
  const url = new URL(`${API_BASE_URL}${path}`);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

function getApiErrorMessage(data, status) {
  return (
    data?.error?.message ||
    data?.message ||
    data?.error ||
    `Request failed with status ${status}.`
  );
}

function getApiErrorCode(data) {
  return data?.errorCode || data?.error?.code || null;
}

function shouldClearSession(errorCode, status) {
  return errorCode === "INVALID_TOKEN" || errorCode === "AUTH_REQUIRED" || status === 401;
}

const REFRESH_PATH = "/auth/refresh";
const LOGOUT_PATH = "/auth/logout";

let inFlightRefresh = null;

async function performRefresh(refreshToken) {
  const url = createApiUrl(REFRESH_PATH);
  const response = await trackedFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken })
  });
  const data = await parseResponse(response);

  if (!response.ok || data?.success === false) {
    const errorCode = getApiErrorCode(data);
    throw new ApiError(getApiErrorMessage(data, response.status), {
      errorCode,
      status: response.status,
      data
    });
  }

  const next = data?.data ?? data;
  if (!next?.accessToken) {
    throw new ApiError("Refresh response missing access token.", {
      errorCode: "REFRESH_FAILED",
      status: 500
    });
  }

  setAuthSession({
    accessToken: next.accessToken,
    refreshToken: next.refreshToken ?? null
  });

  return next.accessToken;
}

function refreshAccessToken() {
  if (inFlightRefresh) return inFlightRefresh;

  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    return Promise.reject(
      new ApiError("No refresh token available.", {
        errorCode: "NO_REFRESH_TOKEN",
        status: 401
      })
    );
  }

  inFlightRefresh = performRefresh(refreshToken).finally(() => {
    inFlightRefresh = null;
  });

  return inFlightRefresh;
}

const UNAVAILABLE_STATUSES = new Set([502, 503, 504]);

// One choke point for every network call. A dead/unreachable backend (fetch
// reject) or a gateway 5xx becomes an ApiError + a health "down" report; any
// real answer from the server (even a 4xx) reports "up".
async function trackedFetch(url, init) {
  let response;
  try {
    response = await fetch(url, init);
  } catch {
    reportApiDown("unreachable");
    throw new ApiError("Can't reach the server right now.", {
      errorCode: "SERVER_UNREACHABLE",
      status: 0
    });
  }

  if (UNAVAILABLE_STATUSES.has(response.status)) {
    reportApiDown("service_unavailable");
    throw new ApiError("The server is temporarily unavailable.", {
      errorCode: "SERVICE_UNAVAILABLE",
      status: response.status
    });
  }

  reportApiUp();
  return response;
}

async function parseResponse(response) {
  const responseText = await response.text();

  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return { message: responseText };
  }
}

export async function apiRequest(path, options = {}) {
  const {
    body,
    headers,
    method = "GET",
    params,
    requireAuth = false,
    token = getStoredAccessToken(),
    _isRetry = false
  } = options;

  const requestHeaders = {
    ...headers
  };

  if (body !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  if (requireAuth && !token) {
    throw new ApiError("You need to log in again.", {
      errorCode: "AUTH_REQUIRED",
      status: 401
    });
  }

  const response = await trackedFetch(createApiUrl(path, params), {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(compactPayload(body))
  });

  const data = await parseResponse(response);

  if (!response.ok || data?.success === false) {
    const errorCode = getApiErrorCode(data);
    const sessionLikelyDead = shouldClearSession(errorCode, response.status);
    const canRefresh =
      sessionLikelyDead &&
      !_isRetry &&
      path !== REFRESH_PATH &&
      path !== LOGOUT_PATH &&
      Boolean(getStoredRefreshToken());

    if (canRefresh) {
      try {
        const newAccessToken = await refreshAccessToken();
        return apiRequest(path, { ...options, token: newAccessToken, _isRetry: true });
      } catch {
        expireAuthSession();
        throw new ApiError(getApiErrorMessage(data, response.status), {
          errorCode,
          status: response.status,
          data
        });
      }
    }

    if (sessionLikelyDead) {
      expireAuthSession();
    }

    throw new ApiError(getApiErrorMessage(data, response.status), {
      errorCode,
      status: response.status,
      data
    });
  }

  return data;
}

export function getJson(path, options) {
  return apiRequest(path, { ...options, method: "GET" });
}

export function postJson(path, values, options) {
  return apiRequest(path, { ...options, body: values, method: "POST" });
}

export function patchJson(path, values, options) {
  return apiRequest(path, { ...options, body: values, method: "PATCH" });
}

export function putJson(path, values, options) {
  return apiRequest(path, { ...options, body: values, method: "PUT" });
}

export function deleteJson(path, options) {
  return apiRequest(path, { ...options, method: "DELETE" });
}

export function loginWithPassword(credentials) {
  return postJson("/auth/login", credentials);
}

// Password reset via email OTP (anonymous).
//   forgotPassword({ email }) → 200 (reset code emailed); 429 on cooldown.
//   resetPassword({ email, otp, newPassword }) → 200; 400 bad OTP, 404 no
//     pending code, 429 too many attempts.
export function forgotPassword(email) {
  return postJson("/auth/forgot-password", { email });
}

export function resetPassword(values) {
  return postJson("/auth/reset-password", values);
}

// Resend a pending verification OTP for the current user (authenticated).
// `channel` ∈ email | phone. 409 if nothing is pending, 429 on cooldown.
export function resendOtp(channel) {
  return postJson("/auth/resend-otp", { channel }, { requireAuth: true });
}

export async function logoutAndClearSession() {
  const refreshToken = getStoredRefreshToken();
  if (refreshToken) {
    try {
      await postJson(LOGOUT_PATH, { refreshToken });
    } catch {
      // best-effort: if the server can't revoke (network, already revoked),
      // still clear local storage so the client is logged out.
    }
  }
  clearAuthSession();
}

export function fetchMe() {
  return getJson("/auth/me", { requireAuth: true });
}

export function updateMe(values) {
  return patchJson("/auth/me", values, { requireAuth: true });
}

export function changePassword(values) {
  return postJson("/auth/change-password", values, { requireAuth: true });
}

// Account security (all authenticated).
//   fetchSessions → { sessions: [{ id, userAgent, ip, createdAt, expiresAt }] }
//   revokeSession(id) — revoke one session (200/404).
//   logoutAllSessions → { revoked: N } (signs out everywhere, incl. this one).
//   deleteAccount(password) — self-service account deletion; 403 on a wrong
//     password. Clear the local session + redirect after either of the last
//     two, since the current token is no longer valid.
export function fetchSessions() {
  return getJson("/auth/sessions", { requireAuth: true });
}

export function revokeSession(sessionId) {
  return deleteJson(`/auth/sessions/${sessionId}`, { requireAuth: true });
}

export function logoutAllSessions() {
  return postJson("/auth/logout-all", {}, { requireAuth: true });
}

export function deleteAccount(password) {
  return apiRequest("/auth/me", {
    method: "DELETE",
    body: { password },
    requireAuth: true
  });
}

// Optional SMS phone verification (authenticated).
//   sendPhoneOtp(phone?) — sends an SMS code; an optional E.164 `phone`
//     attaches/replaces the number first. 503 = SMS service unavailable.
//   verifyPhoneOtp(otp) — confirms the 6-digit code → { user: { phone,
//     phoneVerifiedAt } }. 400 = bad/expired code, 404 = no pending code.
export function sendPhoneOtp(phone) {
  return postJson("/auth/phone/send-otp", phone ? { phone } : {}, { requireAuth: true });
}

export function verifyPhoneOtp(otp) {
  return postJson("/auth/phone/verify", { otp }, { requireAuth: true });
}

// Application-based signup → email OTP flow (replaced the retired
// /auth/register + /auth/verify-otp SMS flow on 2026-06-17).
//   requestApplicationOtp: { email } → 200 (6-digit code emailed). 409
//             USER_ALREADY_EXISTS when the email already has an account;
//             429 OTP_RESEND_COOLDOWN while the resend cooldown is active.
//   submitApplication: { name, email, otp, password, role, motivation,
//             phone?, experience?, additionalInfo?, portfolioId?, resumeId? }
//             → 201 { user, application, accessToken, refreshToken }. This
//             creates a VERIFIED account AND signs the user in — feed the
//             returned user + tokens straight into setAuthSession. The user
//             is full (email + role), so no merge step is needed. Errors:
//             400 OTP_INVALID, 404 OTP_NOT_FOUND, 409 USER_ALREADY_EXISTS,
//             429 OTP_TOO_MANY_ATTEMPTS.
export function requestApplicationOtp(email) {
  return postJson("/applications/request-otp", { email });
}

export function submitApplication(values) {
  return postJson("/applications", values);
}

// `eventRole` is REQUIRED when voterRole === "GOING" (the participant role the
// voter signs up to take at the eventual event — WORKER | PHOTOGRAPHER |
// LIVESTREAMER | MEDIC | SAFETY_LEAD | LOGISTICS) and MUST be omitted for
// INTERESTED / WANT_TO_LEAD. COORDINATOR was removed from this enum 2026-06-23
// (coordination ≡ leadership → the WANT_TO_LEAD path). On conversion, GOING
// voters carrying a role are auto-added as CONFIRMED participants.
export function voteOnIssue(issueId, voterRole = "INTERESTED", eventRole) {
  const body = { voterRole };
  if (eventRole) body.eventRole = eventRole;
  return postJson(`/issues/${issueId}/vote`, body, { requireAuth: true });
}

// Retract a vote. Backend allows this only while the issue is still OPEN
// (returns 409 otherwise) and responds with { data: { voteCount } }.
export function retractVoteOnIssue(issueId) {
  return deleteJson(`/issues/${issueId}/vote`, { requireAuth: true });
}

// An issue's participant roster — the GOING voters who picked a participation
// role, i.e. the people who'll show up once the issue converts to an event.
// Public read; paginated ({ items, nextCursor }). Each item is
// { voteId, eventRole, joinedAt, user: { id, name, username, avatar, city } }.
// This is the issue-stage analogue of GET /events/{id}/participants — same
// "who's committed to this activity" surface, one lifecycle stage earlier.
export function fetchIssueParticipants(issueId, params = {}) {
  return getJson(`/issues/${issueId}/participants`, { params });
}

// Event logistics edit + cancel (event leader or admin). updateEvent takes a
// partial of { scheduledAt, durationMinutes, meetupLatitude, meetupLongitude,
// meetupAddress, meetupNotes, coordinationLink, whatToBring, planningNotes,
// riskLevel(NORMAL|WATCH|URGENT|CRITICAL) }. cancelEvent posts an optional
// reason that rides along in the participant notification.
export function updateEvent(eventId, values) {
  return patchJson(`/events/${eventId}`, values, { requireAuth: true });
}

export function cancelEvent(eventId, reason) {
  return postJson(`/events/${eventId}/cancel`, { reason }, { requireAuth: true });
}

// Report an issue for moderation (authenticated). `values` is
// { reason, details? } where reason ∈ SPAM | ABUSE | HARASSMENT |
// MISINFORMATION | INAPPROPRIATE | OTHER and details is ≤1000 chars. 201 on
// success; 409 if the viewer already reported this issue. (Admin issue
// status/delete go through useAdminItemMutation, which calls patchJson /
// deleteJson directly; the comment-report helper lives in commentsApi.js.)
export function reportIssue(issueId, values) {
  return postJson(`/issues/${issueId}/report`, values, { requireAuth: true });
}

// Author soft-takedown of their own OPEN issue (POST /issues/{id}/withdraw,
// no body). Completes member My-issues CRUD (delete stays moderator-only).
export function withdrawIssue(issueId) {
  return postJson(`/issues/${issueId}/withdraw`, {}, { requireAuth: true });
}

// Issues the caller has voted on — full issue objects decorated with
// `voterRole` + `votedAt`, paginated ({ items, nextCursor }).
export function fetchMyIssueVotes(params = {}) {
  return getJson("/issues/me/votes", { params, requireAuth: true });
}

// Issues the caller has reported (authored) — same shape/filters as
// GET /issues but scoped to `reportedById = me`, default sort=createdAt.
// Paginated ({ items, nextCursor }). Powers the member "My issues" surface.
export function fetchMyReportedIssues(params = {}) {
  return getJson("/issues/me", { params, requireAuth: true });
}

// Public member profile (no auth). `idOrSlug` is a user id (UUID); the
// backend returns { id, name, username, avatar, city, bio, isVerified,
// createdAt, stats: { issuesReported, votesCast, eventsLed, eventsJoined } }.
export function fetchUserPublicProfile(idOrSlug) {
  return getJson(`/users/${idOrSlug}/profile`);
}

// Notifications (all authenticated).
//   fetchNotifications: params { unreadOnly?, limit?, cursor? } → cursor page
//     { items: [{ id, type, title, body, data:{targetType,targetId,slug},
//       readAt, createdAt }], unreadCount, nextCursor }.
//   fetchUnreadNotificationCount → { unreadCount }.
//   markNotificationRead(id) — idempotent single read.
//   markAllNotificationsRead — read everything.
//   updateNotificationPreferences({ sms, email, push }) — channel prefs.
// Consumer-side mapping onto the bell/inbox shape lives in notificationsApi.js.
export function fetchNotifications(params = {}) {
  return getJson("/notifications", { params, requireAuth: true });
}

export function fetchUnreadNotificationCount() {
  return getJson("/notifications/unread-count", { requireAuth: true });
}

export function markNotificationRead(id) {
  return patchJson(`/notifications/${id}/read`, {}, { requireAuth: true });
}

export function markAllNotificationsRead() {
  return postJson("/notifications/read-all", {}, { requireAuth: true });
}

export function updateNotificationPreferences(values) {
  return putJson("/notifications/preferences", values, { requireAuth: true });
}

// GET the saved channel prefs → { channels: { sms, email, push } }. Lets the
// toggles reflect persisted state instead of starting from defaults.
export function fetchNotificationPreferences() {
  return getJson("/notifications/preferences", { requireAuth: true });
}
