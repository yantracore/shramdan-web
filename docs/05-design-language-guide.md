# Shramdaan Design And Language Guide

## Version Context

Version 1.0 is the first cleanup campaign's complete visible feature set: from issue listing to publishing the final campaign results.

## Documentation Language

Project documentation should be written in English from this point forward so future threads and engineers can read and update it consistently.

User-facing product language may later be refined in Nepali, English, or bilingual formats depending on the audience and launch plan.

## Language Scope For Surfaces

- **Public site** (homepage and every public page under `/`, including `/join`, `/feedback`, future `/issues`, `/campaigns`, `/impact-stories`, public footer, error/empty states): bilingual EN ↔ NE with the toggle. All public-facing copy is translated.
- **Admin control center** (`/admin/*`, including every admin form, table, modal, status label, error message, and notes/reply UI): English only. Do not add NE translations or expose the language toggle here.
- **Member portal** (`/app/*`, once it ships): bilingual EN ↔ NE, treated like the public site.

When adding new copy, locate it correctly in `src/lib/siteContent.js` (or its successor) — admin strings should never appear under a translation key, and public strings should never be EN-only.

## Brand Feeling

Shramdaan should feel:

- Trustworthy.
- Local.
- Practical.
- Transparent.
- Hopeful.
- Community-owned.
- Action-oriented.

It should not feel like a complaint box, political platform, or heavy administrative system. The experience should gently move people toward doing something useful together.

## Tone Of Voice

Use clear, grounded language. Prefer practical words over abstract slogans.

Good language should:

- Explain the problem clearly.
- Make participation feel possible.
- Show respect for community effort.
- Emphasize visible outcomes.
- Make transparency feel normal.

Avoid language that:

- Overpromises impact.
- Blames institutions or individuals.
- Sounds overly corporate.
- Makes participation feel complicated.
- Hides uncertainty behind vague claims.

## Visual Direction

The interface should support clarity and trust.

Use:

- Clean spacing.
- Clear hierarchy.
- Strong readable typography.
- Status tags for issue and campaign stages.
- Progress indicators where useful.
- Before-and-after visuals for completed work.
- Maps or location cues when available.
- Icons for compact tags, cards, and small containers.

Avoid:

- Decorative layouts that distract from action.
- Dense text blocks without clear scanning points.
- Unclear contribution calls to action.
- Visual styles that make the platform feel like advertising instead of civic action.

## Admin List Pattern

Admin pages are desktop-first operational surfaces, but every list must also work
cleanly on intermediate laptop/tablet widths and handheld screens. Do not build
admin lists as table-only views.

For each admin list:

- Start from the shared `AdminResponsiveList` structure and the admin list CSS classes.
- Keep a full table view for wide desktop screens where column comparison is useful.
- Provide a stacked card/list view for narrower screens using the same data and actions.
- Switch to the card/list view before the table forces page-level horizontal overflow.
- Keep filters in a wrapping toolbar; controls should stack before they leave the panel.
- Keep refresh and secondary actions compact, wrapping below the title when needed.
- Let page titles and descriptions wrap naturally; do not hide the description just because the screen is narrow.
- Use `min-width: 0`, `overflow-wrap: anywhere`, and controlled internal scrolling for long names, emails, links, notes, and messages.
- Preserve the same core actions across table and card/list views: status changes, notes/replies, delete, and future row actions.
- Design the card/list structure so it can later map to the mobile app: primary identity first, status/type chips next, summary text, detail metadata, then actions.

Current admin list surfaces, including Applications and Feedback, should follow
this pattern. Future Issue, Event, Incident, Upload, role, and notification lists
should start from the same responsive pattern instead of receiving one-off
responsive fixes later.

## Admin Entity Routing And Create/Edit Pattern

Admin entities follow a consistent navigation shape so that future entities (issues,
events, incidents, uploads, roles, notifications) can be added without rethinking the
information architecture every time.

- **Sidebar** lists each admin entity once. The sidebar entry always links to the
  entity list page, not to a dashboard card.
- **List page** lives at `/admin/<entity>` (e.g. `/admin/issues`, `/admin/events`). It
  shows filters, a responsive table/card list, and per-row actions. The list page
  header (rendered through `AdminPanelHeading`) is the home for the **Create** button.
- **Create page** lives at `/admin/<entity>/create`. It is reached only from the
  primary "Create" button on the list page header.
- **Edit page** lives at `/admin/<entity>/<id>/edit`. It is reached from the row
  actions on the list page (or from a detail view).

### Why full-body pages, not modals or drawers

Entity create/edit forms in Shramdaan can carry meaningful payload (coordinates,
addresses, long descriptions, uploads, scheduling fields, planning notes, structured
sub-sections). Modals and drawers compress that work into a cramped surface that
hides the rest of the page, scrolls awkwardly, and does not survive a browser
refresh or a shared link.

Use full-body pages for create and edit so the work surface gets the room it needs,
deep-links are shareable, the back button works the way users expect, and the layout
can grow new sections without breaking out of an overlay container.

Modals and drawers remain appropriate for short, focused operations on top of an
existing list — confirmations, single-field status changes, quick notes — not for
creating or editing the entity as a whole.

### Required pieces on every create/edit page

- Wrap the page in `AdminShell` with a clear `title`.
- Use `AdminPanelHeading` with a back button (`ArrowLeftOutlined`) wired into the
  `actions` slot so the user can return to the list without using the browser back
  button.
- Lay out form fields with the shared `admin-form` / `admin-form-grid` /
  `admin-form-wide` classes so fields collapse cleanly to a single column on narrow
  screens.
- Place the primary submit button and a `Cancel` link back to the list page in
  `admin-form-actions` at the bottom of the form.
- On successful submit, route back to the list page (`router.push("/admin/<entity>")`)
  and surface a success message via Ant Design's `message` API.

### One shared form component per entity

Create and edit MUST render the exact same form. Extract the form into a single
component under `src/components/admin/<Entity>Form.js` and use it from both the
create page and the edit page.

- The form component owns the `Form.useForm()` instance, all `Form.Item` fields,
  their validation rules, the field grid layout, and the submit + cancel row. It
  does not own the page chrome (`AdminShell`, `AdminPanelHeading`, breadcrumbs).
- The form accepts at minimum: `initialValues`, `onSubmit`, `submitting`,
  `submitLabel`, and `cancelHref`. The parent page passes `submitLabel` ("Create
  issue" vs "Save changes") and an `onSubmit` that calls either `postJson` or
  `patchJson`.
- The form is **field-shape, not endpoint-shape**. It must not know whether it is
  in create or edit mode. The only thing different on edit is that
  `initialValues` is populated from a `GET /<entity>/{id}` fetch and the submit
  hits `patchJson(...)` instead of `postJson(...)`.
- When the edit page lands, it should fetch the entity, show a `Spin` while
  loading, then mount the form once data is available so `initialValues` is
  applied on first render. The shared form should also call `form.setFieldsValue`
  in an effect when `initialValues` changes, so late-arriving data still
  populates fields.
- Field changes that are NOT part of the full edit form — per-row status select,
  inline notes modal, KYC verification toggle — stay on the list page or on a
  dedicated single-field surface, not inside the shared entity form.

Future entities (events, incidents, uploads, roles, notifications) must follow
the same shared-form-per-entity pattern. Do not build a separate create form and
a separate edit form for the same entity.

### Create button placement on the list page

The list page header is the only entry point for creation. Add the create button to
`AdminPanelHeading`'s `actions` slot, immediately after the refresh button, as a
`primary` Ant Design button with `PlusOutlined`. The button text should read
`Create <entity-singular>` (e.g. "Create issue", "Create event"). The href points to
`/admin/<entity>/create`.

### Edit entry point from the list page

Each row in the list page renders its row actions in an `admin-row-actions` flex
container. The edit entry point is a secondary `Button` with `EditOutlined`
wrapped in a `Link` pointing to `/admin/<entity>/<id>/edit`. It sits alongside
the other row actions (view detail, status select, delete). Reserve modal/drawer
flows for short, focused operations; the full edit form always lives on the
dedicated edit page.

### Toasts (success and error messages)

Every page that submits to the API — public forms, admin lists, admin create/edit
pages — must surface a clear success or error toast after the request settles.
Toasts use Ant Design's `message` API, but they are wired through a single
app-wide context so they survive navigation (e.g. after a successful create that
calls `router.push(...)` the toast is still rendered on the next page).

How it is wired:

- The root `Providers` component (`src/app/providers.js`) wraps the tree in
  Ant Design's `<App component={false}>`. That mounts a long-lived
  `message` context holder at the document root.
- Pages and components call the `useToast` hook from `@/lib/toast` to get
  the shared `message` instance.

Usage in a page:

```js
import { useToast } from "@/lib/toast";

const toast = useToast();

try {
  await postJson("/issues", values, { requireAuth: true });
  toast.success("Issue created.");
  router.push("/admin/issues");
} catch (error) {
  toast.error(error.message || "Could not create issue.");
}
```

Rules:

- Never call `message.useMessage()` directly inside a page or component. The
  returned `contextHolder` would unmount with the page and the toast would
  disappear before the user can read it. Always use `useToast()`.
- Pair every awaited API call with a `toast.success` on the happy path and a
  `toast.error` in `catch`. Prefer the server-provided error message
  (`error.message`) and fall back to a localized generic message only when the
  server did not provide one.
- Toast strings on public surfaces (`/`, `/join`, `/feedback`, `/me`, `/login`,
  future `/issues`, `/campaigns`) must come from `copy[language]` so they
  translate. Toast strings inside `/admin/*` are English-only by the language
  scope rules above.

### Read-only entities

If an entity is intentionally read-only for the admin (because the backend or
product design says so — e.g. `applications` and `feedback`, which are created by the
public), omit the create button from the list header rather than disabling it. Keep
the rest of the pattern (filters, list, row actions) the same.

## Content Priorities

For issues, prioritize:

- What is the problem?
- Where is it?
- How much support does it have?
- What needs to happen next?

For campaigns, prioritize:

- When and where is the event?
- What help is needed?
- How can someone join or contribute?
- What will success look like?

For completed stories, prioritize:

- What changed?
- Who helped?
- What was contributed?
- What proof is available?
- What can others learn from it?

## Nepali Cultural Context

Shramdaan should preserve a Nepali community spirit even when documentation is in English. The product should respect local places, local contribution patterns, and the dignity of volunteer labor.

When user-facing Nepali copy is added later, it should be natural and complete rather than awkwardly mixed with English except where technical or widely used terms require it.

## How To Update This Document

Update this document when tone, visual direction, language policy, or cultural guidance changes. Keep this guide practical enough that future design and frontend work can follow it without needing extra interpretation.
