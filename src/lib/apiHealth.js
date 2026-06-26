// Backend reachability signal — a tiny in-memory singleton. apiClient reports
// up/down here on every request; ApiHealthWatcher subscribes and shows a banner.
// Per-tab, no localStorage: a reload with a live backend starts clean at "up".

export const API_HEALTH_EVENT = "shramdan-api-health";

// One frozen "up" object so useSyncExternalStore sees a stable reference.
const UP = Object.freeze({ status: "up", reason: null });

let current = UP;

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(API_HEALTH_EVENT));
  }
}

export function getApiHealth() {
  return current;
}

export function reportApiDown(reason = "unreachable") {
  if (current.status === "down" && current.reason === reason) {
    return; // no change — don't spam events on a burst of failures
  }
  current = Object.freeze({ status: "down", reason });
  emit();
}

export function reportApiUp() {
  if (current.status === "up") {
    return; // already up — idempotent
  }
  current = UP;
  emit();
}

export function subscribeApiHealth(callback) {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener(API_HEALTH_EVENT, callback);
  return () => window.removeEventListener(API_HEALTH_EVENT, callback);
}
