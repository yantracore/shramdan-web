# Member

> A श्रमदान member is a registered participant in the platform — a person who has signed up, completed verification, and can support issues, join events, post comments, and submit contribution applications. The member is the central human entity around which most other entities (votes, participations, comments, applications) carry foreign keys. A platform member is distinct from a platform-level role-holder such as an Admin; the role attribute on a member records administrative privileges, while the lane in which the member contributes (Event-Participation, Development, Company-Management) is tracked through their applications and participations rather than as a top-level enum.

**Spec status:** `draft`
**Last updated:** 2026-06-03

---

## Fields

- **id** (`string`, required, public) — unique identifier, server-generated.
- **name** (`string`, required, public) — display name. Members can update this themselves.
- **username** (`string`, optional, public) — optional unique handle for member-to-member references in comments and mentions.
- **phoneNumber** (`string`, optional, internal) — for OTP signup and SMS notifications. Never returned in public read responses.
- **email** (`string`, optional, internal) — for email notifications. Never returned in public read responses unless the member opts into public email contact.
- **city** (`string`, optional, public) — display location. Surfaced on leaderboard cards and member profile.
- **avatarUrl** (`string`, optional, public) — profile photo. Optional; UI falls back to initials.
- **bio** (`string`, optional, public) — short self-description. Surfaced on public member profile pages.
- **role** (`enum`, required, public) — platform-level role. One of `USER`, `MODERATOR`, `ADMIN`. Default is `USER`. Changing this field requires Admin RBAC and cannot be applied by the current viewer to their own record.
- **isVerified** (`boolean`, required, public) — whether the member has completed OTP verification. Required for vote and join actions; unverified members can browse but not act.
- **medicalCredentialVerified** (`boolean`, optional, internal) — gate for the `MEDIC` participation role. Backend-managed; not user-editable.
- **leaderEligibility** (`enum`, optional, internal) — one of `NONE`, `PENDING_KYC`, `ELIGIBLE`. Backend-managed; controls whether the member can be assigned as event leader.
- **createdAt** (`datetime`, required, public) — when the member account was created.
- **lastSeenAt** (`datetime`, optional, internal) — timestamp of the member's last authenticated request. Used for activity analytics; not surfaced publicly.
- **preferences** (`object`, optional, internal) — opaque blob for user-set preferences such as preferred language (`en` or `np`), notification channels, etc.

---

## Validation rules

- `phoneNumber` and `email` cannot both be absent at member creation. At least one contactable identifier is required.
- `username`, when set, must be unique platform-wide, lowercase, alphanumeric and underscores only, maximum thirty characters.
- A member's own `role` cannot be changed by themselves; the backend rejects self-role-change requests.
- `name` is required at creation but may not be empty or whitespace-only.
- `isVerified` is server-managed; clients cannot toggle this directly. The transition from `false` to `true` happens via the OTP confirmation flow.

---

## Operations

| Operation | Transport | RBAC | Description |
|-----------|-----------|------|-------------|
| List members | REST GET | Admin | Paginated list with filters. Used by the admin control center. |
| Get member by id | REST GET | Public (display-safe fields only) or Admin (full record) | Single member profile. Public reads return name, username, city, avatar, bio. |
| Get my profile | REST GET | Authenticated (self) | Returns the current user's full record including internal fields. |
| Update my profile | REST PATCH | Authenticated (self) | Updates editable fields (name, username, city, avatar, bio, preferences). |
| Update member role | REST PATCH | Admin | Changes the platform role. Cannot be applied to self. |
| Verify medical credential | REST POST | Admin | Sets `medicalCredentialVerified` to true. Required before the member can hold the `MEDIC` participation role. |
| Promote leader eligibility | REST PATCH | Admin | Moves `leaderEligibility` between `NONE`, `PENDING_KYC`, and `ELIGIBLE`. |
| Soft-delete member | REST DELETE | Admin | Soft-deletes the member; cascades ownership of issues and uploads to a tombstone user rather than hard-deleting. |

---

## Filters (for List operations)

- **role** (`enum`) — filter by platform role.
- **isVerified** (`boolean`) — filter by verification status.
- **search** (`string`) — case-insensitive substring match against name, username, and email.
- Pagination: cursor-based, default `limit` of twenty.

---

## Relationships

- A member submits zero or more issues. Issue records carry a `reporterId` referencing the member.
- A member supports zero or more issues through votes. Vote records carry `memberId` and `issueId`.
- A member participates in zero or more events. Each participation is its own record — see `event-participants.md`.
- A member authors zero or more comments. See `comments.md`.
- A member submits zero or more contribution applications. See the Applications sub-entity below.
- A member leads zero or more events. The event's `leaderId` references back to the member.

---

## Computed fields

- **issuesFiled** — count of issues this member has submitted. Useful for member profile cards.
- **eventsJoined** — count of events the member has confirmed participation in. Surfaced on profile and leaderboard.
- **eventsLed** — count of events the member has led as `EventLeader`.
- **totalVotes** — count of issue votes this member has cast.
- **displayLocation** — `city` if set, otherwise null. UI may add a country fallback.

---

## Applications sub-entity

A member's contribution applications (submitted through `/join` and similar surfaces) carry a small set of fields that the member portal surfaces under "My applications":

- **id** (`string`, required, public) — unique identifier.
- **memberId** (`string`, required, public) — applicant member.
- **role** (`enum`, required, public) — the role being applied for. Examples: `FRONTEND_DEVELOPER`, `BACKEND_DEVELOPER`, `QA_ENGINEER`, `DEVOPS_ENGINEER`, `CONTENT_WRITER`, `TRANSLATOR`, `DESIGNER`, `PHOTOGRAPHER`, `LIVESTREAMER`, `COMMUNITY_MANAGER`. The enum is closed but extensible.
- **status** (`enum`, required, public) — one of `SUBMITTED`, `REVIEWING`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`.
- **submittedAt** (`datetime`, required, public).
- **decidedAt** (`datetime`, optional, public) — when status transitioned to `ACCEPTED` or `REJECTED`.
- **note** (`string`, optional, public) — message from the reviewer attached to the decision.

The application enum and the event-participant role enum are intentionally disjoint. Applications are about ongoing platform contribution; event participations are about a specific real-world event.

---

## State machine (for the member account itself)

```
(none)        → REGISTERED   (sign-up form submitted; member exists in DB)
REGISTERED    → VERIFIED     (OTP confirmation; isVerified = true)
VERIFIED      → ACTIVE       (implicit — any verified member is active)
ACTIVE        → SUSPENDED    (admin action; member can no longer act)
ACTIVE        → DELETED      (admin soft-delete; tombstone replaces the record)
SUSPENDED     → ACTIVE       (admin reinstates)
SUSPENDED     → DELETED      (admin soft-delete)
```

Note that the spec exposes this as the `isVerified` boolean plus an implicit deletion flag; an explicit `status` field on the member record is not necessarily required if backend prefers to model verification and deletion as separate flags.

---

## Future-proofing notes

- `organizationId` field — for future support where members belong to a partner organization. Safe to leave null in single-org operation.
- `kycRecordId` field — references a separate KYC submission record. Out of scope for the current member shape but tracked elsewhere in Phase 6.
- Multi-lane membership — a future surface may want to display all the lanes (Event-Participation, Development, Company-Management) a member is active in. Derived from applications and participations; no additional schema needed in MVP.

---

## Recent changes

- `2026-06-03` — initial spec draft. Captures the member shape currently exercised through `/users`, `/applications`, and the member portal mocks. Includes the Applications sub-entity since it shares lifetime with the member.
