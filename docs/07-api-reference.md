# Shramdaan — Frontend API Reference

Source-of-truth implementation docs for the frontend. Generated from the Express
routes, Zod schemas, services, and Prisma models in this repo. Use this when
prompting an AI to build the frontend so it has exact paths, request shapes,
response shapes, auth requirements, and error codes.

- **Base URL:** `/api/v1` (e.g. `https://<host>/api/v1/...`)
- **Healthcheck:** `GET /healthz` → `{ "status": "ok" }`
- **Swagger UI (live):** `GET /api-docs`
- **Auth:** Bearer JWT in the `Authorization` header — `Authorization: Bearer <accessToken>`
- **Content type:** `application/json` for all request bodies (except direct R2 file PUTs, which use the file's `mimeType`).

---

## Response envelopes

Every JSON response from this API follows one of two shapes.

### Success
```json
{
  "success": true,
  "data": { /* endpoint-specific payload, can also be null or an array */ }
}
```

### Error
```json
{
  "success": false,
  "errorCode": "USER_ALREADY_EXISTS",
  "message": "Human readable error message from server.",
  "stack": "..."   // only present when NODE_ENV !== 'production'
}
```

The HTTP status code matches the error severity (400, 401, 403, 404, 409, 429, 500, …).
Frontends should branch on `errorCode` (stable identifier), not `message` (localized,
may change). All known error codes are listed at the bottom of this document.

> ⚠️ Validation errors (Zod) are also surfaced as JSON, but the shape comes from
> the `zodValidator` middleware — handle them by checking `success === false` and
> the HTTP status (usually 400). Display `message` to the user as a fallback.

---

## Auth model

- The API issues a JWT (signed with `JWT_SECRET`, default 7-day expiry).
- Payload contains: `sub` (user id), `email`, `role`.
- Place the token in `Authorization: Bearer <token>`.
- `checkAuth` middleware validates the token AND re-fetches the user. If the user no longer exists, returns `INVALID_TOKEN`.
- `adminOnly` requires `user.role === "ADMIN"`. Returns `ADMIN_ONLY` (403) otherwise.
- `verifiedOnly` requires `user.isVerified === true` (phone OTP verified). Returns `USER_NOT_VERIFIED` (403) otherwise.

### User registration flow
1. `POST /auth/register` → user row created (`isVerified: false`); OTP SMS sent.
2. `POST /auth/verify-otp` → user activated, **access token returned**.
3. From then on, `POST /auth/login` returns an access token.

> Login before phone verification returns `PHONE_NOT_VERIFIED` (403). Surface a
> "verify your phone" screen and resend OTP via `POST /auth/resend-otp`.

### Frontend storage suggestion
Store the access token + a minimal user object (id, email, role, isVerified) in
secure storage (httpOnly cookie if backend supports it later; for now localStorage
on web / Keychain on mobile is acceptable). Clear on 401 `INVALID_TOKEN` /
`AUTH_REQUIRED`.

---

# Endpoints

The endpoints are grouped by feature. Each entry has:
- **Method + path** (full path under `/api/v1`)
- **Auth** required
- **Request** (params / query / body)
- **Success response** (status code + `data` shape)
- **Possible error codes** (mapped to HTTP status)

---

## 1. Auth

### `POST /auth/register`
Create a new user, send SMS OTP.

- **Auth:** none
- **Body:**
  ```ts
  {
    name: string;          // min 2 chars
    email: string;         // valid email
    password: string;      // min 6 chars
    phone: string;         // E.164, e.g. "+9779812345678"
  }
  ```
- **201 success →** `data`:
  ```ts
  {
    user: {
      id: string;
      name: string | null;
      email: string;
      username: string | null;
      avatar: string | null;
      phone: string;
      phoneVerifiedAt: string | null;     // ISO date
      isVerified: false;
      isOAuthUser: false;
      role: "USER" | "ADMIN";
      createdAt: string;
      updatedAt: string;
    };
    message: "OTP sent to phone. Verify to complete registration.";
  }
  ```
- **Errors:**
  - `USER_ALREADY_EXISTS` (409) — email already used
  - `PHONE_ALREADY_EXISTS` (409) — phone already used

---

### `POST /auth/login`
Email + password login. Requires verified phone.

- **Auth:** none
- **Body:**
  ```ts
  { email: string; password: string }
  ```
- **200 success →** `data`:
  ```ts
  {
    user: SafeUser;          // same shape as register's user (no password)
    accessToken: string;     // JWT
  }
  ```
- **Errors:**
  - `INVALID_CREDENTIALS` (401)
  - `PHONE_NOT_VERIFIED` (403) — user must finish OTP flow first

---

### `POST /auth/verify-otp`
Verify the 6-digit OTP. On success, activates the user and returns a token.

- **Auth:** none
- **Body:**
  ```ts
  { phone: string; otp: string /* 6 digits */ }
  ```
- **200 success →** `data`:
  ```ts
  {
    user: SafeUser;          // isVerified: true, phoneVerifiedAt set
    accessToken: string;
  }
  ```
- **Errors:**
  - `OTP_NOT_FOUND` (404) — no pending OTP / no user with that phone
  - `OTP_TOO_MANY_ATTEMPTS` (429) — ≥ 5 failed attempts
  - `OTP_EXPIRED` (400) — > 10 min old
  - `OTP_INVALID` (400) — code mismatch (attempts counter increments)
  - `USER_ALREADY_VERIFIED` (409)

### Constants
- OTP TTL: 10 minutes
- Max attempts per code: 5
- Resend cooldown: 60 seconds

---

### `POST /auth/resend-otp`
Re-issue a fresh OTP. Invalidates older unconsumed codes for the same phone.

- **Auth:** none
- **Body:** `{ phone: string }`
- **200 success →** `data: { message: "OTP resent." }`
- **Errors:**
  - `OTP_NOT_FOUND` (404) — phone not registered
  - `USER_ALREADY_VERIFIED` (409)
  - `OTP_RESEND_COOLDOWN` (429) — under 60s since last send

---

## 2. Issues (community reports)

Public listing/detail; create + vote require an authenticated **and verified** user.

### Enums
- `category`: `"ROADSIDE" | "VACANT_LAND" | "RIVERBANK" | "DRAINAGE" | "PARK_PUBLIC_SPACE" | "HIKING_TRAIL" | "OTHER"`
- `status`: `"OPEN" | "PROMOTED" | "EVENT_SCHEDULED" | "COMPLETED" | "REJECTED" | "DUPLICATE"`

### Issue object shape
```ts
type Issue = {
  id: string;            // uuid
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  voteCount: number;
  latitude: number;
  longitude: number;
  addressText: string;
  municipality: string | null;
  ward: string | null;
  reportedById: string | null;
  uploads?: Upload[];    // present on getById / create / list responses
  createdAt: string;
  updatedAt: string;
};
```

---

### `GET /issues`
List/feed of issues. Public.

- **Auth:** none
- **Query:**
  ```ts
  {
    status?: IssueStatus;
    category?: IssueCategory;
    sort?: "voteCount" | "createdAt";   // default: "voteCount"
    limit?: number;                     // 1..100, default 20
    cursor?: string;                    // uuid; pass nextCursor here
  }
  ```
- **200 success →** `data`:
  ```ts
  {
    items: Issue[];
    nextCursor: string | null;          // null when no more pages
  }
  ```

### Pagination contract
Pass `nextCursor` from the previous response as `cursor` in the next request.
When `nextCursor` is `null`, you have reached the end.

---

### `GET /issues/:id`
Public detail with attached uploads.

- **Auth:** none
- **Params:** `id` (uuid)
- **200 success →** `data: Issue` (with `uploads: Upload[]`)
- **Errors:** `ISSUE_NOT_FOUND` (404)

---

### `POST /issues`
Report a new issue.

- **Auth:** Bearer + verified
- **Body:**
  ```ts
  {
    title: string;            // 3..200 chars
    description: string;      // min 10
    category: IssueCategory;
    latitude: number;         // -90..90
    longitude: number;        // -180..180
    addressText: string;      // min 2
    municipality?: string;
    ward?: string;
    uploadIds?: string[];     // ≤ 10 confirmed uploads owned by caller (see Uploads section)
  }
  ```
- **201 success →** `data: Issue` (includes `uploads`)
- **Errors:**
  - `AUTH_REQUIRED` (401), `INVALID_TOKEN` (401)
  - `USER_NOT_VERIFIED` (403)
  - `UPLOAD_FORBIDDEN` (403) — one or more `uploadIds` were not owned, not confirmed, or already attached to another issue

> **Photos workflow:** call `/uploads/presign` → PUT file to R2 → `/uploads/:id/confirm` → pass the confirmed `upload.id` values in `uploadIds`. See the Uploads section.

---

### `POST /issues/:id/vote`
Upvote an issue (one per user). May trigger promotion + SMS fan-out to all voters.

- **Auth:** Bearer + verified
- **Params:** `id` (uuid)
- **Body:** none
- **201 success →** `data`:
  ```ts
  { voteCount: number; promoted: boolean }
  ```
- **Errors:**
  - `AUTH_REQUIRED` (401), `INVALID_TOKEN` (401), `USER_NOT_VERIFIED` (403)
  - `ISSUE_NOT_FOUND` (404)
  - `ISSUE_NOT_OPEN` (409) — vote only allowed while `status === "OPEN"`
  - `ALREADY_VOTED` (409)

> Promotion threshold is server-config (`ISSUE_PROMOTION_THRESHOLD`, default 10).
> Don't hardcode this in the UI — read `voteCount` + `status` from the issue.

---

### `DELETE /issues/:id/vote`
Retract your vote. Allowed only while issue is `OPEN`.

- **Auth:** Bearer + verified
- **Params:** `id` (uuid)
- **200 success →** `data: { voteCount: number }`
- **Errors:**
  - `AUTH_REQUIRED`, `INVALID_TOKEN`, `USER_NOT_VERIFIED`
  - `ISSUE_NOT_FOUND` (404)
  - `ISSUE_NOT_OPEN` (409)
  - `VOTE_NOT_FOUND` (404) — caller had no vote on this issue

---

## 3. Uploads (presigned R2 file uploads)

Two-step flow:
1. **Presign** — server returns a presigned R2 URL + a DB row (`isConfirmed: false`).
2. **Client PUTs** the file directly to that URL (`Content-Type: <mimeType>`).
3. **Confirm** — server checks the key exists in R2 and flips `isConfirmed: true`.

### Upload object shape
```ts
type Upload = {
  id: string;
  slug: string;             // short public id used in /uploads/:slug
  filename: string;
  fileType: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT" | "ARCHIVE" | "OTHER";
  mimeType: string;
  size: number;             // bytes
  isPublic: boolean;
  isConfirmed: boolean;
  bucket: string;
  key: string;              // R2 key (storage path)
  url: string | null;       // permanent public URL (only when isPublic && confirmed)
  metadata: Record<string, unknown> | null;
  userId: string | null;
  downloadUrl: string | null; // signed URL for private files; permanent URL for public — server-issued
  createdAt: string;
  updatedAt: string;
};
```

---

### `POST /uploads/presign`
Request an upload URL. Creates an unconfirmed Upload row.

- **Auth:** Bearer
- **Body:**
  ```ts
  {
    filename: string;        // 1..255
    mimeType: string;        // 1..255 (e.g. "image/png")
    size: number;            // positive int, bytes
    isPublic?: boolean;      // default false
    fileType?: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT" | "ARCHIVE" | "OTHER";
    metadata?: Record<string, unknown>;
  }
  ```
- **201 success →** `data`:
  ```ts
  {
    upload: Upload;          // isConfirmed: false; downloadUrl: null
    presignedUrl: string;    // PUT here within `expiresIn` seconds
    expiresIn: number;       // 300 (5 min)
  }
  ```
- **Errors:** `AUTH_REQUIRED`, `INVALID_TOKEN`, `UPLOAD_SLUG_GENERATION_FAILED` (500, very rare)

### Client PUT (NOT this API — direct to R2)
```http
PUT <presignedUrl>
Content-Type: <mimeType>
Body: <raw file bytes>
```
On success R2 returns 200/204. Do not include the bearer token; the URL is already signed.

---

### `POST /uploads/:id/confirm`
Confirm the file has been PUT. Required before the upload can be attached to an issue or fetched.

- **Auth:** Bearer (must be the uploader)
- **Params:** `id` (uuid)
- **200 success →** `data: Upload` (with `isConfirmed: true`, `downloadUrl` populated)
- **Errors:**
  - `AUTH_REQUIRED`, `INVALID_TOKEN`
  - `UPLOAD_NOT_FOUND` (404)
  - `UPLOAD_FORBIDDEN` (403) — caller isn't the owner
  - `UPLOAD_KEY_NOT_FOUND` (404) — the file isn't actually in R2 yet

> If the upload is already confirmed, the endpoint is idempotent and just returns the row.

---

### `GET /uploads/me`
List the current user's uploads (newest first). Each item has a fresh `downloadUrl`.

- **Auth:** Bearer
- **200 success →** `data: Upload[]`
- **Errors:** `AUTH_REQUIRED`, `INVALID_TOKEN`

---

### `GET /uploads/:slug`
Fetch a single upload by its **slug** (not id). Public uploads are open; private ones require ownership.

- **Auth:** optional Bearer (required for private)
- **Params:** `slug` (string)
- **200 success →** `data: Upload`
- **Errors:**
  - `UPLOAD_NOT_FOUND` (404)
  - `UPLOAD_FORBIDDEN` (403) — private upload, requester is not the owner

---

### `PATCH /uploads/:id/visibility`
Flip public/private. If the upload is confirmed, the file is physically moved between public/private prefixes in R2.

- **Auth:** Bearer (owner)
- **Params:** `id` (uuid)
- **Body:** `{ isPublic: boolean }`
- **200 success →** `data: Upload`
- **Errors:** `AUTH_REQUIRED`, `INVALID_TOKEN`, `UPLOAD_NOT_FOUND`, `UPLOAD_FORBIDDEN`

> After flipping to public, `url` becomes a permanent CDN URL. After flipping to
> private, `url` becomes `null` and `downloadUrl` is a short-lived signed URL.

---

### `DELETE /uploads/:id`
Delete the upload (removes file from R2 if confirmed).

- **Auth:** Bearer (owner)
- **Params:** `id` (uuid)
- **200 success →** `data: null`
- **Errors:** `AUTH_REQUIRED`, `INVALID_TOKEN`, `UPLOAD_NOT_FOUND`, `UPLOAD_FORBIDDEN`

---

### Admin upload endpoints

#### `GET /admin/uploads`
List all uploads with optional filters.

- **Auth:** Bearer + admin
- **Query:**
  ```ts
  {
    isPublic?: "true" | "false";
    isConfirmed?: "true" | "false";
    userId?: string;            // uuid
  }
  ```
- **200 success →** `data: Upload[]`
- **Errors:** `AUTH_REQUIRED`, `INVALID_TOKEN`, `ADMIN_ONLY` (403)

#### `DELETE /admin/uploads/:id`
Force-delete any upload.

- **Auth:** Bearer + admin
- **Params:** `id` (uuid)
- **200 success →** `data: null`
- **Errors:** `AUTH_REQUIRED`, `INVALID_TOKEN`, `ADMIN_ONLY`, `UPLOAD_NOT_FOUND`

---

## 4. Feedback

Public form submit; everything else is admin-only.

### Enums
- `type`: `"SUGGESTION" | "BUG_REPORT" | "QUESTION" | "GENERAL"`
- `status`: `"NEW" | "REVIEWED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"`

### Feedback object
```ts
type Feedback = {
  id: string;
  name: string;
  email: string;
  type: FeedbackType;
  message: string;
  experienceRating: number | null;   // 1..5 if provided
  screenshot: string | null;         // URL string
  status: FeedbackStatus;
  adminReply: string | null;
  reviewedBy: string | null;         // admin user id
  createdAt: string;
  updatedAt: string;
};
```

---

### `POST /feedback`
Submit feedback (public form).

- **Auth:** none
- **Body:**
  ```ts
  {
    name: string;
    email: string;
    type: FeedbackType;
    message: string;
    experienceRating?: number;   // 1..5 integer
    screenshot?: string;         // URL (upload first via /uploads, then send url)
  }
  ```
- **201 success →** `data: Feedback`

---

### `GET /feedback`
List feedback. Admin only.

- **Auth:** Bearer + admin
- **Query:**
  ```ts
  { type?: FeedbackType; status?: FeedbackStatus }
  ```
- **200 success →** `data: Feedback[]`
- **Errors:** `AUTH_REQUIRED`, `INVALID_TOKEN`, `ADMIN_ONLY`

---

### `GET /feedback/:id`
- **Auth:** Bearer + admin
- **200 success →** `data: Feedback`
- **Errors:** `ADMIN_ONLY`, `FEEDBACK_NOT_FOUND` (404)

### `DELETE /feedback/:id`
- **Auth:** Bearer + admin
- **200 success →** `data: null`
- **Errors:** `ADMIN_ONLY`, `FEEDBACK_NOT_FOUND`

---

### `PATCH /feedback/:id/status`
- **Auth:** Bearer + admin
- **Body:** `{ status: FeedbackStatus }`
- **200 success →** `data: Feedback`   (`reviewedBy` set to current admin)
- **Errors:** `ADMIN_ONLY`, `FEEDBACK_NOT_FOUND`

### `PATCH /feedback/:id/reply`
- **Auth:** Bearer + admin
- **Body:** `{ adminReply: string }`
- **200 success →** `data: Feedback` (`adminReply` set, `reviewedBy` set)
- **Errors:** `ADMIN_ONLY`, `FEEDBACK_NOT_FOUND`

---

## 5. Participation Applications

Public form submit; admin manages.

### Enums
- `role`: `"FRONTEND_DEVELOPER" | "BACKEND_DEVELOPER" | "UI_UX_DESIGNER" | "GRAPHICS_DESIGNER" | "LEGAL" | "FINANCE" | "DONOR" | "COMMUNITY_MANAGER" | "VOLUNTEER" | "OTHER"`
- `status`: `"SUBMITTED" | "UNDER_REVIEW" | "SHORTLISTED" | "ONBOARDING" | "ACTIVE" | "REJECTED"`

### Application object
```ts
type ParticipationApplication = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: ApplicationRole;
  experience: string | null;
  motivation: string;
  additionalInfo: string | null;
  portfolio: string | null;      // URL
  resumeUrl: string | null;      // URL
  status: ApplicationStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
};
```

---

### `POST /applications`
Submit a contributor application (public form).

- **Auth:** none
- **Body:**
  ```ts
  {
    name: string;
    email: string;
    phone?: string;
    role: ApplicationRole;
    experience?: string;
    motivation: string;
    additionalInfo?: string;
    portfolio?: string;        // URL
    resumeUrl?: string;        // URL (upload via /uploads first if hosting a file)
  }
  ```
- **201 success →** `data: ParticipationApplication`

---

### `GET /applications`
List applications. Admin only.

- **Auth:** Bearer + admin
- **Query:**
  ```ts
  { role?: ApplicationRole; status?: ApplicationStatus }
  ```
- **200 success →** `data: ParticipationApplication[]`
- **Errors:** `AUTH_REQUIRED`, `INVALID_TOKEN`, `ADMIN_ONLY`

---

### `GET /applications/:id`
- **Auth:** Bearer + admin
- **200 success →** `data: ParticipationApplication`
- **Errors:** `ADMIN_ONLY`, `APPLICATION_NOT_FOUND` (404)

### `DELETE /applications/:id`
- **Auth:** Bearer + admin
- **200 success →** `data: null`
- **Errors:** `ADMIN_ONLY`, `APPLICATION_NOT_FOUND`

### `PATCH /applications/:id/status`
- **Auth:** Bearer + admin
- **Body:** `{ status: ApplicationStatus }`
- **200 success →** `data: ParticipationApplication`
- **Errors:** `ADMIN_ONLY`, `APPLICATION_NOT_FOUND`

### `PATCH /applications/:id/notes`
- **Auth:** Bearer + admin
- **Body:** `{ adminNotes: string }`     // non-empty
- **200 success →** `data: ParticipationApplication`
- **Errors:** `ADMIN_ONLY`, `APPLICATION_NOT_FOUND`

---

# Error code reference

`errorCode` is stable; `message` is whatever is stored in the `ErrorList` table.
Branch on `errorCode` in code; render `message` for the user.

| Code                           | HTTP | Where it fires                                                                |
| ------------------------------ | ---- | ------------------------------------------------------------------------------ |
| `AUTH_REQUIRED`                | 401  | Missing/invalid `Authorization` header                                         |
| `INVALID_TOKEN`                | 401  | Token expired, malformed, or user no longer exists                             |
| `ADMIN_ONLY`                   | 403  | Non-admin hit an admin route                                                   |
| `USER_NOT_VERIFIED`            | 403  | Verified-only route, but `isVerified` is false                                 |
| `USER_ALREADY_EXISTS`          | 409  | Register: email already taken                                                  |
| `PHONE_ALREADY_EXISTS`         | 409  | Register: phone already taken                                                  |
| `INVALID_CREDENTIALS`          | 401  | Login: wrong email or password                                                 |
| `PHONE_NOT_VERIFIED`           | 403  | Login: phone OTP not verified                                                  |
| `USER_ALREADY_VERIFIED`        | 409  | OTP verify/resend on an already-verified account                               |
| `OTP_NOT_FOUND`                | 404  | No pending OTP / phone not registered                                          |
| `OTP_INVALID`                  | 400  | Wrong 6-digit code (attempts increment)                                        |
| `OTP_EXPIRED`                  | 400  | Older than 10 min                                                              |
| `OTP_TOO_MANY_ATTEMPTS`        | 429  | ≥ 5 failed attempts on this OTP                                                |
| `OTP_RESEND_COOLDOWN`          | 429  | < 60 s since last send                                                         |
| `ISSUE_NOT_FOUND`              | 404  | Issue by id / vote target                                                      |
| `ISSUE_NOT_OPEN`               | 409  | Voting/unvoting on a non-OPEN issue                                            |
| `ALREADY_VOTED`                | 409  | Duplicate vote                                                                 |
| `VOTE_NOT_FOUND`               | 404  | Unvote with no existing vote                                                   |
| `UPLOAD_NOT_FOUND`             | 404  | Upload by id / slug doesn't exist                                              |
| `UPLOAD_FORBIDDEN`             | 403  | Not the owner; or attaching an upload you don't own/confirmed/already attached |
| `UPLOAD_KEY_NOT_FOUND`         | 404  | Confirm called before file was PUT to R2                                       |
| `UPLOAD_SLUG_GENERATION_FAILED`| 500  | Could not generate a unique slug after 5 tries                                 |
| `FEEDBACK_NOT_FOUND`           | 404  | Feedback by id                                                                 |
| `APPLICATION_NOT_FOUND`        | 404  | Application by id                                                              |
| `UNKNOWN_ERROR`                | 500  | Catch-all                                                                      |

> The actual `message` text and `responseCode` (HTTP) are stored in the `ErrorList`
> table, keyed by `errorCode` + `lang`. The HTTP codes above are the current
> defaults; the runtime authoritative source is the response itself.

---

# Frontend integration tips

### 1. A typed API client
Define an `api` helper that:
- Adds `Authorization: Bearer <token>` when a token exists.
- Parses every response as `{ success, data } | { success, errorCode, message }`.
- Throws a typed `ApiError(errorCode, message, status)` on `success === false`.
- Auto-logs out on `INVALID_TOKEN` / `AUTH_REQUIRED`.

### 2. File upload helper
```ts
async function uploadFile(file: File, isPublic = false) {
  // 1. presign
  const { upload, presignedUrl } = (await api.post("/uploads/presign", {
    filename: file.name,
    mimeType: file.type,
    size: file.size,
    isPublic,
    fileType: file.type.startsWith("image/") ? "IMAGE" : "OTHER",
  })).data;

  // 2. PUT to R2 directly — no auth header
  await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  // 3. confirm
  const confirmed = (await api.post(`/uploads/${upload.id}/confirm`)).data;
  return confirmed; // has downloadUrl
}
```

### 3. Issue creation with photos
```ts
const uploads = await Promise.all(files.map((f) => uploadFile(f, true)));
const issue = (await api.post("/issues", {
  title, description, category, latitude, longitude, addressText,
  uploadIds: uploads.map((u) => u.id),
})).data;
```

### 4. Pagination
```ts
let cursor: string | null = null;
const all: Issue[] = [];
do {
  const { items, nextCursor } = (await api.get("/issues", {
    params: { cursor, sort: "voteCount", limit: 20 },
  })).data;
  all.push(...items);
  cursor = nextCursor;
} while (cursor);
```

### 5. Vote optimistic UI
- Server is authoritative on `voteCount` and `promoted`. Use the response payload as the new truth.
- Handle `ALREADY_VOTED` by ignoring (treat as success) and re-fetching the issue.
- Handle `ISSUE_NOT_OPEN` by disabling the vote button and re-rendering status.

### 6. Auth guards
Map the three middlewares to UI guards:
- `checkAuth` → "must be signed in" screen.
- `verifiedOnly` → "verify your phone" screen (link to resend OTP).
- `adminOnly` → "admins only" / hidden in main app.

---

# Appendix: env-derived constants the frontend cares about

| Constant                  | Source                          | Default | Notes                                                  |
| ------------------------- | ------------------------------- | ------- | ------------------------------------------------------ |
| OTP TTL                   | hardcoded                       | 10 min  | Drives "code expired" UX                               |
| OTP max attempts          | hardcoded                       | 5       | Drives `OTP_TOO_MANY_ATTEMPTS` UX                      |
| OTP resend cooldown       | hardcoded                       | 60 s    | Drives the resend countdown timer                      |
| Presigned upload TTL      | `UPLOAD_PRESIGN_EXPIRES_IN`     | 300 s   | Returned in presign response as `expiresIn`            |
| Presigned download TTL    | `UPLOAD_DOWNLOAD_EXPIRES_IN`    | 3600 s  | Signed `downloadUrl` lifetime for private uploads      |
| Issue promotion threshold | `ISSUE_PROMOTION_THRESHOLD`     | 10      | Read `status` / `voteCount` from the API — don't hardcode |
| JWT expiry                | `JWT_EXPIRES_IN`                | 7d      | Frontend should treat 401 as "log in again"            |
