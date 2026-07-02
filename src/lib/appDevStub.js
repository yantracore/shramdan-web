// Staging stub for the App Development Tasks entity. Mirrors the public
// shape declared in docs/api-requirements/app-development.md so the page
// can be developed visually before the backend lands. Replace with a real
// fetch against /api/app-development once that endpoint exists.
//
// Representative Image rule: every task carries a real demo image — no
// empty placeholders. Images point at existing demo-event jpegs so the
// staging surface looks populated without needing new assets.

export const APP_DEV_TASKS = [
  {
    id: "task-1",
    slug: "improve-issue-list-filters",
    category: "frontend",
    branches: ["/issues", "filters"],
    status: "discussion",
    difficulty: "medium",
    skillTags: ["React", "AntD", "UX"],
    voteCount: 42,
    commentCount: 11,
    proposedBy: { id: "u-1", name: "विवेक", avatar: null },
    leader: null,
    createdAt: "2026-06-01T09:00:00Z",
    updatedAt: "2026-06-04T14:00:00Z",
    representativeImageUrl: "/images/demo-events/kamalpokhari-beautify.jpg",
    locales: {
      np: {
        title: "Issues page मा filter UX सुधार",
        summary:
          "बहुविकल्प filter, URL sync र mobile drawer — comma-separated category, district र status filter एकैचोटि अप्ट्यान्ड लागू गर्ने।"
      },
      en: {
        title: "Improve filter UX on the Issues list",
        summary:
          "Multi-select filters with URL sync and a mobile drawer — category, district, and status applied together without page jumps."
      }
    }
  },
  {
    id: "task-2",
    slug: "notifications-backend-wiring",
    category: "backend",
    branches: ["notifications"],
    status: "proposed",
    difficulty: "hard",
    skillTags: ["Node", "SSE", "Postgres"],
    voteCount: 28,
    commentCount: 6,
    proposedBy: { id: "u-2", name: "Anya R.", avatar: null },
    leader: null,
    createdAt: "2026-06-02T18:00:00Z",
    updatedAt: "2026-06-03T10:00:00Z",
    representativeImageUrl: "/images/demo-events/bagmati-cleanup.jpg",
    locales: {
      np: {
        title: "Notifications backend — SSE feed र persistent inbox",
        summary:
          "Bell icon हाल mock छ। Real backend feed जोडेर unread badge, dismiss, mark-all-read समर्थन गर्ने।"
      },
      en: {
        title: "Notifications backend — SSE feed + persistent inbox",
        summary:
          "Bell icon is currently mocked. Add real backend feed with unread badge, dismiss, and mark-all-read."
      }
    }
  },
  {
    id: "task-3",
    slug: "event-poster-templates",
    category: "design",
    branches: ["events", "branding"],
    status: "accepted",
    difficulty: "easy",
    skillTags: ["Figma", "Branding"],
    voteCount: 19,
    commentCount: 4,
    proposedBy: { id: "u-3", name: "Sara K.", avatar: null },
    leader: { id: "u-3", name: "Sara K.", avatar: null },
    createdAt: "2026-05-28T12:00:00Z",
    updatedAt: "2026-06-04T09:30:00Z",
    representativeImageUrl: "/images/demo-events/hanumante-live-poster.jpg",
    locales: {
      np: {
        title: "Event poster र thumbnail को Figma template",
        summary:
          "हरेक event-type का लागि poster र YouTube thumbnail को design template — coordinator ले एप मै customize गर्न मिल्ने।"
      },
      en: {
        title: "Figma templates for event posters and YouTube thumbnails",
        summary:
          "Design templates per event-type — coordinators customise inside the app without needing Figma access."
      }
    }
  },
  {
    id: "task-4",
    slug: "writers-handbook",
    category: "content",
    branches: ["docs", "voice"],
    status: "in_progress",
    difficulty: "medium",
    skillTags: ["Writing", "Nepali", "English"],
    voteCount: 33,
    commentCount: 9,
    proposedBy: { id: "u-4", name: "Bipin S.", avatar: null },
    leader: { id: "u-4", name: "Bipin S.", avatar: null },
    createdAt: "2026-05-20T15:00:00Z",
    updatedAt: "2026-06-04T20:00:00Z",
    representativeImageUrl: "/images/demo-events/suryabinayak-trees.jpg",
    locales: {
      np: {
        title: "श्रमदान writers' handbook — दुई भाषाको voice guide",
        summary:
          "NP-Devanagari र EN दुवै surface को tone, casing rules, brand language — handbook बनाएर सबै writer ले follow गर्ने।"
      },
      en: {
        title: "Shramdan writers' handbook — bilingual voice guide",
        summary:
          "Tone, casing rules, and brand language for both NP-Devanagari and EN surfaces — one handbook every contributor follows."
      }
    }
  },
  {
    id: "task-5",
    slug: "qa-checklist-mobile-shell",
    category: "qa",
    branches: ["mobile", "regression"],
    status: "proposed",
    difficulty: "easy",
    skillTags: ["Manual QA", "Playwright"],
    voteCount: 12,
    commentCount: 2,
    proposedBy: { id: "u-5", name: "Praveen M.", avatar: null },
    leader: null,
    createdAt: "2026-06-04T08:00:00Z",
    updatedAt: "2026-06-04T08:00:00Z",
    representativeImageUrl: "/images/demo-events/sinamangal-walk.jpg",
    locales: {
      np: {
        title: "Mobile shell को regression checklist",
        summary:
          "Bottom-nav, FAB, hamburger र pill nav — हरेक release अघि चलाउने १५-step manual checklist + Playwright spec।"
      },
      en: {
        title: "Regression checklist for the mobile shell",
        summary:
          "Bottom-nav, FAB, hamburger and pill nav — a 15-step manual checklist plus Playwright spec to run before each release."
      }
    }
  },
  {
    id: "task-6",
    slug: "transparency-ledger-public-view",
    category: "frontend",
    branches: ["transparency", "ledger"],
    status: "discussion",
    difficulty: "hard",
    skillTags: ["React", "Charts", "Finance"],
    voteCount: 51,
    commentCount: 14,
    proposedBy: { id: "u-6", name: "Manish G.", avatar: null },
    leader: null,
    createdAt: "2026-05-30T11:00:00Z",
    updatedAt: "2026-06-04T17:00:00Z",
    representativeImageUrl: "/images/demo-events/ratnapark-cleanup.jpg",
    locales: {
      np: {
        title: "Public transparency ledger — हरेक रुपैयाँको view",
        summary:
          "Donations, expenses र project-tied bucket हरूको public view — chart, filter र CSV export सहित।"
      },
      en: {
        title: "Public transparency ledger — see every rupee",
        summary:
          "Public view of donations, expenses, and project-tied buckets — with charts, filters, and CSV export."
      }
    }
  },
  {
    id: "task-7",
    slug: "community-onboarding-flow",
    category: "community",
    branches: ["onboarding", "new-members"],
    status: "shipped",
    difficulty: "medium",
    skillTags: ["UX", "Copywriting"],
    voteCount: 64,
    commentCount: 22,
    proposedBy: { id: "u-7", name: "Saroj T.", avatar: null },
    leader: { id: "u-7", name: "Saroj T.", avatar: null },
    createdAt: "2026-04-15T10:00:00Z",
    updatedAt: "2026-05-10T16:00:00Z",
    acceptedAt: "2026-04-20T10:00:00Z",
    shippedAt: "2026-05-10T16:00:00Z",
    shippedRef: "PR #142",
    representativeImageUrl: "/images/demo-events/durga-devi-paint.jpg",
    locales: {
      np: {
        title: "नयाँ member को onboarding tour",
        summary:
          "पहिलो login पछि app shell को 4-step spotlight tour — पहिले nav, vote, comment र help।"
      },
      en: {
        title: "Onboarding tour for new members",
        summary:
          "A 4-step spotlight tour after first login — nav, vote, comment, and help in that order."
      }
    }
  }
];
