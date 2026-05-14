# API Reference for Frontend Implementation

**Base URL:** `http://localhost:<PORT>/api/v1`  
**Auth:** Bearer token via `Authorization: Bearer <accessToken>` header (admin routes require `role: "ADMIN"`)

---

## Auth

### POST `/auth/register`
Register a new user.

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "StrongPassword123"
}
```

**Success `201`:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx123abc",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER",
      "isVerified": false,
      "isOAuthUser": false,
      "createdAt": "2026-05-12T10:00:00.000Z",
      "updatedAt": "2026-05-12T10:00:00.000Z"
    },
    "accessToken": "jwt_access_token_here"
  }
}
```

**Error `409` — User already exists:**
```json
{
  "success": false,
  "error": {
    "code": "USER_ALREADY_EXISTS",
    "message": "User already exists."
  }
}
```

---

### POST `/auth/login`
Login an existing user.

**Body:**
```json
{
  "email": "john@example.com",
  "password": "StrongPassword123"
}
```

**Success `200`:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx123abc",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER",
      "isVerified": false,
      "isOAuthUser": false,
      "createdAt": "2026-05-12T10:00:00.000Z",
      "updatedAt": "2026-05-12T10:00:00.000Z"
    },
    "accessToken": "jwt_access_token_here"
  }
}
```

**Error `401` — Invalid credentials:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid credentials."
  }
}
```

> **Note:** Store `accessToken` in memory or localStorage after login/register and attach it to all protected requests.

---

## Applications

### POST `/applications` — Public
Submit a contributor application.

**Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+9779800000000",
  "role": "BACKEND_DEVELOPER",
  "experience": "Built REST APIs with Express and Prisma.",
  "motivation": "I want to contribute to civic technology projects.",
  "additionalInfo": "Available on weekends.",
  "portfolio": "https://example.com",
  "resumeUrl": "https://example.com/resume.pdf"
}
```

**Required fields:** `name`, `email`, `role`, `motivation`

**`role` enum values:**
```
FRONTEND_DEVELOPER | BACKEND_DEVELOPER | UI_UX_DESIGNER |
GRAPHICS_DESIGNER | LEGAL | FINANCE | DONOR |
COMMUNITY_MANAGER | VOLUNTEER | OTHER
```

**Success `201`:** Application created successfully.

---

### GET `/applications` — 🔒 Admin
Get all applications. Supports optional query filters.

**Query params (optional):**
| Param | Values |
|-------|--------|
| `role` | `FRONTEND_DEVELOPER`, `BACKEND_DEVELOPER`, `UI_UX_DESIGNER`, `GRAPHICS_DESIGNER`, `LEGAL`, `FINANCE`, `DONOR`, `COMMUNITY_MANAGER`, `VOLUNTEER`, `OTHER` |
| `status` | `SUBMITTED`, `UNDER_REVIEW`, `SHORTLISTED`, `ONBOARDING`, `ACTIVE`, `REJECTED` |

**Success `200`:** Returns list of applications.

---

### GET `/applications/:id` — 🔒 Admin
Get a single application by UUID.

**Params:** `id` (UUID)

**Success `200`:** Returns the application object.

---

### DELETE `/applications/:id` — 🔒 Admin
Delete an application by UUID.

**Params:** `id` (UUID)

**Success `200`:** Application deleted successfully.

---

### PATCH `/applications/:id/status` — 🔒 Admin
Update the status of an application.

**Params:** `id` (UUID)

**Body:**
```json
{
  "status": "SHORTLISTED"
}
```

**`status` enum values:**
```
SUBMITTED | UNDER_REVIEW | SHORTLISTED | ONBOARDING | ACTIVE | REJECTED
```

**Success `200`:** Status updated successfully.

---

### PATCH `/applications/:id/notes` — 🔒 Admin
Add or update admin notes on an application.

**Params:** `id` (UUID)

**Body:**
```json
{
  "adminNotes": "Strong backend experience. Move to technical call."
}
```

**Success `200`:** Notes updated successfully.

---

## Feedback

### POST `/feedback` — Public
Submit feedback.

**Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "type": "BUG_REPORT",
  "message": "The dashboard submit button does not respond.",
  "experienceRating": 4,
  "screenshot": "https://example.com/uploads/bug.png"
}
```

**Required fields:** `name`, `email`, `type`, `message`

**`type` enum values:**
```
SUGGESTION | BUG_REPORT | QUESTION | GENERAL
```

**`experienceRating`:** Integer between `1` and `5` (optional)

**Success `201`:** Feedback created successfully.

---

### GET `/feedback` — 🔒 Admin
Get all feedback. Supports optional query filters.

**Query params (optional):**
| Param | Values |
|-------|--------|
| `type` | `SUGGESTION`, `BUG_REPORT`, `QUESTION`, `GENERAL` |
| `status` | `NEW`, `REVIEWED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` |

**Success `200`:** Returns list of feedback.

---

### GET `/feedback/:id` — 🔒 Admin
Get a single feedback entry by UUID.

**Params:** `id` (UUID)

**Success `200`:** Returns the feedback object.

---

### DELETE `/feedback/:id` — 🔒 Admin
Delete a feedback entry by UUID.

**Params:** `id` (UUID)

**Success `200`:** Feedback deleted successfully.

---

### PATCH `/feedback/:id/status` — 🔒 Admin
Update the status of a feedback entry.

**Params:** `id` (UUID)

**Body:**
```json
{
  "status": "IN_PROGRESS"
}
```

**`status` enum values:**
```
NEW | REVIEWED | IN_PROGRESS | RESOLVED | CLOSED
```

**Success `200`:** Status updated successfully.

---

### PATCH `/feedback/:id/reply` — 🔒 Admin
Add an admin reply to a feedback entry.

**Params:** `id` (UUID)

**Body:**
```json
{
  "adminReply": "Thanks, this has been sent to the product team."
}
```

**Success `200`:** Reply saved successfully.

---

## Quick Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | — | Register user |
| POST | `/auth/login` | — | Login user |
| POST | `/applications` | — | Submit application |
| GET | `/applications` | Admin | List applications |
| GET | `/applications/:id` | Admin | Get application |
| DELETE | `/applications/:id` | Admin | Delete application |
| PATCH | `/applications/:id/status` | Admin | Update status |
| PATCH | `/applications/:id/notes` | Admin | Update notes |
| POST | `/feedback` | — | Submit feedback |
| GET | `/feedback` | Admin | List feedback |
| GET | `/feedback/:id` | Admin | Get feedback |
| DELETE | `/feedback/:id` | Admin | Delete feedback |
| PATCH | `/feedback/:id/status` | Admin | Update status |
| PATCH | `/feedback/:id/reply` | Admin | Add reply |
