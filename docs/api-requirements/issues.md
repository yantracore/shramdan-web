# Issues

> An **issue** is a community-reported problem at a physical location (an
> overgrown roadside, a clogged drain, a littered riverbank). Any verified
> member can report one with a cover photo, description, category and a map
> pin. Other members vote to support it; once support crosses a threshold the
> issue is promoted to a scheduled cleanup **event**. Moderators and admins
> triage issues — overriding status, force-converting to events, or taking
> down spam. The original reporter can refine their own issue while it is
> still open.

**Spec status:** `stable` (live on `backend.shramdan.org`)
**Last updated:** 2026-06-17

---

## Fields

- **id** (`string`, required, public) — unique identifier, server-generated.
- **slug** (`string`, required, public) — URL-friendly identifier; resolvable by the get-by-id route alongside the raw id.
- **translations** (`array of object`, required, public) — one entry per locale (`en`, `ne`), each `{ locale, title, description }`. The client picks the active locale and falls back en → ne → first.
- **category** (`enum`, required, public) — one of `ROADSIDE`, `VACANT_LAND`, `RIVERBANK`, `DRAINAGE`, `PARK_PUBLIC_SPACE`, `HIKING_TRAIL`, `OTHER`.
- **status** (`enum`, required, public) — one of `OPEN`, `EVENT_SCHEDULED`, `COMPLETED`, `REJECTED`, `DUPLICATE`.
- **addressText** (`string`, required, public) — human-readable address shown under the title.
- **latitude / longitude** (`number`, required, public) — map pin. On update the server re-resolves `provinceId` / `districtId` from these.
- **municipality / ward** (`string`, optional, public) — administrative location refinements.
- **coverImageId** (`string`, optional, public) — upload id used as the cover; surfaced via `uploads[]`.
- **uploads** (`array of object`, optional, public) — attached images/files; `coverImageId` points into this list.
- **voteCount** (`number`, required, public) — number of supporters; drives the promotion threshold.
- **reportedById** (`string`, required, public) — the member who authored the issue. Used to scope `GET /issues/me` and to authorize edits.
- **createdAt / updatedAt** (`datetime`, required, public) — ISO 8601.

---

## Validation rules

- A report requires a **verified** user. Attached uploads must be owned by the caller, confirmed, and not yet attached to another issue.
- **Edit (`PATCH /issues/{id}`) is allowed only for the original reporter, and only while `status = OPEN`.** At least one field must be provided. When `title` or `description` is edited, a `language` (`ne` | `en`) must accompany the update so the backend re-translates the other locale.
- Editing `latitude`/`longitude` re-resolves province/district; coordinates outside Nepal boundaries are rejected.
- `status` cannot be set to `EVENT_SCHEDULED` via the moderation status route — that state is reached only through the vote-threshold (or admin force-convert) flow.

---

## Operations

| Operation | Transport | RBAC | Description |
|-----------|-----------|------|-------------|
| List | REST GET | Public | Paginated, sorted by `voteCount` desc by default. |
| List mine | REST GET `/issues/me` | Authenticated | Issues authored by the caller; default `sort=createdAt`. Powers the member **My issues** surface. |
| Get by id | REST GET | Public | Single issue by id or slug. |
| Create | REST POST | Authenticated (verified) | Reports a new issue. |
| Update | REST PATCH | Reporter (author) | Author-only, OPEN-only partial update. |
| Set status | REST PATCH `/issues/{id}/status` | Moderator or Admin | Lifecycle override. |
| Convert to event | REST POST `/issues/{id}/convert-to-event` | Admin | Force-promote an OPEN issue. |
| Flag for moderation | REST POST `/issues/{id}/report` | Authenticated | One report per reporter; feeds the moderator queue. |
| Delete | REST DELETE | Moderator or Admin | Hard takedown for spam/abuse. **Not available to authors.** |

---

## Filters (for List operations)

Both `GET /issues` and `GET /issues/me` accept:

- **status** (`enum`) — `OPEN` | `EVENT_SCHEDULED` | `COMPLETED` | `REJECTED` | `DUPLICATE`.
- **category** (`enum`) — the category set above.
- **municipality** (`string`), **provinceId / districtId / reportedById** (`uuid`) — location / author scoping.
- **minVoteCount** (`number`), **sort** (`voteCount` | `createdAt`).
- Pagination: cursor-based, `limit` (≤ 100), `nextCursor` returned in the payload.

---

## State machine

```
OPEN → EVENT_SCHEDULED   (trigger: vote threshold, or Admin force-convert; not settable via /status)
OPEN → COMPLETED         (trigger: Moderator/Admin via /status)
OPEN → REJECTED          (trigger: Moderator/Admin via /status)
OPEN → DUPLICATE         (trigger: Moderator/Admin via /status)
any  → OPEN              (re-open; trigger: Moderator/Admin via /status)
```

The reporter can only edit content while the issue sits in `OPEN`.

---

## Gaps / requested capabilities

> Surfaced 2026-06-17 while building the member **My issues** (`/me/issues`) CRUD.

- **Author withdraw / delete is missing.** `DELETE /issues/{id}` is Moderator/Admin-only (a moderation takedown). A member has no way to retract or soft-delete their own report. The member My-issues UI therefore ships **Create + Read + Update only** — no delete affordance. **Requested:** an author-scoped withdraw — e.g. `POST /issues/{id}/withdraw` or letting the reporter set a `WITHDRAWN`/closed status on their own OPEN issue — so the "D" of the CRUD can be completed client-side without a moderator.

---

## Recent changes

- `2026-06-17` — Documented entity to back the member My-issues surface (`GET /issues/me` consumed; OPEN-only author edit wired). Logged the author withdraw/delete gap.
