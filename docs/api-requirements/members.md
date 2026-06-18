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

A member's contribution applications (submitted through `/join` and similar surfaces) are the same records described in full in [`applications.md`](applications.md). The member-portal's "My applications" view reads those records scoped by the authenticated member's email and surfaces a subset of the fields under `id`, `role`, `status`, `submittedAt`, `decidedAt`, and `reviewerNote`. See `applications.md` for the full field list, state machine, attachment model, and admin operations.

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

## Public profile (Phase 7 — new in 2026-06-05 pivot)

The 2026-06-05 TV-app pivot introduces a public member-profile surface at `/members/[idOrSlug]`. This is the click-through target from member avatars rendered in comments, event rosters, discussion threads, and leader-nomination cards. The public profile must work for unauthenticated visitors (SEO + share-link friendly).

### publicProfile — fields

A `publicProfile` is a server-side projection of a `Member` record, restricted to fields the member has opted into making public. It is NOT a separate table; the backend computes this shape from the member row + the member's `publicProfilePreferences` sub-object.

- **id** (`string`, required, public) — member id; doubles as the `/members/[id]` route segment when `slug` is not set.
- **slug** (`string`, optional, public) — derived from `username` if present, otherwise from a hashed id-suffix. Used as the canonical `/members/[slug]` route. Slugs are immutable once issued so deep-links never break.
- **displayName** (`string`, required, public) — `name` from the underlying member row. Always shown — anonymous member profiles do not exist; members can EITHER have a public profile OR they cannot have posted under their identity. Anonymous posts route to the anonymous-author placeholder, not to a profile page.
- **avatarUrl** (`string`, optional, public) — `avatarUrl` from the member row. UI falls back to initials.
- **bio** (`string`, optional, public) — `bio` from the member row. Surfaced when set.
- **city** (`string`, optional, public) — surfaced when the member opted in via `publicProfilePreferences.showCity`.
- **memberSince** (`datetime`, required, public) — `createdAt` from the member row.
- **publicLanes** (`array of enum`, required, public) — derived from approved applications and active participations; surfaces the lanes (e.g. `EVENT_PARTICIPATION`, `DEVELOPMENT`) the member contributes through. Empty array for members with no active lane.
- **supportedIssueCount** (`number`, required, public) — count of issues the member has upvoted that are currently `OPEN` or `EVENT_SCHEDULED`. Drives the "X issues backed" badge.
- **participatedEventCount** (`number`, required, public) — count of past events the member attended.
- **leaderNominationCount** (`number`, optional, public) — count of nominations the member has received as event leader. Only surfaced when ≥ 1.
- **discussionsStartedCount** (`number`, required, public) — count of `DiscussionTopic` rows authored by this member where `anonymous === false`. (Anonymous topics are excluded from the member's public profile by design.)
- **featureProposalsCount** (`number`, required, public) — same as above, filtered to `kind: FEATURE_PROPOSAL`.
- **recentActivity** (`array of object`, required, public) — chronological feed (newest first, max 10) of public actions: supported issue, joined event, posted comment, opened discussion, etc. Each entry: `{ kind, when, target: { kind, id, slug, title } }`. Anonymous actions are excluded.

### publicProfilePreferences — fields (sub-object on the member row)

- **enabled** (`boolean`, required, internal default `true`) — master switch. When `false`, `/members/[id]` returns 404 for unauthenticated visitors and 403 for authenticated non-self visitors. The member's anonymous activity remains anonymous regardless; this controls the visibility of the profile *surface*, not retroactively the surfaced activity.
- **showCity** (`boolean`, required, internal default `true`) — gate for `city` projection.
- **showLanes** (`boolean`, required, internal default `true`) — gate for `publicLanes` + counts.
- **showRecentActivity** (`boolean`, required, internal default `true`) — gate for the `recentActivity` feed.

Members can edit `publicProfilePreferences` from their own `/me/settings` page. The backend rejects edits from a viewer that is not the owning member.

### Operations on public profile

| Operation          | Transport  | RBAC                 | Description |
|--------------------|------------|----------------------|-------------|
| Get public profile | REST GET   | Public               | `/members/{idOrSlug}` returns the publicProfile projection. 404 when `publicProfilePreferences.enabled === false` for visitors who are not the owning member. |
| Update preferences | REST PATCH | Owning member only   | `/members/me/public-profile-preferences`. |

### Validation rules (public profile)

- An admin cannot override `publicProfilePreferences.enabled` to `true` against the member's wishes. The flag is owner-controlled.
- If the member account is `SUSPENDED` or `DELETED`, the public profile returns 410 (gone) regardless of preferences.
- The `recentActivity` feed must be cache-able for at least 60 seconds (server-side); the spec does not require real-time freshness for this view.

### Relationships (public profile)

- A public profile references many `Issue`s through the supportedIssue projection.
- A public profile references many `Event`s through the participated-event projection.
- A public profile references many `DiscussionTopic`s — only non-anonymous ones.

---

## Future-proofing notes

- `organizationId` field — for future support where members belong to a partner organization. Safe to leave null in single-org operation.
- `kycRecordId` field — references a separate KYC submission record. Out of scope for the current member shape but tracked elsewhere in Phase 6.
- Multi-lane membership — a future surface may want to display all the lanes (Event-Participation, Development, Company-Management) a member is active in. Derived from applications and participations; no additional schema needed in MVP.
- `publicProfileBackgroundUrl` — let members upload a banner/cover image for their profile page. Deferred.
- `pronouns` field — surface in publicProfile when set. Deferred until member feedback asks for it.

---

## Recent changes

- `2026-06-17` — **Account security + auth surfaces wired.** `/me` gained an `AccountSecurity` card (`GET /auth/sessions`, `DELETE /auth/sessions/{id}`, `POST /auth/logout-all`, `DELETE /auth/me { password }`) and an optional `PhoneVerify` card (`POST /auth/phone/send-otp`, `POST /auth/phone/verify`). Member signup moved to the email-OTP application flow (`/auth/register` + `/auth/verify-otp` retired) — see [`applications.md`](applications.md). New `/reset-password` page wraps the now email-based `POST /auth/forgot-password` + `POST /auth/reset-password`; `POST /auth/resend-otp` now requires auth + a `{ channel: email|phone }` body.
- `2026-06-05` — Added Public profile section (Phase 7 pivot): `publicProfile` projection + `publicProfilePreferences` sub-object + `/members/[idOrSlug]` route. Linked from comments, rosters, and discussion threads.
- `2026-06-05` — Applications sub-entity collapsed to a pointer; full spec now lives in [`applications.md`](applications.md).
- `2026-06-03` — initial spec draft. Captures the member shape currently exercised through `/users`, `/applications`, and the member portal mocks. Includes the Applications sub-entity since it shares lifetime with the member.
