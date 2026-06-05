# Feedback

> A feedback record is the public-facing message any visitor can submit through the `/feedback` form — a bug report, a suggestion, a question, or a general comment. Feedback is submitted anonymously (no login required); the admin team triages each entry inside the control center, optionally replying via email and transitioning the record through a lightweight workflow. Bug-report entries in particular benefit from visual evidence — screenshots and short PDF repros — which must be uploaded as actual files rather than as URLs (asking ordinary visitors to host their own screenshots and paste a link is unrealistic).

**Spec status:** `draft`
**Last updated:** 2026-06-05

---

## Fields

- **id** (`string`, required, public) — unique identifier, server-generated.
- **name** (`string`, required, public) — submitter's name as entered.
- **email** (`string`, required, public) — contact email used for the optional admin reply.
- **type** (`enum`, required, public) — one of `SUGGESTION`, `BUG_REPORT`, `QUESTION`, `GENERAL`.
- **experienceRating** (`integer`, optional, public) — 1 through 5 inclusive. Used when the submitter is rating their overall experience; primarily attached to `GENERAL` and `SUGGESTION` entries.
- **message** (`string`, required, public) — the body of the feedback. No fixed length cap, but the frontend currently soft-limits at 1000 characters.
- **screenshotIds** (`array of string`, optional, public) — IDs of confirmed `Upload` records attached as supporting evidence. Each entry is a UUID returned by the upload pipeline (see *Attachment upload mechanism* below). Replaces the legacy single-value `screenshot` URL field; see *Recent changes*.
- **status** (`enum`, required, public) — one of `OPEN`, `IN_PROGRESS`, `RESOLVED`, `DISMISSED`. Default on creation: `OPEN`.
- **submittedAt** (`datetime`, required, public) — ISO 8601 timestamp.
- **resolvedAt** (`datetime`, optional, public) — set when status transitions to `RESOLVED` or `DISMISSED`.
- **reply** (`object`, optional, public) — `{ message: string, sentAt: datetime, sentBy: adminId }`. Set when the admin team replies via the dedicated endpoint. The reply text is also delivered to the submitter's email; storing it here preserves the audit trail.
- **adminNotes** (`string`, optional, internal) — internal triage notes only visible inside the admin control center.

---

## Validation rules

- `email` must be RFC-5322-shaped.
- `message` must be non-empty after trimming whitespace.
- `type` must be one of the supported enum values.
- `experienceRating`, when present, is an integer between 1 and 5 inclusive.
- `screenshotIds` may carry at most **five** entries. Each id must reference an `Upload` whose `status` is `CONFIRMED` and whose `fileType` is `IMAGE` or `DOCUMENT` (see *Allowed file formats* below).
- `status` transitions: `OPEN` → `IN_PROGRESS` → (`RESOLVED` | `DISMISSED`). Backward transitions are rejected. `OPEN` → `DISMISSED` is allowed as a triage fast-path for spam.
- `resolvedAt` must be present whenever `status` is `RESOLVED` or `DISMISSED`, and must not be present otherwise.

---

## Operations

| Operation | Transport | RBAC | Description |
|-----------|-----------|------|-------------|
| Submit feedback | REST POST | Public | Anonymous submission from `/feedback`. Accepts the public field set including `screenshotIds`. Honeypot-protected at the frontend; backend may add per-IP rate limiting. |
| List feedback | REST GET | Admin | Paginated list with filters described below. Used by the admin control center's feedback queue. |
| Get feedback by id | REST GET | Admin | Returns a single feedback record with `screenshotIds` expanded into downloadable URLs. |
| Update feedback status | REST PATCH | Admin | Transitions along the state machine. Accepts `{ status }`. |
| Reply to feedback | REST PATCH | Admin | Records an admin reply and emails the submitter. Accepts `{ message }`. Sets the `reply` object and transitions status to at least `IN_PROGRESS` if still `OPEN`. |
| Delete feedback | REST DELETE | Admin | Soft delete. Used for spam triage. |

---

## Filters (for List operations)

- **type** (`enum` or array) — restrict to one or more feedback types. The admin queue typically defaults to all types.
- **status** (`enum` or array) — restrict to one or more lifecycle states.
- **search** (`string`) — case-insensitive substring match against `name`, `email`, and `message`.
- **submittedAfter** / **submittedBefore** (`datetime`) — date-range scoping.
- Pagination: cursor-based, `limit` defaults to twenty, response carries `nextCursor`.

---

## Relationships

- A feedback record stands alone; it does not link to a member account (the submitter may or may not have one). If the submitter's email maps to a known member, the admin UI surfaces that link informally — but the record itself does not foreign-key to a member.
- A feedback record carries zero or more `Upload` references through `screenshotIds`. The `Upload` records are owned by the feedback record after submission; admin access to those uploads is gated by the same RBAC that gates the feedback.

---

## State machine

```
OPEN          → IN_PROGRESS  (trigger: Admin picks up the record; idempotent)
OPEN          → DISMISSED    (trigger: Admin; spam triage)
IN_PROGRESS   → RESOLVED     (trigger: Admin; typically following a reply)
IN_PROGRESS   → DISMISSED    (trigger: Admin)
RESOLVED      → (terminal)
DISMISSED     → (terminal)
```

---

## Attachment upload mechanism

The feedback form is open to anonymous users (no authentication required to POST `/feedback`). Like the contributor-application form, file uploads from this surface cannot ride the existing `bearerAuth`-gated `Upload` pipeline as-is.

The mechanism — submission-token-scoped anonymous uploads, or a dedicated anonymous endpoint — is shared with the contributor-application surface and is fully described in [`applications.md` → *Attachment upload mechanism*](applications.md#attachment-upload-mechanism). Backend's chosen approach (Option A or Option B in that document) applies uniformly to both surfaces; the only per-surface differences are the destination array field name (`screenshotIds` here vs. `resumeIds` / `portfolioIds` there) and the file-format allowlist below.

The token / endpoint scope must distinguish "this upload is destined for a feedback record" from "this upload is destined for an application", so that submission tokens issued for one surface cannot attach uploads to records on the other.

---

## Allowed file formats

Anonymous uploads are restricted to a tight allowlist. The backend enforces this regardless of the client's claimed MIME — see *Defence-in-depth* in [`applications.md`](applications.md#defence-in-depth-mandatory-backend-behaviours); the same rules apply here.

**Screenshot (`screenshotIds`):**

| MIME | Extension | Notes |
|---|---|---|
| `image/png` | `.png` | Standard screenshot format. |
| `image/jpeg` | `.jpg`, `.jpeg` | Standard. |
| `image/webp` | `.webp` | Modern compressed. |
| `image/gif` | `.gif` | Animated bug repro. |
| `application/pdf` | `.pdf` | Multi-page exported repro (browser print-to-PDF). |

**Explicitly rejected:** `image/svg+xml` (XSS vector via embedded scripts), `text/html`, `image/heic`, `image/heif`, all `.doc` / `.docx` (not useful for screenshots), all archives, all executables, all scripts.

**Per-file size cap:** 5 MB.
**Array cap:** at most five attachments per feedback record.

---

## Future-proofing notes

- A future enrichment may want to capture browser / device metadata server-side (User-Agent, viewport size, the URL the submitter was on when they opened the form). This is optional and out of MVP scope; if added, store it as an `environmentSnapshot` object and treat as `internal` (admin-only).
- The "admin reply" flow currently emits a single email. A future surface may move to a threaded conversation where the submitter can reply back; that would require either an authenticated submitter or a submission-token-based reply link, similar to the application withdrawal flow described in [`applications.md`](applications.md).
- Spam filtering: per-IP rate limiting and the honeypot field are the MVP defences. A future Bayesian or vendor-provided classifier could attach a `spamScore` field to each record.

---

## Recent changes

- `2026-06-05` — initial spec. Introduces the multi-attachment `screenshotIds` array (replacing the legacy single `screenshot` URL field), references the shared anonymous-upload mechanism documented in [`applications.md`](applications.md), and defines the screenshot file-format allowlist with `application/pdf` included for multi-step bug repros.
