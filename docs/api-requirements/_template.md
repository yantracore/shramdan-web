# [Entity Name]

> One-paragraph business description. Explain what this entity represents,
> when it is created, when it is deleted, and who interacts with it. Keep it
> readable — backend developers and AI agents both read this paragraph first
> to orient. Avoid jargon.

**Spec status:** `draft` | `stable` | `frozen`
**Last updated:** YYYY-MM-DD

---

## Fields

For each field, use this shape:

- **fieldName** (`type`, required | optional, public | internal) — one-line description of the field's meaning. Note non-obvious behaviour inline.

Conventions:

- `type` is plain English: `string`, `number`, `boolean`, `datetime`, `enum`, `object`, `array of …`. TypeScript syntax is not required.
- `public` means the field is returned in default read responses. `internal` means it is computed or stored server-side but not surfaced through the API.
- For enum fields, list the allowed values inline after the description.

Example:

- **id** (`string`, required, public) — unique identifier, server-generated.
- **status** (`enum`, required, public) — one of `draft`, `scheduled`, `live`, `completed`, `cancelled`.
- **scheduledAt** (`datetime`, optional, public) — ISO 8601. Required once `status` advances past `draft`.
- **internalNote** (`string`, optional, internal) — admin-side note; never returned in public responses.

---

## Validation rules

Business rules that go beyond type checking. Examples:

- `endDate` (if provided) must be after `startDate`.
- `status` may not move backwards (for instance `completed` cannot return to `live`).
- `slug` is lowercase, alphanumeric and hyphens only, maximum 80 characters.

Keep validation rules narrative. The backend developer will translate them into the appropriate constraints, triggers, or service-layer checks.

---

## Operations

| Operation | Transport | RBAC | Description |
|-----------|-----------|------|-------------|
| List      | REST GET  | Public | Returns a paginated list. |
| Get by id | REST GET  | Public | Returns a single entity by id or slug. |
| Create    | REST POST | Admin  | Creates a new entity. |
| Update    | REST PATCH | Admin | Partial update. |
| Delete    | REST DELETE | Admin | Soft delete. |

**Transport values:**

- `REST` — standard CRUD over HTTP. Default for most operations.
- `SSE` — server-streaming events to the client. Use when the client subscribes to a feed of one-way updates (live counts, status changes).
- `WebSocket` — bidirectional. Use when both sides emit messages (chat-like comment streams, presence).
- `Polling` — fallback only, when clients cannot use SSE or WebSocket.

**RBAC values:**

- `Public` — no authentication required.
- `Authenticated` — any logged-in user.
- `Admin` — platform administrator.
- `EventLeader` — the leader assigned to the specific event the operation targets.
- Other role names as defined in the project's roles narrative; use the same casing.

Multiple roles may be listed separated by `or` (for example, `Admin or EventLeader`).

---

## Filters (for List operations)

If the entity exposes a list operation, document its filters here. Otherwise delete this section.

- **filterName** (`type`) — what it filters by, example accepted values.
- Pagination: cursor-based, `limit` parameter, `nextCursor` returned in the response payload. Default page size if applicable.

---

## Relationships

Describe relationships in prose. Examples:

- An event has many participants. Each participant references one member.
- An event references exactly one event-type.
- A meeting belongs to one event and has many attendance records.

Avoid entity-relationship diagrams here. The backend developer will model the relations themselves; this section's job is to capture the business shape.

---

## Computed fields

Fields that appear flat in API responses but are derived from other tables on the backend side. Examples:

- **participantCount** — derived from the participants table; not stored on the event row itself.
- **isFull** — derived from `participantCount >= maxParticipants`.

If the entity has no computed fields, delete this section.

---

## State machine

If the entity has a status (or any state-bearing) field with non-trivial transitions, document allowed transitions here:

```
draft → scheduled  (requires: scheduledAt, meetupAddress; trigger: EventLeader)
scheduled → live   (trigger: EventLeader, or system at scheduledAt)
live → completed   (trigger: EventLeader)
any → cancelled    (trigger: EventLeader or Admin; one-way)
```

Note which role can trigger each transition. If the entity has no meaningful state machine, delete this section.

---

## Future-proofing notes

Things to consider leaving room for in the schema without implementing them in the MVP. Examples:

- `organizationId` field — for future multi-tenant support. Safe to leave null in single-org operation. Adding the column now avoids an expensive migration later.
- An extensible `translations` array shape rather than top-level `title_en` and `title_ne` fields — for future locales beyond English and Nepali.

If there is nothing to flag, delete this section.

---

## Recent changes

Most recent at the top. Trim to the last ten or so entries.

- `YYYY-MM-DD` — brief description of what was added, modified, or removed.
- `YYYY-MM-DD` — earlier change.
