const ANON_ONLY_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/join",
  "/feedback"
]);

const KNOWN_INTENTS = new Set([
  "vote",
  "comment",
  "join",
  "contribute",
  "nominate",
  "report",
  "expired"
]);

export function isSafeNextPath(path) {
  if (typeof path !== "string") return false;
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  return true;
}

function stripQueryAndHash(path) {
  const queryIdx = path.indexOf("?");
  const hashIdx = path.indexOf("#");
  const cutAt = [queryIdx, hashIdx].filter((i) => i >= 0).sort((a, b) => a - b)[0];
  return typeof cutAt === "number" ? path.slice(0, cutAt) : path;
}

function isAnonOnly(path) {
  const base = stripQueryAndHash(path);
  return ANON_ONLY_PATHS.has(base);
}

export function buildLoginHref(pathname, intent) {
  const params = new URLSearchParams();

  if (isSafeNextPath(pathname) && !isAnonOnly(pathname)) {
    params.set("next", pathname);
  }

  if (intent && KNOWN_INTENTS.has(intent)) {
    params.set("intent", intent);
  }

  const query = params.toString();
  return query ? `/login?${query}` : "/login";
}

export function isKnownIntent(value) {
  return typeof value === "string" && KNOWN_INTENTS.has(value);
}
