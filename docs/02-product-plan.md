# Shramdaan Product Plan

## Version Context

Version 1.0 is the first cleanup campaign's complete visible feature set: from issue listing to publishing the final campaign results.

## Product Goal

The first release should demonstrate the full public journey of a community cleanup campaign. The website should make it clear how a problem becomes visible, gains support, becomes a campaign, receives contributions, gets completed, and is published as an impact story.

The first release is frontend-first. Backend complexity should be represented through mock or static data until the real systems are ready.

## Version 1.0 Feature Set

Version 1.0 should include the following visible capabilities:

- Public issue listing for cleanup-related local problems.
- Issue discovery with clear status, location, urgency, and support count.
- Voting or support action to show community attention.
- Highlighting or ranking issues with stronger support.
- Issue detail view with context, location, photos or placeholders, and participation intent.
- Campaign conversion concept for issues that gain enough attention.
- Campaign detail view with time, place, goal, required help, and progress.
- Participation options for labor, time, funds, materials, or logistics.
- Donation intent UI without requiring a production payment backend in the first frontend version.
- Notification concept for nearby or interested people, shown as part of the experience.
- Completion summary with before-and-after evidence, participants, contribution summary, and outcome.
- Public impact publishing through blog, vlog, story, or result page.

## Issue Lifecycle

Issues should move through a simple visible lifecycle:

- Listed: A community problem has been submitted.
- Supported: People have voted or shown interest.
- Campaign Ready: The issue has enough attention to become an event.
- Scheduled: A cleanup campaign has date, time, and location.
- Active: People are joining or contributing.
- Completed: The work is done and ready for summary.
- Published: The result is public as an impact story.

The initial frontend may represent this lifecycle with sample data and clear status labels.

## Contribution Model

Shramdaan should support multiple contribution types:

- Labor donation for people who can physically attend.
- Time donation for coordination, outreach, documentation, or planning.
- Fund donation intent for expenses such as tools, transport, refreshments, or disposal.
- Material donation for gloves, bags, tools, cleaning supplies, or other campaign needs.
- Visibility support through sharing and inviting nearby people.

## Transparency Requirements

Every campaign should aim to show:

- What problem was selected.
- Why it mattered.
- Who participated.
- What support was needed.
- What support was received.
- What work was completed.
- What changed after the campaign.
- How funds or materials were used when applicable.

## Out Of Scope For Version 1.0 Frontend

The first frontend version should avoid overcommitting to:

- Final backend data models.
- Production payment processing.
- Real notification delivery.
- Identity verification flows.
- Moderation operations.
- Government or institutional workflows.

These can be represented as frontend concepts or future-ready placeholders.

## How To Update This Document

Update this document when the release scope, lifecycle, contribution model, or feature priority changes. Keep version 1.0 focused on the first cleanup campaign journey unless the product direction is explicitly expanded.
