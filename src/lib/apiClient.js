import {
  clearAuthSession,
  expireAuthSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  setAuthSession
} from "@/lib/authSession";

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
  const response = await fetch(url, {
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

  const response = await fetch(createApiUrl(path, params), {
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

export function deleteJson(path, options) {
  return apiRequest(path, { ...options, method: "DELETE" });
}

export function loginWithPassword(credentials) {
  return postJson("/auth/login", credentials);
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

export function voteOnIssue(issueId, voterRole = "INTERESTED") {
  return postJson(`/issues/${issueId}/vote`, { voterRole }, { requireAuth: true });
}
