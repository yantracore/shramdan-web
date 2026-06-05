# Application

> A contribution application is the public-facing form an aspiring contributor submits at `/join` to offer their skills to the Shramdan platform — frontend / backend development, design, legal counsel, finance, community management, livestreaming, photography, translation, and so on. Applications are submitted anonymously (no login required); the admin team reviews each one inside the control center and either accepts the applicant into the appropriate working group or rejects with a note. Once accepted, the applicant becomes a member with the corresponding role attached. Applications are persistent records — they outlive their decision so the admin team has an audit trail of who applied, when, for what role, and why.

**Spec status:** `draft`
**Last updated:** 2026-06-05

---

## Fields

- **id** (`string`, required, public) — unique identifier, server-generated.
- **name** (`string`, required, public) — applicant's full name as entered on the form.
- **email** (`string`, required, public) — contact email. Used for the acceptance / rejection notice.
- **phone** (`string`, optional, public) — contact phone number. Free-form; locale-aware validation is intentionally light at this stage.
- **role** (`enum`, required, public) — the role being applied for. One of `FRONTEND_DEVELOPER`, `BACKEND_DEVELOPER`, `UI_UX_DESIGNER`, `GRAPHICS_DESIGNER`, `LEGAL`, `FINANCE`, `DONOR`, `COMMUNITY_MANAGER`, `VOLUNTEER`, `OTHER`. The enum is closed but extensible; the frontend's `siteContent.options.applicationRoles` should be considered the working list. Note: there is a known drift where the UI exposes some roles (`QA_ENGINEER`, `DEVOPS_ENGINEER`, `CONTENT_WRITER`, `TRANSLATOR`, `PHOTOGRAPHER`, `LIVESTREAMER`) that the backend enum does not yet include — backend should reconcile to the UI list as part of this domain's first hardening pass.
- **experience** (`string`, optional, public) — narrative description of the applicant's relevant background. Max 500 characters.
- **motivation** (`string`, required, public) — narrative answer to "why do you want to contribute". Max 500 characters.
- **additionalInfo** (`string`, optional, public) — availability, time commitment, other notes. Max 300 characters.
- **portfolioIds** (`array of string`, optional, public) — IDs of confirmed `Upload` records attached as portfolio documents. Each entry is a UUID returned by the upload pipeline (see *Attachment upload mechanism* below). Replaces the legacy single-value `portfolioId` field; see *Recent changes*.
- **resumeIds** (`array of string`, optional, public) — IDs of confirmed `Upload` records attached as resume / CV documents. Each entry is a UUID. Replaces the legacy single-value `resumeId` field; see *Recent changes*.
- **status** (`enum`, required, public) — one of `SUBMITTED`, `REVIEWING`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`. Default on creation: `SUBMITTED`.
- **submittedAt** (`datetime`, required, public) — ISO 8601 timestamp of submission.
- **decidedAt** (`datetime`, optional, public) — set when status transitions to `ACCEPTED` or `REJECTED`.
- **reviewerNote** (`string`, optional, public) — note from the reviewing admin, attached to the decision and shown back to the applicant in the acceptance / rejection email.
- **adminNotes** (`string`, optional, internal) — internal triage notes only visible inside the admin control center. Never returned in public reads.

---

## Validation rules

- `email` must be RFC-5322-shaped. The backend does not need to verify deliverability synchronously.
- `motivation` must be present and non-empty (after trimming whitespace).
- `role` must be one of the supported enum values; unknown roles are rejected with a 400.
- `resumeIds` and `portfolioIds` may each carry at most **five** entries. Each id must reference an `Upload` record whose `status` is `CONFIRMED` and whose `fileType` is `DOCUMENT` or `IMAGE` (see *Allowed file formats* below for the MIME filter the upload layer enforces).
- The same `Upload` id may not appear in both `resumeIds` and `portfolioIds` on the same application.
- `status` transitions: `SUBMITTED` → `REVIEWING` → (`ACCEPTED` | `REJECTED`). `WITHDRAWN` may be reached from `SUBMITTED` or `REVIEWING` and is terminal. Backward transitions are rejected.
- `decidedAt` must be present whenever `status` is `ACCEPTED` or `REJECTED`, and must not be present otherwise.

---

## Operations

| Operation | Transport | RBAC | Description |
|-----------|-----------|------|-------------|
| Submit application | REST POST | Public | Anonymous submission from `/join`. Accepts the public field set including `resumeIds` and `portfolioIds`. Honeypot-protected at the frontend; the backend may add per-IP rate limiting. |
| List applications | REST GET | Admin | Paginated list with filters described below. Used by the admin control center. |
| Get application by id | REST GET | Admin | Returns a single application with attachment `Upload` records expanded into downloadable URLs. |
| Update application status | REST PATCH | Admin | Transitions the application along the state machine. Accepts `{ status, reviewerNote }`. Sends the acceptance / rejection notice when reaching a terminal state. |
| Update admin notes | REST PATCH | Admin | Updates the internal `adminNotes` field. Does not transition status. |
| Withdraw application | REST POST | Public, scoped by submission-token | The applicant may withdraw their own application by following a one-time link emailed at submission. The token authorizes a single `WITHDRAWN` transition without requiring a full account. Optional for MVP; if deferred, document the deferral here. |
| Delete application | REST DELETE | Admin | Soft delete. Used for spam triage. |

---

## Filters (for List operations)

- **status** (`enum` or array of enums) — restrict to one or more lifecycle states. The control center's "needs review" view filters to `SUBMITTED` and `REVIEWING`.
- **role** (`enum` or array) — restrict to one or more applied-for roles.
- **search** (`string`) — case-insensitive substring match against `name`, `email`, and `motivation`.
- **submittedAfter** / **submittedBefore** (`datetime`) — date-range scoping.
- Pagination: cursor-based, `limit` defaults to twenty, response carries `nextCursor`.

---

## Relationships

- An application is submitted by an applicant who does not yet have a member record. On `ACCEPTED`, the backend creates the matching member record (or links to an existing one if the email already maps to a registered member) and attaches the `role` to that member.
- An application carries zero or more `Upload` references through `resumeIds` and `portfolioIds`. The `Upload` records are owned by the application after submission; admin access to those uploads is gated by the same RBAC that gates the application.
- The applications surface overlaps with the Applications sub-entity referenced in [`members.md`](members.md). The member-portal's "My applications" view reads the same underlying records but is scoped by the authenticated member's email. The fields exposed in the member portal are a subset of the public fields above (no `adminNotes`, no internal flags).

---

## State machine

```
SUBMITTED  → REVIEWING   (trigger: Admin opens the application; idempotent)
SUBMITTED  → WITHDRAWN   (trigger: Applicant via submission-token link)
REVIEWING  → ACCEPTED    (trigger: Admin; requires reviewerNote optional)
REVIEWING  → REJECTED    (trigger: Admin; requires reviewerNote optional but recommended)
REVIEWING  → WITHDRAWN   (trigger: Applicant via submission-token link)
ACCEPTED   → (terminal — creates / updates member record)
REJECTED   → (terminal)
WITHDRAWN  → (terminal)
```

---

## Attachment upload mechanism

The submission form is open to anonymous users (no authentication required to POST `/applications`). The current `Upload` pipeline — `POST /uploads/presign` followed by direct PUT to R2 and `POST /uploads/{id}/confirm` — is gated by `bearerAuth`. This mismatch must be resolved before resume / portfolio file uploads can ship from the `/join` page.

Two acceptable approaches; backend picks one and the frontend implements against the chosen surface.

### Option A — anonymous mode on the existing pipeline

Extend `POST /uploads/presign` to accept an unauthenticated mode when the request includes a server-issued **submission token**:

1. Frontend calls `POST /applications/submission-token` with no body. The endpoint is anonymous and rate-limited per IP (suggested: 10 tokens per IP per hour). Response: `{ submissionToken: string, expiresAt: datetime }`. The token's TTL is short (e.g. 30 minutes) and it carries an internal claim restricting it to the application-submission scope.
2. Frontend calls `POST /uploads/presign` with `Authorization: SubmissionToken <token>` (or an equivalent header that the backend can distinguish from `bearerAuth`). The presign endpoint accepts this header for `fileType` values `DOCUMENT` and `IMAGE` only, and only when `isPublic` is `false`. It refuses `VIDEO`, `AUDIO`, `ARCHIVE`, `OTHER`.
3. The resulting `Upload` record is created in a temporary state owned by the submission token, not by any member. The presigned PUT proceeds normally.
4. Frontend calls `POST /uploads/{id}/confirm` with the same submission-token header. The `Upload` transitions to `CONFIRMED` but remains owned by the token, not by a member.
5. Frontend includes the resulting `Upload` ids in the `resumeIds` / `portfolioIds` arrays on the `POST /applications` body. The application creation handler verifies that every referenced `Upload` is owned by the same submission token that the frontend can prove via a final header on the application POST itself.
6. Uploads orphaned (not bound to an application within the token TTL) are garbage-collected on a daily sweep.

### Option B — dedicated application-upload endpoint

Add a single anonymous endpoint that handles the entire upload in one call, scoped to application attachments:

- `POST /applications/uploads` — multipart form upload, anonymous, per-IP rate-limited (suggested: 10 uploads per IP per hour). Accepts a single file per request. Validates MIME and size server-side (no client trust) and returns `{ uploadId, downloadUrl, expiresAt }`. The `uploadId` is then included in the application body's `resumeIds` or `portfolioIds`.
- This option avoids touching `/uploads/presign` and is simpler to reason about, at the cost of routing the file bytes through the API server instead of directly to R2. For resume- and screenshot-scale files (under 10 MB each) the throughput is acceptable.

Backend's pick is captured in *Recent changes* once decided.

---

## Allowed file formats

Anonymous uploads are restricted to a tight allowlist. The backend enforces this regardless of the client's claimed MIME — see *Defence-in-depth* below.

**Resume / portfolio (`resumeIds`, `portfolioIds`):**

| MIME | Extension | Notes |
|---|---|---|
| `application/pdf` | `.pdf` | Industry-standard CV format. |
| `image/jpeg` | `.jpg`, `.jpeg` | Phone-shot resumes. |
| `image/png` | `.png` | Scanned resumes. |
| `image/webp` | `.webp` | Modern compressed images. |
| `application/msword` | `.doc` | Accepted under business pressure. See *Defence-in-depth* — admin reviewers must open with macros disabled. |
| `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | `.docx` | Same caveat as `.doc`. |

**Explicitly rejected** for resume / portfolio uploads (these are listed so the rejection is visible in the spec, not silent): `image/svg+xml`, `text/html`, `image/heic`, `image/heif`, all archive types (`zip`, `7z`, `rar`, `tar`), all executables, all scripts. iOS HEIC: the form surfaces a clear "use JPEG or PNG" error message; iOS share-sheets convert to JPEG automatically when sharing from camera roll, so this rejection rarely bites users in practice.

**Per-file size cap:** 5 MB.
**Array cap:** at most five attachments per array (so up to ten attachments total per application).

---

## Defence-in-depth (mandatory backend behaviours)

The anonymous upload surface is the highest-trust-stretch in the public API. The following are not optional.

1. **Magic-byte verification.** After the PUT completes, the upload pipeline reads the first bytes of the stored object and verifies they match the file-format signature for the claimed MIME. Mismatches mark the `Upload` as `REJECTED` and never expose a download URL. Client-supplied MIME is treated as a hint, never as truth.
2. **Server-rewritten filename.** The original filename is preserved as metadata, but the storage key is rewritten to `{uploadId}.{validatedExtension}`. Path-traversal and unicode tricks in the original filename never reach the bucket.
3. **`Content-Disposition: attachment`** on the served `downloadUrl` for all anonymously-uploaded objects. This prevents PDFs and HTML-shaped surprises from rendering inline in the admin's browser; the reviewer must download to open. The MIME on the download response is set from the verified format, not from what the client claimed.
4. **EXIF strip.** On `confirm`, the upload pipeline strips EXIF from JPEG and HEIF inputs. Phone photos commonly carry GPS coordinates and device identifiers; these must not leak into the admin surface.
5. **Per-IP rate limiting.**
    - Submission-token endpoint (Option A): 10 per IP per hour.
    - Anonymous presign or `/applications/uploads` (Option B): 10 per IP per hour.
    - `POST /applications`: 3 per IP per hour.
6. **Origin / Referer check.** Anonymous upload endpoints check the `Origin` header against the configured public-site allowlist (`https://shramdan.org`, staging, and explicit dev hostnames). Reject mismatches.
7. **`.doc` / `.docx` handling.** These formats are accepted under the format allowlist above but flagged in the admin UI as "open with macros disabled". The backend does not need to scan macros; it must not auto-execute or auto-render the file at any layer.
8. **(Defer-able) AV scan.** A ClamAV (or equivalent) pass before the `Upload` becomes downloadable is desirable but not blocking for MVP. If deferred, mark the deferral in *Recent changes* and surface the risk on the admin review screen.

---

## Future-proofing notes

- A future surface may want to attach a cover letter or other free-form documents. The `attachments` model can be generalized — consider a single `attachmentIds` array on the application with a per-record `kind` field on the `Upload` (`RESUME`, `PORTFOLIO`, `COVER_LETTER`, `OTHER`) rather than splitting attachments across multiple typed arrays. The current `resumeIds` / `portfolioIds` split is the MVP shape; the generalization is a v2 concern.
- The role enum will need reconciliation between the frontend's `applicationRoles` list and the backend's current enum. The reconciliation is a small migration; flagged here so it does not get lost.
- Submission-token-based withdrawal (the `Withdraw` operation) is optional for MVP. If deferred, applicants currently have no self-service exit; admin removal is the only path.

---

## Recent changes

- `2026-06-05` — initial standalone spec, split out from the Applications sub-entity in [`members.md`](members.md). Introduces multi-attachment `resumeIds` and `portfolioIds` arrays (replacing the legacy single-id `resumeId` / `portfolioId` fields), the anonymous attachment-upload mechanism (Options A and B for the backend to choose between), the file-format allowlist with `.doc` / `.docx` inclusion, and the defence-in-depth requirements that gate the anonymous upload surface.
