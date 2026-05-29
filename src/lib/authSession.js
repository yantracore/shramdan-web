const AUTH_SESSION_STORAGE_KEY = "shramdan.auth.session";

export const AUTH_SESSION_EVENT = "shramdan-auth-session-change";
export const AUTH_SESSION_EXPIRED_EVENT = "shramdan-auth-session-expired";

let cachedRawSession = null;
let cachedSession = null;

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function emitSessionChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
  }
}

function normalizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    username: user.username ?? null,
    avatar: user.avatar ?? null,
    role: user.role,
    isVerified: Boolean(user.isVerified)
  };
}

export function getAuthSession() {
  if (!canUseStorage()) {
    return null;
  }

  const rawSession = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);

  if (!rawSession) {
    cachedRawSession = null;
    cachedSession = null;
    return null;
  }

  if (rawSession === cachedRawSession) {
    return cachedSession;
  }

  try {
    const session = JSON.parse(rawSession);

    if (!session?.accessToken || !session?.user?.email || !session?.user?.role) {
      cachedRawSession = null;
      cachedSession = null;
      return null;
    }

    cachedRawSession = rawSession;
    cachedSession = {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken ?? null,
      user: normalizeUser(session.user)
    };

    return cachedSession;
  } catch {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    cachedRawSession = null;
    cachedSession = null;
    return null;
  }
}

export function setAuthSession(session) {
  if (!canUseStorage()) {
    return null;
  }

  const previous = getAuthSession();
  const nextSession = {
    accessToken: session.accessToken,
    refreshToken:
      session.refreshToken !== undefined ? session.refreshToken : previous?.refreshToken ?? null,
    user: normalizeUser(session.user)
  };

  window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(nextSession));
  cachedRawSession = JSON.stringify(nextSession);
  cachedSession = nextSession;
  emitSessionChange();

  return nextSession;
}

export function clearAuthSession() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  cachedRawSession = null;
  cachedSession = null;
  emitSessionChange();
}

export function expireAuthSession() {
  clearAuthSession();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
  }
}

export function subscribeAuthSession(callback) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(AUTH_SESSION_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(AUTH_SESSION_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function subscribeAuthSessionExpired(callback) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, callback);

  return () => {
    window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, callback);
  };
}

export function getStoredAccessToken() {
  return getAuthSession()?.accessToken ?? null;
}

export function getStoredRefreshToken() {
  return getAuthSession()?.refreshToken ?? null;
}

export function getStoredUser() {
  return getAuthSession()?.user ?? null;
}

export function isAdminUser(user = getStoredUser()) {
  return user?.role === "ADMIN";
}
