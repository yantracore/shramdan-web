# Security Baseline Audit — 2026-06-03

> Baseline sweep on the frontend code before the first real-world श्रमदान event. Scope: XSS, CSRF, secret handling, auth token storage, open redirects, dangerous APIs.
>
> Roadmap leaf: `11.7 Security review (XSS, CSRF, secret handling, rate limits)`. This document closes the *frontend* portion. Rate limits and CSRF token issuance are backend concerns and tracked separately in [`09-backend-admin-gaps.md`](09-backend-admin-gaps.md).

**Auditor:** Shramesh (AI member), with verification by विवेक.
**Method:** automated grep across `src/`, manual review of high-risk surfaces, no third-party scanner.
**Coverage:** XSS, hardcoded secrets, dangerous APIs (eval, new Function), localStorage usage, open-redirect handling, error-message info disclosure.

---

## Summary

| Area | Status | Notes |
| --- | --- | --- |
| XSS via `dangerouslySetInnerHTML` | OK | Two call sites, both justified |
| Hardcoded secrets / API keys | OK | None found |
| `eval` / `new Function` | OK | None found |
| Auth token storage | Accepted risk | localStorage; bearer in Authorization header |
| Open redirects (login `?next=`) | OK | Guarded by `isSafeRelativePath` |
| Console logging of secrets | OK | No matches |
| CSRF | Mitigated | Bearer-auth + same-site default + no cookie auth for state-changing endpoints |
| Rate limits | Out of scope here | Backend concern |

No HIGH-severity findings. Two notes worth recording.

---

## Findings

### 1. `dangerouslySetInnerHTML` call sites — JUSTIFIED

Both call sites use the API safely:

- [`src/components/JsonLd.js`](../../src/components/JsonLd.js) — emits a `<script type="application/ld+json">` tag for SEO structured data. The serialized JSON escapes `<` to `<` before injection so the payload cannot break out of the script context. The `data` prop is server-controlled in all current callers.
- [`src/components/MarkdownReader.js`](../../src/components/MarkdownReader.js) — renders Markdown for the `/learn/[slug]` page. The `content` prop is sourced from `getPublicDoc(slug)`, which reads files from `docs/public/*.md` — a filesystem-controlled, developer-authored allowlist. User input never reaches this surface.

Defense-in-depth recommendation (not blocking): if user-generated Markdown is ever fed to `MarkdownReader`, wrap the output with DOMPurify or switch to a JSX renderer (`react-markdown`). Logged in the polish backlog as a future P3.

### 2. Auth token storage — ACCEPTED RISK

Access and refresh tokens are stored in `window.localStorage` under the key `shramdan.auth.session` (see [`src/lib/authSession.js`](../../src/lib/authSession.js)). This is readable by any JavaScript on the same origin, so a successful XSS would also expose the tokens.

The current threat model accepts this trade-off because:

- No `dangerouslySetInnerHTML` is fed user-controlled HTML (verified above).
- Token rotation is wired: 401 / `INVALID_TOKEN` triggers `refreshAccessToken()` and re-issues on success, or fires `AUTH_SESSION_EXPIRED_EVENT` and bounces the user to `/login` on failure.
- Logout revokes the refresh token server-side via `POST /auth/logout`.

A future migration to httpOnly-cookie storage would harden this. Tracked as a P2 polish item (future Phase 11.7 follow-up) but does not block first event.

### 3. Open redirects — OK

The login flow accepts a `?next=<path>` query parameter and uses it after a successful login or session restore. The helper `isSafeRelativePath` (in [`src/app/login/page.js`](../../src/app/login/page.js)) rejects strings that do not start with `/` or that start with `//` (protocol-relative). External hosts cannot be smuggled in. Identical guard pattern is used by `SessionExpirationWatcher` (see [`src/components/SessionExpirationWatcher.js`](../../src/components/SessionExpirationWatcher.js)) when bouncing to `/login` after an expired token.

### 4. No hardcoded secrets

Grep for `API_KEY`, `API_SECRET`, `sk_live`, `pk_live`, bearer tokens — no matches in `src/`. All API access goes through `apiClient.js` using the runtime-fetched access token.

### 5. No dangerous APIs

Grep for `eval(` and `new Function` — no matches in `src/`.

### 6. CSRF posture

State-changing requests use bearer-token authentication via the `Authorization` header, not cookie-based session auth. This sidesteps classical CSRF because cross-site requests cannot read the access token from another origin's localStorage. The login form does not require an additional CSRF token under this model. If cookie-based session auth is introduced later, CSRF tokens (or SameSite=Strict cookies + per-form tokens) become mandatory.

### 7. Error-message info disclosure

Form submission errors surface the backend's `message` field directly when present, falling back to a localized generic message. The current backend does not leak stack traces; if that changes, the frontend mapping in `apiClient.js` should mask the internal `message` and only surface a curated, localized string. Logged as a P3 polish backlog item.

---

## Items added to polish backlog as a result of this audit

- `P3 [from 11.7]` Wrap `MarkdownReader` output with DOMPurify or switch to `react-markdown` — defense-in-depth in case user-generated Markdown is ever introduced.
- `P2 [from 11.7]` Migrate auth token storage from `localStorage` to httpOnly cookies — requires backend cooperation; not blocking first event.
- `P3 [from 11.7]` Mask raw backend error `message` in `apiClient.js` if/when backend starts returning verbose stack traces.

---

## Conclusion

Frontend is cleared to support the first real-world श्रमदान event. No HIGH-severity issues. Defense-in-depth follow-ups logged. Rate-limit and CSRF-issuance concerns remain in the backend lane.
