# Application

> A contribution application is the public-facing form an aspiring contributor submits at `/join` to offer their skills to the Shramdan platform — frontend / backend development, design, legal counsel, finance, community management, livestreaming, photography, translation, and so on. Applications are submitted anonymously (no login required); the admin team reviews each one inside the control center and either accepts the applicant into the appropriate working group or rejects with a note. Once accepted, the applicant becomes a member with the corresponding role attached. Applications are persistent records — they outlive their decision so the admin team has an audit trail of who applied, when, for what role, and why.

**Spec status:** `draft`
**Last updated:** 2026-06-05 (multi-step UI refactor — role enum collapses to three lanes)

---

## Fields

- **id** (`string`, required, public) — unique identifier, server-generated.
- **name** (`string`, required, public) — applicant's full name as entered on the form.
- **email** (`string`, required, public) — contact email. Used for the acceptance / rejection notice.
- **phone** (`string`, optional, public) — contact phone number. Free-form; locale-aware validation is intentionally light at this stage.
- **role** (`enum`, required, public) — **As of 2026-06-05 (later same day), the frontend no longer asks the applicant to choose a role.** The multi-step `/join` form drops the role-selection step entirely and submits every applicant as a generic Shramdan member with `role: "VOLUNTEER"` (the existing backend enum value that semantically maps to "Shramdan Member"). Lane assignment now happens organically: members are promoted into specific lanes (Event-Participation, Development, Company-Management — see `docs/product/roles.md`) as they participate in events and platform work. The full backend enum (`FRONTEND_DEVELOPER`, `BACKEND_DEVELOPER`, `UI_UX_DESIGNER`, `GRAPHICS_DESIGNER`, `LEGAL`, `FINANCE`, `DONOR`, `COMMUNITY_MANAGER`, `VOLUNTEER`, `OTHER`) should remain so admin-side promotion / manual role assignment continues to work; the public form simply no longer exposes the choice.
- **experience** (`string`, optional, public) — narrative description of the applicant's relevant background. Max 500 characters.
- **motivation** (`string`, required, public) — narrative answer to "why do you want to contribute". Max 500 characters.
- **additionalInfo** (`string`, optional, public) — availability, time commitment, other notes. Max 300 characters. The 2026-06-05 multi-step UI **removed this field from the form** to reduce friction and now sends the literal string `"n/a"` until backend marks the field optional or drops it. Treat any incoming `"n/a"` value as semantically empty.
- **resumeId** (`string`, optional, public) — UUID of a confirmed `Upload` record attached as the resume / CV document. Created through the public upload pipeline described in *Attachment upload mechanism* below. The spec target is the array form `resumeIds` (up to five entries); the array is pending backend work and the single-id field is what ships today.
- **portfolioId** (`string`, optional, public) — UUID of a confirmed `Upload` record attached as the portfolio document. Same multi-attachment caveat as `resumeId`. The contributor form currently surfaces this as a free-text URL field rather than the Dragger flow; converting it follows the array migration.
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
- `resumeId` (and, once the array form lands, each entry in `resumeIds` / `portfolioIds`) must reference an `Upload` record whose `status` is `CONFIRMED`, whose `userId` is null (created through the public presign path), and whose MIME passes the public-upload allowlist (`image/*` or `application/pdf` — see *Allowed file formats* below).
- The same `Upload` id may not appear in both `resumeId` and `portfolioId` (or, in the array form, in both arrays) on the same application.
- `status` transitions: `SUBMITTED` → `REVIEWING` → (`ACCEPTED` | `REJECTED`). `WITHDRAWN` may be reached from `SUBMITTED` or `REVIEWING` and is terminal. Backward transitions are rejected.
- `decidedAt` must be present whenever `status` is `ACCEPTED` or `REJECTED`, and must not be present otherwise.

---

## Operations

| Operation | Transport | RBAC | Description |
|-----------|-----------|------|-------------|
| Submit application | REST POST | Public | Anonymous submission from `/join`. Accepts the public field set including `resumeId` (and, when the array migration lands, `resumeIds` / `portfolioIds`). Honeypot-protected at the frontend; the backend may add per-IP rate limiting. |
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

The submission form is open to anonymous users (no authentication required to POST `/applications`). The original `Upload` pipeline (`POST /uploads/presign` → PUT → `POST /uploads/{id}/confirm`) is gated by `bearerAuth` and cannot be used from anonymous flows.

**Implemented (2026-06-05):** backend added a parallel public pair that mirrors the authenticated pipeline but accepts unauthenticated requests:

1. Frontend calls `POST /uploads/public/presign` with `{ filename, mimeType, size, metadata? }`. No `Authorization` header. The endpoint validates `mimeType` against an `image/*` + `application/pdf` allowlist server-side (client claims are not trusted as truth). Response shape mirrors the authed presign: `{ data: { upload: { id, ... }, presignedUrl, expiresIn } }`.
2. Frontend PUTs the file bytes directly to `presignedUrl` (Cloudflare R2). The presigned URL carries the MIME constraint; PUTs with a mismatching `Content-Type` are rejected by R2.
3. Frontend calls `POST /uploads/public/{id}/confirm` with no body and no `Authorization` header. The endpoint refuses to confirm uploads that have an owner (i.e. uploads that were initiated through the authed presign path), so anonymous and authenticated upload trails cannot cross. Response: `{ data: { downloadUrl, ... } }`.
4. Frontend includes the resulting `Upload` id in `resumeId` / `portfolioId` on the `POST /applications` body. Backend currently accepts one id per attachment kind — multi-attachment arrays are pending; see *Pending multi-attachment work* below.

The resulting `Upload` record is created with `userId = null` and stored privately. Anonymous rate limiting, magic-byte verification, EXIF strip, and `Content-Disposition: attachment` on downloads remain backend's responsibility — see *Defence-in-depth* below.

### Pending multi-attachment work

The original spec proposed `resumeIds` / `portfolioIds` arrays carrying up to five entries each. The 2026-06-05 backend implementation keeps the legacy single-value `resumeId` / `portfolioId` UUIDs. Multi-attachment support requires:

- Application schema: `resumeId` → `resumeIds: string[]`, `portfolioId` → `portfolioIds: string[]`, each capped at five entries.
- Validation: each id must reference a `CONFIRMED` `Upload` whose `userId` is null (created through the public presign path) and that is not already attached to another application.
- Admin read shape: expand both arrays into downloadable URLs for the reviewer.

Until that lands, the frontend uploads one resume per submission and includes its id as the legacy single `resumeId` field. Portfolio is currently a free-text URL on the form; converting it to the same Dragger flow waits on the array work.

---

## Allowed file formats

Anonymous uploads are restricted to a tight allowlist. The backend enforces this regardless of the client's claimed MIME — see *Defence-in-depth* below.

**Resume / portfolio (`resumeId`, `portfolioId`, and the future array fields):**

| MIME | Extension | Notes |
|---|---|---|
| `application/pdf` | `.pdf` | Industry-standard CV format. |
| `image/jpeg` | `.jpg`, `.jpeg` | Phone-shot resumes. |
| `image/png` | `.png` | Scanned resumes. |
| `image/webp` | `.webp` | Modern compressed images. |
| `image/gif` | `.gif` | Rare for resumes but accepted; the public presign endpoint allows the full `image/*` family. |

**Explicitly rejected:** `image/svg+xml`, `text/html`, `image/heic`, `image/heif`, all `.doc` / `.docx` and other Office formats, all archive types (`zip`, `7z`, `rar`, `tar`), all executables, all scripts. The `image/*` + `application/pdf` allowlist is enforced server-side at `POST /uploads/public/presign`; anything else returns 400. iOS HEIC: the form surfaces a clear "use JPEG or PNG" error message; iOS share-sheets convert to JPEG automatically when sharing from camera roll, so this rejection rarely bites users in practice.

**Per-file size cap:** 5 MB.
**Array cap (when arrays land):** at most five attachments per array (so up to ten attachments total per application).

**Note on Office formats.** An earlier draft of this spec included `.doc` / `.docx` under business pressure. The 2026-06-05 backend implementation deliberately excluded them — the macro / embedded-object risk in admin reviewers' browsers and download tools outweighs the friction of asking applicants to export to PDF. Re-adding `.docx` would require server-side macro stripping or conversion, and is not in scope.

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

- `2026-06-05` (multi-step UI refactor, revised same day) — `/join` rebuilt as a **four-step** centered flow (intro → basics → work → motivation). The role-selection step was first added then **removed**: the form no longer asks the applicant which lane they want to join. Every submission now ships `role: "VOLUNTEER"` (the existing backend enum entry for "Shramdan Member"); lane promotion happens organically as members participate in events. The phone field is now required. Step-1 intro restores the original hero card (image + eyebrow + body + stats + bullets) from the pre-refactor visual panel. Form values (name, email, phone, portfolio, experience, motivation) persist to localStorage with a 14-day TTL so refresh / accidental close doesn't wipe progress. `additionalInfo` is removed from the UI; submissions still send the literal `"n/a"` until backend marks it optional. Backend action items: (1) accept (or ignore) `"n/a"` in `additionalInfo`; (2) keep the existing full role enum so admin-side promotion / manual assignment continues to work — the public form just no longer exposes the choice.
- `2026-06-05` (later same day) — backend shipped `POST /uploads/public/presign` and `POST /uploads/public/{id}/confirm`. Spec rewritten to reflect this path (replacing the earlier Option A / Option B proposal), `.doc` / `.docx` removed from the allowlist (backend declined them on macro-risk grounds), and the multi-attachment array migration moved to *Pending multi-attachment work*. The `/join` page now ships a single-resume Dragger using the new public pipeline.
- `2026-06-05` — initial standalone spec, split out from the Applications sub-entity in [`members.md`](members.md). Proposed multi-attachment `resumeIds` and `portfolioIds` arrays (replacing the legacy single-id `resumeId` / `portfolioId` fields), the anonymous attachment-upload mechanism (Options A and B for the backend to choose between), the file-format allowlist with `.doc` / `.docx` inclusion, and the defence-in-depth requirements that gate the anonymous upload surface.
