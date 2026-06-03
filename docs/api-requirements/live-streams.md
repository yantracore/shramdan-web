# Live Stream

> A live stream is the real-time broadcast attached to an event during its `ACTIVE` phase, run by a member acting as Livestreamer Shramdan. The stream is the surface through which people who cannot attend in person can still witness the event as it happens. The live-stream record holds the embed URL, the thumbnail, the start time, the current viewer count, and metadata enough for the event detail page and the home page's live rail to render an autoplaying preview. A live stream is owned by exactly one event and is terminated when the event completes; archived video, if any, is captured by a separate post-event media record rather than by this resource.

**Spec status:** `draft`
**Last updated:** 2026-06-03

---

## Fields

- **id** (`string`, required, public) — unique identifier, server-generated.
- **eventId** (`string`, required, public) — the event this stream belongs to. Unique: an event may have at most one live stream at a time.
- **isActive** (`boolean`, required, public) — true while the stream is on air. Flips to false when the stream ends; the record remains for archival but consumers should treat the stream as past.
- **startedAt** (`datetime`, required, public) — ISO 8601 timestamp when the stream went live.
- **endedAt** (`datetime`, optional, public) — when the stream ended. Null while `isActive` is true.
- **streamUrl** (`string`, required, public) — the playable URL. May point to an HLS manifest, a YouTube embed URL, an MP4 (for demo and fallback content), or any other format the player can consume. Consumers should inspect the URL extension to decide which player implementation to mount.
- **previewEmbedUrl** (`string`, optional, public) — the embed URL used for muted, autoplaying previews in card-sized surfaces (home page live rail, events index split view). Typically identical to `streamUrl` for native video, or a parameter-tweaked variant for embed players.
- **thumbnailUrl** (`string`, optional, public) — the still image used as a poster before the player initializes and as a card thumbnail in lists.
- **viewerCount** (`number`, required, public) — current concurrent viewers. Updated by the backend at a regular interval and pushed to subscribed clients via SSE.
- **provider** (`enum`, optional, public) — one of `youtube`, `native`, `rtmp`, `hls`. Hints to the client which player to use. May be omitted; clients may derive it from `streamUrl`.
- **videoSlug** (`string`, optional, public) — for native demo content, a slug pointing into the local demo video directory. Production streams may omit this.
- **livestreamerId** (`string`, optional, public) — the member acting as Livestreamer Shramdan for this stream. References a participation record on the event with `role = LIVESTREAMER`.
- **isMock** (`boolean`, optional, internal) — flag indicating this is a mock stream injected for demo purposes. Always absent or false in production responses.

---

## Validation rules

- An event may have at most one `isActive = true` live stream at any time. Starting a new stream while an existing one is active should either reject with a clear error or terminate the existing stream first; the choice is a product decision.
- `endedAt` must be present whenever `isActive` is false, and absent whenever `isActive` is true.
- `streamUrl` must be a fully qualified URL.
- `startedAt` cannot be in the future when the stream is created.
- `viewerCount` cannot be negative.
- A stream cannot be started before its event transitions to `ACTIVE`. Backend should reject the start request and surface a clear error if the event is still `SCHEDULED`.

---

## Operations

| Operation | Transport | RBAC | Description |
|-----------|-----------|------|-------------|
| Get the live stream for an event | REST GET | Public | Returns the current live stream (active or recently ended). Null if no stream has ever been started for this event. |
| List active live streams | REST GET | Public | Returns all events currently streaming. Used by the home page live rail. |
| Start a stream | REST POST | EventLeader or the assigned LIVESTREAMER participant, or Admin | Creates the live-stream record with `isActive = true`. Accepts `streamUrl`, `previewEmbedUrl`, `thumbnailUrl`, and `provider`. |
| Update stream metadata | REST PATCH | EventLeader, the LIVESTREAMER participant, or Admin | Updates `streamUrl`, `previewEmbedUrl`, `thumbnailUrl`. Used when the broadcaster has to switch sources mid-stream. |
| End a stream | REST POST | EventLeader, the LIVESTREAMER participant, or Admin | Sets `isActive = false` and stamps `endedAt`. Once ended, the record is read-only. |
| Stream viewer-count updates | SSE | Public | Pushes `viewerCount` deltas to all subscribed clients. Push frequency should be once every five to ten seconds while the stream is active; less often for streams with very high concurrent viewers to avoid update storms. |
| Stream reaction updates | SSE | Public | Optional. Pushes ambient reactions (heart-tap style) for the live audience. May be multiplexed with comments and viewer-count on the same SSE connection. |

---

## Filters (for List operations)

- **provider** (`enum`) — filter active streams by provider.
- Pagination is rarely needed for active-streams lists since the concurrent set is small; if pagination is exposed, default `limit` is twenty.

---

## Relationships

- A live stream belongs to exactly one event. The event is the only entity that owns the stream; deleting an event implies cancelling and archiving the stream.
- A live stream is run by exactly one Livestreamer Shramdan, referenced via `livestreamerId` and corresponding to a `LIVESTREAMER` participation on the event.
- Comments on the event during a live stream are part of the chat-like real-time experience; see `comments.md` for the comment shape and SSE behavior. The live stream itself does not own the comments; both are owned by the parent event.
- A reaction during a live stream is a transient signal; it is not persisted as a comment-reaction record. Future product decisions may change this.

---

## Computed fields

- **durationMinutes** — for ended streams, `endedAt - startedAt` in minutes. Computed on read.
- **isPrerecorded** — true if the stream URL points to a native MP4 demo file or other prerecorded source. Computed by inspecting the URL.
- **playerKind** — one of `native`, `youtube`, `hls`. Computed from the URL extension or the `provider` field for client convenience.

---

## State machine

```
(none)    → ACTIVE   (start operation; isActive = true)
ACTIVE    → ENDED    (end operation; isActive = false, endedAt stamped)
ACTIVE    → ENDED    (system, on event completion; isActive is forced to false)
ENDED     → (terminal)
```

A stream cannot be restarted once ended. A subsequent broadcast for the same event creates a new stream record. The event detail page may display only the most recent stream, or may surface a history; the choice is a product decision.

---

## Real-time considerations

Live streams are the most latency-sensitive resource in the system. Two distinct transport patterns apply:

- **The stream itself** is delivered through the player's native protocol (HLS, YouTube embed, MP4 progressive download). The backend does not proxy stream bytes; it only stores the URL.
- **Metadata about the stream** (viewer count, reactions, comment stream) is delivered through SSE. A single SSE connection per viewer per event is the recommended shape, multiplexing viewer-count, reactions, and new comments on one channel.

Clients should subscribe to the SSE channel when the event detail page mounts and the stream is active. They should unsubscribe on unmount or when `isActive` becomes false.

---

## Future-proofing notes

- `archivedRecordingUrl` field — for VOD playback of the completed stream. Out of scope for MVP; tracked under impact-story media (Phase 7) instead.
- `chatModerationFlags` — for taking the comment stream down without ending the live broadcast. Out of scope for MVP.
- Multi-source streaming (multiple livestreamers covering different angles) — out of scope. The current model is one stream per event.
- Captions or live transcription — out of scope.

---

## Recent changes

- `2026-06-03` — initial spec draft. Captures the live-stream shape currently exercised by the home page live rail, the events split view, and the event detail player. Documents the SSE recommendation for viewer-count and chat behavior; flags the multi-format stream URL convention (native MP4 for demos, YouTube embed for production).
