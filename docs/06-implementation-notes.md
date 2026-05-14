# Shramdaan Implementation Notes

## Version Context

Version 1.0 is the first cleanup campaign's complete visible feature set: from issue listing to publishing the final campaign results.

## Implementation Position

The first implementation should be frontend-first. It should communicate the full product journey without depending on final backend services.

Use mock or static data for issues, campaigns, support counts, participation, contribution needs, and completed impact stories until real APIs are available.

## Frontend Foundation

The initial frontend foundation uses Next.js App Router with React and Ant Design. The first screen is a responsive public experience that demonstrates the version 1.0 journey through mock data: issue discovery, campaign readiness, contribution intent, and published impact stories.

Project structure:

- `src/app` for App Router pages, layout, and global styles.
- `src/components` for reusable cards, status tags, contribution options, and story summaries.
- `src/data/mockData.js` for the current frontend-only issue, campaign, contribution, lifecycle, and impact story data.
- `src/styles` for page-level styling.

Keep the status values centralized and reuse existing components before creating new UI primitives.

## Engineering Guidance

Future implementation should:

- Keep the product fully responsive.
- Prefer reusable components for issue cards, campaign cards, status tags, progress indicators, contribution options, and story summaries.
- Keep issue and campaign statuses consistent across pages.
- Use safe frontend fallbacks for missing images, empty lists, loading states, and unavailable backend behavior.
- Avoid introducing backend assumptions that are hard to undo.
- Keep user actions clear even when they are simulated.
- Make transparency visible in campaign and result views.
- Update these docs whenever behavior, scope, or product meaning changes.

## Suggested Mock Data Areas

Initial mock data may include:

- Cleanup issues with title, location, category, description, support count, status, urgency, and image placeholder.
- Campaigns with date, time, meeting point, goal, help needed, progress, and organizer note.
- Contribution options for labor, time, funds, materials, logistics, and sharing.
- Completed stories with before-and-after evidence, participant count, contribution summary, and result description.

Mock data should be realistic enough to demonstrate the product, but should not pretend to be production data.

## Status Handling

Use a small, consistent set of statuses for version 1.0:

- Listed.
- Supported.
- Campaign Ready.
- Scheduled.
- Active.
- Completed.
- Published.

Status tags should stay consistent across cards, detail pages, filters, and story sections.

## Frontend Interaction Rules

For version 1.0, interactions may be simulated when backend systems are not ready.

Examples:

- A support button can update local UI state.
- A join campaign action can show a confirmation state.
- A donation intent action can explain next steps without processing payment.
- A notification concept can be shown as an opt-in or informational UI.
- A completed campaign can link to a static impact story.

Do not build production payment, notification, authentication, or moderation flows unless the project scope explicitly changes.

## Documentation Rules For Future Threads

Before implementing Shramdaan work, future threads should read:

- `docs/01-project-summary.md` for mission and philosophy.
- `docs/02-product-plan.md` for current feature scope.
- `docs/03-user-journeys.md` for user intent.
- `docs/04-website-structure.md` for page structure.
- `docs/05-design-language-guide.md` for tone and UI direction.
- `docs/06-implementation-notes.md` for technical guardrails.

When product behavior changes, update the relevant document in the same change.

## How To Update This Document

Update this document when implementation guardrails, mock data strategy, status handling, frontend interaction behavior, or documentation workflow changes. Keep it actionable for future engineers and Codex threads.
