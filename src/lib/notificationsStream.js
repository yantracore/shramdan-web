// Server-Sent-Events client for the live notifications channel.
//
// The backend authenticates the stream with a `?token=<jwt>` query param
// (its reference snippet uses `new EventSource('/notifications/stream?token=')`).
// We use `fetch` + a manual `text/event-stream` parser rather than the native
// `EventSource` for one reason: this app rotates its access token, and a native
// EventSource pins the original URL — so after a token refresh its automatic
// reconnect would keep retrying with a dead token and stay broken. Driving the
// connection ourselves lets us read a fresh token on every reconnect. We send
// only the query param + an `Accept` header (both CORS-safelisted), so there's
// no preflight — same as the EventSource path.
//
// The server emits four named events (see the backend SSE guide):
//   notification.snapshot   — once on connect; { unreadCount }
//   notification.created    — a new notification; { notification }
//   notification.read       — one marked read elsewhere; { id, unreadCount }
//   notification.read_all   — all marked read; { unreadCount }
// Each `data:` line also carries a `type` field that mirrors the event name,
// so consumers can switch on either.

import { API_BASE_URL } from "@/lib/apiClient";

// Path of the SSE endpoint under the API base. Overridable so we can point it
// at whatever the backend ships without a code change — see the note in the
// notifications provider. Default follows the REST naming convention
// (`/notifications/...`).
const SSE_PATH =
  process.env.NEXT_PUBLIC_NOTIFICATIONS_SSE_PATH || "/notifications/stream";

const MAX_BACKOFF_MS = 30_000;

function backoffDelay(attempt) {
  const base = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** Math.min(attempt, 5));
  // A little jitter so reconnecting clients don't thunder together.
  return base + Math.floor(Math.random() * 400);
}

function sleep(ms, signal) {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    if (signal) {
      signal.addEventListener(
        "abort",
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true }
      );
    }
  });
}

// Parse one SSE record ("event: x\ndata: {...}") into { event, data }.
// `data` is JSON-parsed when possible; comment lines (": keepalive") are
// ignored. Returns null for records with no data payload.
function parseEventBlock(block) {
  let event = "message";
  const dataLines = [];

  for (const line of block.split("\n")) {
    if (!line || line.startsWith(":")) continue;
    const sep = line.indexOf(":");
    const field = sep === -1 ? line : line.slice(0, sep);
    let value = sep === -1 ? "" : line.slice(sep + 1);
    if (value.startsWith(" ")) value = value.slice(1);

    if (field === "event") event = value;
    else if (field === "data") dataLines.push(value);
  }

  if (dataLines.length === 0) return null;

  const raw = dataLines.join("\n");
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    data = raw;
  }
  return { event, data };
}

// One connect → read → close cycle. Resolves when the server ends the stream
// (so the caller can reconnect); throws on a failed connect or a read error.
// A thrown error tagged `permanent` means "don't bother retrying".
async function streamOnce(token, signal, onEvent, onOpen) {
  const url = `${API_BASE_URL}${SSE_PATH}?token=${encodeURIComponent(token)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "text/event-stream" },
    cache: "no-store",
    signal
  });

  if (!response.ok || !response.body) {
    const error = new Error(`Notifications stream failed: ${response.status}`);
    // 404/405 mean the endpoint isn't deployed (yet) — retrying won't help.
    error.permanent = response.status === 404 || response.status === 405;
    throw error;
  }

  onOpen?.();

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder
      .decode(value, { stream: true })
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");

    let boundary;
    while ((boundary = buffer.indexOf("\n\n")) !== -1) {
      const block = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const parsed = parseEventBlock(block);
      if (parsed) onEvent(parsed);
    }
  }
}

// Open the notifications stream and keep it alive across transient drops.
//
//   getToken()  — returns the current access token (read fresh on every
//                 reconnect, so a refreshed token heals a 401 automatically).
//   onEvent({ event, data })  — one parsed SSE record.
//   onStatus("connecting" | "open" | "reconnecting" | "idle")
//
// Returns a `close()` function that aborts the connection and stops retrying.
export function openNotificationsStream({ getToken, onEvent, onStatus }) {
  if (typeof window === "undefined" || typeof fetch === "undefined") {
    return () => {};
  }

  const controller = new AbortController();
  let closed = false;
  let attempt = 0;

  async function loop() {
    while (!closed) {
      const token = typeof getToken === "function" ? getToken() : null;
      if (!token) {
        onStatus?.("idle");
        return;
      }

      onStatus?.(attempt === 0 ? "connecting" : "reconnecting");

      try {
        await streamOnce(token, controller.signal, onEvent, () => {
          attempt = 0;
          onStatus?.("open");
        });
        // Clean end (server closed) — fall through to reconnect.
      } catch (error) {
        if (closed || controller.signal.aborted) return;
        if (error?.permanent) {
          onStatus?.("idle");
          return;
        }
        // Otherwise: transient — back off and retry below.
      }

      if (closed) return;
      attempt += 1;
      onStatus?.("reconnecting");
      await sleep(backoffDelay(attempt), controller.signal);
    }
  }

  loop();

  return () => {
    closed = true;
    controller.abort();
  };
}
