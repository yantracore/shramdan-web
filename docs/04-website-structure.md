# Shramdaan Website Structure

## Version Context

Version 1.0 is the first cleanup campaign's complete visible feature set: from issue listing to publishing the final campaign results.

## Website Goal

The first website should be fully responsive and should present the complete public experience of a cleanup campaign. It should work well on mobile screens first, while still feeling polished on desktop.

The website should show how community action moves from problem discovery to completed impact.

## Primary Pages

### Route Architecture

Version 1.0 separates the public website from authenticated internal tools:

- `/` remains the public introduction and mission homepage.
- `/join` remains the public contributor application form.
- `/feedback` remains the public feedback form.
- `/login` is the shared authentication entry point for internal tools.
- `/admin` is the protected admin control center.
- `/app` is reserved for a future authenticated user/PWA-style web shell.

After login, admin users should be redirected to `/admin`. Non-admin users should
see an admin-access-required state until the future `/app` experience is built.

The first admin control center module should manage participation applications.
Feedback management follows as the second admin module. Issue, event, incident,
role assignment, and notification administration should wait until those backend
contracts are finalized.

### Public Home

Purpose: Introduce Shramdaan and guide people into active issues, campaigns, and completed impact.

Expected sections:

- Clear mission statement.
- Current cleanup issue or featured campaign.
- Active issues needing support.
- Upcoming or ready campaigns.
- Completed impact stories.
- Contribution paths for labor, time, funds, materials, or sharing.

### Issue Discovery

Purpose: Help people browse local cleanup issues and understand what needs attention.

Expected sections:

- Issue list or grid.
- Status, support count, location, category, and urgency.
- Sorting by support, recency, or campaign readiness.
- Filters for location and status when useful.
- Empty and loading states for future backend integration.

### Issue Detail

Purpose: Explain one issue clearly and invite support.

Expected sections:

- Issue title, location, status, and support count.
- Description of the problem.
- Visual evidence such as photos or placeholders.
- Why the issue matters.
- Support or vote action.
- Campaign readiness indicator.
- Related or nearby issues.

### Campaign Detail

Purpose: Help people understand and join an organized cleanup campaign.

Expected sections:

- Campaign title, location, date, time, and status.
- Campaign goal and expected outcome.
- Help needed by type.
- Volunteer participation action.
- Donation or material contribution intent.
- Progress indicators.
- Organizer notes and practical instructions.
- Public safety notices when relevant.
- Leader or admin-only incident controls when authenticated operational views exist.

### Participation Flow

Purpose: Let people express how they want to help without requiring full backend infrastructure in version 1.0.

Expected sections:

- Contribution type selection.
- Basic participation details.
- Confirmation or next-step screen.
- Clear message that participation has been registered or will be followed up.

### Impact Stories

Purpose: Publish completed work and build trust.

Expected sections:

- Completed campaign list.
- Before-and-after visuals.
- Summary of work completed.
- Volunteers and contribution summary.
- Fund or material usage summary when applicable.
- Blog or vlog-style story format.

### Operational Safety View

Purpose: Give event leaders, safety leads, medical professionals, and admins a private place to manage real-world risk.

Expected sections:

- Campaign status and risk level.
- Safety checklist and permission notes.
- Incident list with type, severity, status, assignee, and timestamps.
- Escalation actions for injury, conflict, land permission, weather, flood, theft, or property damage.
- Notification history and acknowledgement state.
- Evidence uploads where access control allows it.

This view should not be public by default. Public pages can show general safety notices without exposing sensitive incident details.

## Responsive Expectations

The website should be mobile-first. Important actions such as support, join, contribute, and share must remain easy to reach on small screens.

Desktop layouts can show richer summaries, side panels, maps, or progress sections, but mobile should never feel like a reduced afterthought.

## Future Mobile App Readiness

The website should be structured so future mobile app work can reuse the same product concepts:

- Issue cards.
- Status tags.
- Campaign cards.
- Contribution options.
- Impact story structure.
- Location-aware discovery.

The mobile app and authenticated web surfaces should share the same API contracts,
domain models, and permission rules. The public website can include introduction
and mission content that the mobile app does not need, because mobile app users
are expected to arrive with stronger product intent.

## How To Update This Document

Update this document when pages, navigation, major sections, or responsive behavior changes. Keep page descriptions focused on user purpose and visible content rather than backend implementation details.
